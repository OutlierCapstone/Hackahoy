import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Get,
  ParseIntPipe,
} from '@nestjs/common';
import { ProblemService } from './problem.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  async submit(
    @Param('id') id: string,
    @Body('flag') flag: string,
    @Req() req: any,
  ) {
    return this.problemService.submitFlag({
      problemId: Number(id),
      userId: req.user.id,
      flag,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getProblem(@Param('id', ParseIntPipe) id: string) {
    return this.problemService.getProblem(Number(id));
  }
}

@Controller('admin/problems')
export class AdminProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Get()
  list() {
    return this.problemService.listProblems();
  }
}

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class ProblemAdminController {
  constructor(private readonly problemService: ProblemService) {}

  @Post('problems')
  create(
    @Body()
    body: {
      islandId: number;
      title: string;
      description: string;
      hint: string;
      correctFlag: string;
    },
  ) {
    return this.problemService.createProblem(body);
  }
}
