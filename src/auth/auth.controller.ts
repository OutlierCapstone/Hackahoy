// src/auth/auth.controller.ts
import { Controller, Get, Req, UseGuards, Post, Body, Res, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { DevUserGuard } from './dev-user.guard';
import { LoginThrottlerGuard } from '.././login-throttler.guard';

@Controller('auth')
@UseGuards(LoginThrottlerGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @UseGuards(DevUserGuard)
  @Get('me/profile')
  async myProfile(@Req() req: any) {
    return this.auth.getMyProfile(req.user.id);
  }

  // @UseGuards(LoginThrottlerGuard)
  @Post('login')
  async login(@Body() body: { oauthProvider: 'kakao'|'google'|'naver'; oauthToken: string }) {
    const { oauthProvider, oauthToken } = body;

    const providerId = oauthToken;

    const user = await this.auth.upsertSocialUser({
      provider: oauthProvider.toUpperCase() as 'KAKAO'|'GOOGLE'|'NAVER',
      providerId,
      nickname: `${oauthProvider}-user`,
    });

    const token = this.auth.signToken({ userId: user.id, provider: oauthProvider });

    return {
      success: true,
      data: {
        token,
        user: {
          userId: user.id,                 
          nickname: user.nickname,
          level: user.levelNum,           
          oauthProvider,                  
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
  @UseGuards(AuthGuard('kakao'))
  @Get('kakao')
  kakaoLogin() {}

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
      return res.redirect(`http://44.199.70.243:3000/auth/kakao/callback?token=${token}`);

    } catch (error) {
      console.error("Auth error:", error);
      if (error instanceof ForbiddenException) {
        return res.redirect(`http://44.199.70.243:3000/auth/kakao/callback?error=banned`);
      }
      return res.redirect(`http://44.199.70.243:3000/auth/kakao/callback?error=unknown`);
    }
  }

// GOOGLE
  @UseGuards(AuthGuard('google'))
  @Get('google')
  googleLogin() {}

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

      return res.redirect(`http://44.199.70.243:3000/auth/google/callback?token=${token}`);
    } catch (error) {
      console.error("Auth error:", error);
      if (error instanceof ForbiddenException) {
        return res.redirect(`http://44.199.70.243:3000/auth/google/callback?error=banned`);
      }
      return res.redirect(`http://44.199.70.243:3000/auth/google/callback?error=unknown`);
    }
  }

  // NAVER
  @UseGuards(AuthGuard('naver'))
  @Get('naver')
  naverLogin() {}

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

      return res.redirect(`http://44.199.70.243:3000/auth/naver/callback?token=${token}`);
    } catch (error) {
      console.error("Auth error:", error);
      if (error instanceof ForbiddenException) {
        return res.redirect(`http://44.199.70.243:3000/auth/naver/callback?error=banned`);
      }
      return res.redirect(`http://44.199.70.243:3000/auth/naver/callback?error=unknown`);
    }
  }
}