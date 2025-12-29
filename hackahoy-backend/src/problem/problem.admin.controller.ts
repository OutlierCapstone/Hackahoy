// hackahoy-backend/src/problem/problem.admin.controller.ts
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { ProblemService } from './problem.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class ProblemAdminController {
  constructor(private readonly problemService: ProblemService) {}

  @Post('problems')
  create(@Body() body: any) {
    const { title, description, hint, correctFlag, serverLink } = body;

    // 1. Flag 가드: hackahoy{...} 형식이 아니면 에러 발생
    const flagRegex = /^hackahoy\{.+\}$/;
    if (!flagRegex.test(correctFlag)) {
      throw new BadRequestException(
        '플래그 형식이 올바르지 않습니다. hackahoy{내용} 형식을 지켜주시고, 내용을 반드시 입력해주세요.',
      );
    }

    // 2. Server Link 가드: URL 형식인지 확인
    if (serverLink) {
      try {
        new URL(serverLink);
      } catch (e) {
        throw new BadRequestException(
          '올바른 서버 URL 형식이 아닙니다. (http:// 또는 https:// 포함)',
        );
      }
    }

    // 3. XSS 방지 가드: 모든 입력값에서 HTML 태그 제거
    const sanitize = (str: string) =>
      str ? str.replace(/<[^>]*>?/gm, '') : str;

    const safeBody = {
      ...body,
      title: sanitize(title),
      description: sanitize(description),
      hint: sanitize(hint),
      serverLink: sanitize(serverLink),
    };

    return this.problemService.createProblem(safeBody);
  }

  @Get('problems')
  list() {
    return this.problemService.listProblems();
  }
}
