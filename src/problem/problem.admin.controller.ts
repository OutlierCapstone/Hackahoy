import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ProblemService } from './problem.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/problems') // 프론트엔드 API 경로에 맞춤
export class ProblemAdminController {
  constructor(private readonly problemService: ProblemService) {}

  @Get()
  async listProblems() {
    return this.problemService.listProblems();
  }

  @Post()
  async createProblem(@Body() data: any) {
    return this.problemService.createProblem(data);
  }
}