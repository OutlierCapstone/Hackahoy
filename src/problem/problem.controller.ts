import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ProblemService } from './problem.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { EventsService } from 'src/events/events.service';
import { BanCheckGuard } from 'src/common/guard/ban-check.guard';

@Controller('problem')
export class ProblemController {
  constructor(
    private readonly problemService: ProblemService,
    private readonly eventsService: EventsService,
  ) {}

  @UseGuards(JwtAuthGuard, BanCheckGuard)
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

  @UseGuards(JwtAuthGuard, BanCheckGuard)
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

  @UseGuards(JwtAuthGuard, BanCheckGuard)
  @Get(':id')
  async getProblem(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    await this.eventsService.trackUserEvent(req.user.id, id, 'VIEW_PROBLEM');

    return this.problemService.getProblem(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, BanCheckGuard)
  @Get(':id/hint')
  async recordHintView(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    // 여기서 DB에 한 줄 저장!
    await this.eventsService.trackUserEvent(req.user.id, id, 'VIEW_HINT');
    return { success: true };
  }
}