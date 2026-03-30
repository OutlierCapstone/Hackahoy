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

    try {

      // 업로드 파일 저장
      const filePath = path.join(process.cwd(), `upload_${Date.now()}.png`);
      fs.writeFileSync(filePath, file.buffer);

      // Python script 경로
      const scriptPath = path.join(process.cwd(), "..", "ai", "clip_infer.py");

      console.log("Python script:", scriptPath);
      console.log("Image path:", filePath);

      // Python 실행
      const output = execSync(`python "${scriptPath}" "${filePath}"`).toString();

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

    }

  }

}