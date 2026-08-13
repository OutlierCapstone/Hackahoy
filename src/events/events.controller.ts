// src/events/events.controller.ts
import { Controller, Get, Req } from '@nestjs/common';
import { EventsService } from './events.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BanCheckGuard } from 'src/common/guard/ban-check.guard';


@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(JwtAuthGuard, BanCheckGuard)
  @Get()
  async getEvents(@Req() req: any) {
    return this.eventsService.getUserEvents(req.user.id);
  }
}
