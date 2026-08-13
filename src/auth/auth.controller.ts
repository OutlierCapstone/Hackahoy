// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { LoginThrottlerGuard } from '.././login-throttler.guard';
import {
  ACCESS_TOKEN_COOKIE,
  GUEST_TOKEN_COOKIE,
  clearAuthCookie,
  readCookie,
  setAuthCookie,
} from './auth-cookie';

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
  async guest(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const existingGuestToken = readCookie(req, GUEST_TOKEN_COOKIE);
    const user =
      (await this.auth.restoreGuestUser(existingGuestToken)) ??
      (await this.auth.createGuestUser());
    const token = this.auth.signToken({ userId: user.id, provider: 'guest' });
    setAuthCookie(res, ACCESS_TOKEN_COOKIE, token);
    setAuthCookie(res, GUEST_TOKEN_COOKIE, token);

    return {
      success: true,
      data: {
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

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res, ACCESS_TOKEN_COOKIE);
    return { success: true };
  }

  @Public()
  @Post('migrate-browser-session')
  async migrateBrowserSession(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-legacy-guest-token') legacyGuestToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const legacyAccessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : null;

    const accessSession = await this.auth.restoreSessionUser(legacyAccessToken);
    if (accessSession) {
      const token = this.auth.signToken({
        userId: accessSession.user.id,
        provider: accessSession.provider,
      });
      setAuthCookie(res, ACCESS_TOKEN_COOKIE, token);
    }

    const guest = await this.auth.restoreGuestUser(legacyGuestToken ?? null);
    if (guest) {
      const token = this.auth.signToken({
        userId: guest.id,
        provider: 'guest',
      });
      setAuthCookie(res, GUEST_TOKEN_COOKIE, token);
    }

    return { success: Boolean(accessSession || guest) };
  }

  @Get('me')
  @UseGuards(LoginThrottlerGuard, JwtAuthGuard)
  async me(@Req() req: any) {

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
  async unsubscribe(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.userId || req.user.id;
    await this.auth.deleteUserAccount(userId);
    clearAuthCookie(res, ACCESS_TOKEN_COOKIE);
    if (req.user.provider === 'GUEST') {
      clearAuthCookie(res, GUEST_TOKEN_COOKIE);
    }
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
      setAuthCookie(res, ACCESS_TOKEN_COOKIE, token);
      return res.redirect(`${FRONTEND_URL}/auth/kakao/callback`);

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
      setAuthCookie(res, ACCESS_TOKEN_COOKIE, token);
      return res.redirect(`${FRONTEND_URL}/auth/google/callback`);
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
      setAuthCookie(res, ACCESS_TOKEN_COOKIE, token);
      return res.redirect(`${FRONTEND_URL}/auth/naver/callback`);
    } catch (error) {
      console.error("Auth error:", error);
      if (error instanceof ForbiddenException) {
        return res.redirect(`${FRONTEND_URL}/auth/naver/callback?error=banned`);
      }
      return res.redirect(`${FRONTEND_URL}/auth/naver/callback?error=unknown`);
    }
  }
}
