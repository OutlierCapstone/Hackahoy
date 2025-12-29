import {
  Controller,
  Get,
  Query,
  UseGuards,
  Patch,
  Param,
  Body,
  Post,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthService } from '../auth/auth.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly authService: AuthService) {}

  @Get('users')
  async listUsers(@Query('q') keyword: string) {
    const users = await this.authService.findAllUsers(keyword);

    return users.map((u) => ({
      id: u.id,
      nickname: u.nickname,
      // isAdmin 값에 따라 'ADMIN' 또는 'USER' 문자열 할당
      role: u.isAdmin ? 'ADMIN' : 'USER',
      //DB의 isBanned 값을 프론트의 banned 필드로 매핑
      banned: u.isBanned,
    }));
  }

  @Post('users/batch-update')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async batchUpdate(@Body('users') users: any[]) {
    return this.authService.batchUpdateUsers(users);
  }
}
