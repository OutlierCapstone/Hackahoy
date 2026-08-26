import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ProblemService } from './problem.service';
import { EventsService } from 'src/events/events.service';

// JwtAuthGuard·BanCheckGuard 는 전역 APP_GUARD 라 이미 모든 요청에 적용된다.
// 컨트롤러에서 다시 @UseGuards 로 걸면 요청마다 JWT 검증 DB 조회가 중복되어 느려진다.

@Controller('problem')
export class ProblemController {
  constructor(
    private readonly problemService: ProblemService,
    private readonly eventsService: EventsService,
  ) {}

  @Get('user-list')
  async getProblemsForUser(
    @Req() req: any,
    @Query('islandId') islandId?: string
  ) {
    return this.problemService.getProblemsForUser(
      req.user.id, 
      islandId ? Number(islandId) : undefined
    );
  }

  @Post(':id/submit')
  async submit(
    @Param('id') id: string,
    @Body('flag') flag: string,
    @Req() req: any,
  ) {  
      return await this.problemService.submitFlag({
      problemId: Number(id),
      userId: req.user.id,
      flag,
    });
  }

  @Get(':id')
  async getProblem(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    // 조회 이벤트 기록(분석용)은 응답을 지연시키지 않도록 비동기로 던진다.
    // 예전엔 이 INSERT 를 await 해서 문제 페이지 로딩에 DB 왕복이 한 번 더 붙었다.
    void this.eventsService
      .trackUserEvent(req.user.id, id, 'VIEW_PROBLEM')
      .catch(() => {});

    return this.problemService.getProblem(id, req.user.id);
  }

  @Get(':id/hint')
  async recordHintView(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    // 여기서 DB에 한 줄 저장!
    await this.eventsService.trackUserEvent(req.user.id, id, 'VIEW_HINT');
    return { success: true };
  }
}