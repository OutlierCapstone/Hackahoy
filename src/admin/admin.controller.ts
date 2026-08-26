import { Controller, Get, Query, UseGuards, Post, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service'; // ✅ Prisma 추가

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService, // ✅ Prisma 주입
  ) {}

  @Get('users')
  async listUsers(@Query('q') keyword: string) {
    const users = await this.authService.findAllUsers(keyword);
    return users.map((u) => ({
      id: u.id,
      nickname: u.nickname,
      role: u.isAdmin ? 'ADMIN' : 'USER',
      banned: u.isBanned,
    }));
  }

  // ✅ 유저 일괄 업데이트 (batch-update)
  @Post('users/batch-update')
  async batchUpdate(@Body('users') users: any[]) {
    return this.authService.batchUpdateUsers(users);
  }

  // ✅ 알림 내역 조회 (클래스 안으로 이동됨)
  @Get('notifications')
  async getNotifications() {
    const history = await this.prisma.banHistory.findMany({
      take: 10,
      orderBy: { bannedAt: 'desc' },
      include: {
        user: {
          select: { nickname: true },
        },
      },
    });

    return history.map((h) => ({
      id: Number(h.id),
      message: `User "${h.user?.nickname || 'Unknown'}" has been automatically banned.`,
      createdAt: h.bannedAt.toISOString(),
    }));
  }
}