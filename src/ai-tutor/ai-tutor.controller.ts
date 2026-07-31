import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AiTutorService } from './ai-tutor.service';

@Controller('ai-tutor')
export class AiTutorController {
  constructor(private readonly aiTutorService: AiTutorService) {}

  @Post('hint')
    async getAiHint(@Body('problemId') problemId: number, @Req() req: any) {
      const userId = req.user.id;
      const result = await this.aiTutorService.getAiHint(userId, Number(problemId));

      // 프론트엔드는 result.hint 를 읽는다.
      // gated=true 면 힌트가 아니라 "먼저 시도하라" 는 안내 메시지이고,
      // 이 경우 LLM 호출도 hint_count 증가도 일어나지 않았다.
      return {
        success: true,
        ...result,
      };
    }

  @Post('recommend')
  async getAiRecommend(@Req() req: any) {
    const userId = req.user.id;
    const result = await this.aiTutorService.getAiRecommendation(userId);
    return { success: true, ...result };
  }
}