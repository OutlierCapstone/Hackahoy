import { Controller, Get, Param, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { IslandsService } from './islands.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BanCheckGuard } from 'src/common/guard/ban-check.guard';

@Controller('islands')
export class IslandsController {
  constructor(private readonly islandsService: IslandsService) {}

  @Get()
  getAllIslands() {
    return this.islandsService.getAllIslands();
  }

  @UseGuards(JwtAuthGuard, BanCheckGuard)
  @Get(':id/problems')
  async getIslandProblems(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user.id;
    return this.islandsService.getProblems(id, userId);
  }
}
