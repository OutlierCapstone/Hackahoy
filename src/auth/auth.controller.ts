// src/auth/auth.controller.ts
import { Controller, Get, Req, UseGuards, Post, Body, Res, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { LoginThrottlerGuard } from '.././login-throttler.guard';

// OAuth 콜백이 돌려보낼 HTTPS 프론트 주소.
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://hackahoy.duckdns.org';

@Controller('auth')
@UseGuards(LoginThrottlerGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('me/profile')
  async myProfile(@Req() req: any) {
    return this.auth.getMyProfile(req.user.id);
  }

  // 비회원(게스트)으로 시작하기.
  // 소셜 로그인 없이 User 를 만들고 JWT 를 발급한다.
  // uid 는 챌린지 프록시(5001~5007)의 /set-uid 쿠키에 그대로 쓰이는 플랫폼 User.id 다.
  @Public()
  @Post('guest')
  async guest() {
    const user = await this.auth.createGuestUser();
    const token = this.auth.signToken({ userId: user.id, provider: 'guest' });

    return {
      success: true,
      data: {
        token,
        uid: user.id,
        user: {
          userId: user.id,
          nickname: user.nickname,
          level: user.levelNum,
          oauthProvider: 'guest',
          isAdmin: user.isAdmin,
          isBanned: user.isBanned,
        },
      },
    };
  }

  @Get('me')
  @UseGuards(LoginThrottlerGuard, JwtAuthGuard)
  async me(@Req() req: any) {
      console.log('req.user:', req.user); // ← 추가

    return this.auth.getMe(req.user.id);
  }

  // 닉네임 수정 API
  @Post('update-nickname')
  @UseGuards(JwtAuthGuard)
  async updateNickname(@Req() req: any, @Body() body: { nickname: string }) {
    const userId = req.user.userId || req.user.id; 
    return this.auth.updateNickname(userId, body.nickname);
  }

  @Post('unsubscribe')
  @UseGuards(JwtAuthGuard)
  async unsubscribe(@Req() req: any) {
    const userId = req.user.userId || req.user.id;
    await this.auth.deleteUserAccount(userId);
    return { success: true, message: '탈퇴가 완료되었습니다.' };
  }
  
  // KAKAO
  @Public()
  @UseGuards(AuthGuard('kakao'))
  @Get('kakao')
  kakaoLogin() {}

  @Public()
  @UseGuards(AuthGuard('kakao'))
  @Get('kakao/callback')
  async kakaoCallback(@Req() req: any, @Res() res: any) {
    try {
      const kakao = req.user;
      const user = await this.auth.upsertSocialUser({
        provider: 'KAKAO',
        providerId: String(kakao.kakaoId),
        nickname: kakao.profile?.username ?? 'kakao-user',
      });

      const token = this.auth.signToken({ userId: user.id, provider: 'kakao' });
      return res.redirect(`${FRONTEND_URL}/auth/kakao/callback?token=${token}`);

    } catch (error) {
      console.error("Auth error:", error);
      if (error instanceof ForbiddenException) {
        return res.redirect(`${FRONTEND_URL}/auth/kakao/callback?error=banned`);
      }
      return res.redirect(`${FRONTEND_URL}/auth/kakao/callback?error=unknown`);
    }
  }

// GOOGLE
  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('google')
  googleLogin() {}

  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async googleCallback(@Req() req: any, @Res() res: any) {
    try {
      const google = req.user;

      const user = await this.auth.upsertSocialUser({
        provider: 'GOOGLE',
        providerId: String(google.googleId),
        nickname: google.nickname ?? 'google-user',
      });

      const token = this.auth.signToken({
        userId: user.id,
        provider: 'google',
      });

      return res.redirect(`${FRONTEND_URL}/auth/google/callback?token=${token}`);
    } catch (error) {
      console.error("Auth error:", error);
      if (error instanceof ForbiddenException) {
        return res.redirect(`${FRONTEND_URL}/auth/google/callback?error=banned`);
      }
      return res.redirect(`${FRONTEND_URL}/auth/google/callback?error=unknown`);
    }
  }

  // NAVER
  @Public()
  @UseGuards(AuthGuard('naver'))
  @Get('naver')
  naverLogin() {}

  @Public()
  @UseGuards(AuthGuard('naver'))
  @Get('naver/callback')
  async naverCallback(@Req() req: any, @Res() res: any) {
    try {
      const naver = req.user;

      const user = await this.auth.upsertSocialUser({
        provider: 'NAVER',
        providerId: String(naver.naverId),
        nickname: naver.nickname ?? 'naver-user',
      });

      const token = this.auth.signToken({
        userId: user.id,
        provider: 'naver',
      });

      return res.redirect(`${FRONTEND_URL}/auth/naver/callback?token=${token}`);
    } catch (error) {
      console.error("Auth error:", error);
      if (error instanceof ForbiddenException) {
        return res.redirect(`${FRONTEND_URL}/auth/naver/callback?error=banned`);
      }
      return res.redirect(`${FRONTEND_URL}/auth/naver/callback?error=unknown`);
    }
  }
}
