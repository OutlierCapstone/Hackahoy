import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AiTutorService } from './ai-tutor.service';

@Controller('ai-tutor')
export class AiTutorController {
  constructor(private readonly aiTutorService: AiTutorService) {}

  @Post('debug')
  async debugLog(@Body('problemId') problemId: number, @Req() req: any) {
    const userId = req.user?.id; // 인증 미들웨어가 있다면 사용
    
    const data = await this.aiTutorService.getDebugContext(userId, Number(problemId));
    
    // 🔥 여기가 핵심: 백엔드 터미널에 촤르륵 출력됨
    console.log("---------- [AI TUTOR DEBUG DATA] ----------");
    console.log(JSON.stringify(data, null, 2));
    console.log("-------------------------------------------");

    return { success: true, message: "백엔드 터미널을 확인하세요", data };
  }

  @Post('record')
  async recordHint(@Body() body: { problemId: number; content: string }, @Req() req: any) {
    // 인증 미들웨어를 통해 유저 ID를 가져온다고 가정합니다.
    const userId = req.user?.id; 
    
    const result = await this.aiTutorService.createHintRecord(
      userId, 
      Number(body.problemId), 
      body.content
    );

    return { success: true, hintCount: result.hintCount };
  }

  @Post('recommend-context')
  async printRecommendContext(@Req() req: any) {
    const userId = req.user?.id || "test-user-id"; // 인증 미들웨어에 맞춰 수정
    
    const context = await this.aiTutorService.getSolvedProblemContext(userId);

    console.log("---------- [AI TUTOR RECOMMENDATION CONTEXT] ----------");
    console.log(JSON.stringify(context, null, 2));
    console.log("-------------------------------------------------------");

    return { success: true, data: context };
  }
}