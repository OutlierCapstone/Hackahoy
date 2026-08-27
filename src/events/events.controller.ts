// src/events/events.controller.ts
import { Controller, Get, Req } from '@nestjs/common';
import { EventsService } from './events.service';

// JwtAuthGuard·BanCheckGuard 는 전역 APP_GUARD 라 이미 모든 요청에 적용된다.
// 중복 @UseGuards 를 제거해 요청당 JWT 검증 DB 조회 중복을 없앤다.
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getEvents(@Req() req: any) {
    return this.eventsService.getUserEvents(req.user.id);
  }
}
