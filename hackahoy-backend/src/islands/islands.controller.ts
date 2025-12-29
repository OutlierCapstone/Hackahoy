import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { IslandsService } from './islands.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// 유저 정보를 담고 있는 인터페이스 정의
interface RequestWithUser extends Request {
  user: {
    id: string;
  };
}

@Controller('islands')
export class IslandsController {
  constructor(private readonly islandsService: IslandsService) {}

  @Get()
  getAllIslands() {
    return this.islandsService.getAllIslands();
  }

  // 실제 인증을 거친 유저의 ID를 사용합니다.
  @UseGuards(JwtAuthGuard)
  @Get(':id/problems')
  async getIslandProblems(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    return this.islandsService.getProblems(id, userId);
  }
}
