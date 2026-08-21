import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Controller()
export class AppController {

  @Post('check')
  @UseInterceptors(FileInterceptor('image'))
  async checkPerson(
      @UploadedFile() file: Express.Multer.File,
      @Body('name') name: string
  ) {

    if (!file) {
      return {
        result: false,
        message: "사진이 업로드되지 않았습니다."
      };
    }

    // 업로드 파일 저장.
    // finally 에서 지우기 위해 try 밖에서 선언한다. 예전에는 try 안에 있어서
    // 요청마다 upload_*.png 가 backend 작업 디렉터리에 영구히 쌓였다.
    //
    // 파일명이 `upload_${Date.now()}.png` 라 같은 밀리초에 들어온 두 요청이 같은
    // 경로를 쓰게 되고, 한쪽이 상대의 이미지를 판정하거나 상대가 아직 읽기 전에
    // finally 에서 파일을 지워 버릴 수 있었다. OS 가 유일성을 보장하는 요청별
    // 임시 디렉터리를 만들어 그 안에만 쓰고, 끝나면 그 디렉터리만 통째로 지운다.
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prob7-'));
    const filePath = path.join(workDir, 'upload.png');

    try {

      fs.writeFileSync(filePath, file.buffer);

      // Python script 경로
      const scriptPath = path.join(process.cwd(), "..", "ai", "clip_infer.py");

      console.log("Python script:", scriptPath);
      console.log("Image path:", filePath);

      // Python 실행.
      // 서버(Ubuntu)에는 `python` 이 없고 `python3` 만 있다.
      // `python` 으로 부르면 status 127: python: not found 로 매번 실패한다.
      const output = execSync(`python3 "${scriptPath}" "${filePath}"`).toString();

      console.log("PYTHON OUTPUT:", output);

      const scores = JSON.parse(output);

      const a = scores[0];
      const b = scores[1];
      const c = scores[2];

      // FLAG 조건
      if (a > b + c) {
        return {
          result: true,
          message: "문이 열렸습니다. \n hackahoy{D0OR 1s o9en}"
        };
      }

      return {
        result: false,
        message: "출입이 허가된 인물이 아닙니다."
      };

    } catch (err) {

      console.error(err);

      return {
        result: false,
        message: "서버 오류가 발생했습니다."
      };

    } finally {

      // 판정이 끝났으면 업로드본은 쓸모가 없다.
      // 베타처럼 업로드가 몰리면 디스크가 그대로 찬다.
      // 이 요청이 만든 디렉터리만 지우므로 동시 요청에 영향을 주지 않는다.
      try {
        fs.rmSync(workDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error("업로드 임시 디렉터리 삭제 실패:", workDir, cleanupErr);
      }

    }

  }

}