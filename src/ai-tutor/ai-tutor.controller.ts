import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AiTutorService } from './ai-tutor.service';

@Controller('ai-tutor')
export class AiTutorController {
  constructor(private readonly aiTutorService: AiTutorService) {}

  @Post('hint')
    async getAiHint(@Body('problemId') problemId: number, @Req() req: any) {
      const userId = req.user.id;
      const generatedHint = await this.aiTutorService.getAiHint(userId, Number(problemId));
      
      // 🔥 프론트엔드가 result.hint로 받을 수 있게 "hint" 키에 담아 보냄
      return { 
        success: true, 
        hint: generatedHint 
      };
    }

  @Post('recommend')
  async getAiRecommend(@Req() req: any) {
    const userId = req.user.id;
    const result = await this.aiTutorService.getAiRecommendation(userId);
    return { success: true, ...result };
  }
}