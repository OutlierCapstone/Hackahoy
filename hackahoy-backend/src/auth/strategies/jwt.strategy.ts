import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service'; // 경로는 프로젝트에 맞게
import { JwtPayload } from '../types/jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // 과거 토큰(userid) 호환까지 같이 처리
    const userId = payload.userId ?? payload.userid;
    if (!userId) throw new UnauthorizedException('Invalid token payload');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        levelNum: true,
        role: true,
        isAdmin: true,
        provider: true,
        providerId: true,
        isBanned: true,
      },
    });

    if (!user) throw new UnauthorizedException('User not found');
    if (user.isBanned) throw new UnauthorizedException('Banned user');

    return {
      userId: user.id,
      nickname: user.nickname,
      levelNum: user.levelNum,
      role: user.role,
      isAdmin: user.isAdmin,
      oauthProvider: (user.provider ?? 'KAKAO').toLowerCase(),
      providerId: user.providerId, // ✅ MyPage에서 ID로 찍을 값
    };
  }
}
