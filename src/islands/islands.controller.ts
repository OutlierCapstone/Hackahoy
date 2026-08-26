import { Controller, Get, Param, Req, ParseIntPipe } from '@nestjs/common';
import { IslandsService } from './islands.service';

// JwtAuthGuard·BanCheckGuard 는 app.module 의 전역 APP_GUARD 라 모든 요청에 이미 적용된다.
// 여기서 @UseGuards 로 다시 걸면 인증 요청마다 JWT 전략(DB 조회)이 한 번 더 돌아
// 로컬 응답이 느려졌다(중복 제거). req.user 는 전역 가드가 채워 준다.
@Controller('islands')
export class IslandsController {
  constructor(private readonly islandsService: IslandsService) {}

  @Get()
  getAllIslands() {
    return this.islandsService.getAllIslands();
  }

  @Get(':id/problems')
  async getIslandProblems(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user.id;
    return this.islandsService.getProblems(id, userId);
  }
}
