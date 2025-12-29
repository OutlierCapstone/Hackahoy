import {
  Controller,
  Get,
  Req,
  UseGuards,
  Post,
  Body,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private readonly FRONTEND_URL =
    process.env.FRONTEND_URL || 'http://localhost:3000';

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  async myProfile(@Req() req: any) {
    return this.auth.getMyProfile(req.user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) {
    // JwtStrategy.validate()가 return한 user
    return { user: req.user };
  }

  @Post('update-nickname')
  @UseGuards(JwtAuthGuard)
  async updateNickname(@Req() req: any, @Body() body: { nickname: string }) {
    return this.auth.updateNickname(req.user.id, body.nickname);
  }

  @Post('unsubscribe')
  @UseGuards(JwtAuthGuard)
  async unsubscribe(@Req() req: any) {
    await this.auth.deleteUserAccount(req.user.id);
    return { success: true, message: '탈퇴가 완료되었습니다.' };
  }

  // ---- KAKAO ----
  @UseGuards(AuthGuard('kakao'))
  @Get('kakao')
  kakaoLogin() {}

  @UseGuards(AuthGuard('kakao'))
  @Get('kakao/callback')
  async kakaoCallback(@Req() req: any, @Res() res: any) {
    try {
      const user = await this.auth.upsertSocialUser({
        provider: 'KAKAO',
        providerId: String(req.user.id),
        nickname: req.user.username || 'kakao-user',
      });

      const token = this.auth.signToken({ userId: user.id, provider: 'kakao' });

      return res.redirect(
        `${this.FRONTEND_URL}/auth/kakao/callback?token=${token}`,
      );
    } catch (error) {
      const err = error instanceof ForbiddenException ? 'banned' : 'unknown';
      console.error('Kakao Login Error:', error);
      return res.redirect(
        `${this.FRONTEND_URL}/auth/kakao/callback?error=${err}`,
      );
    }
  }

  // ---- GOOGLE ----
  @UseGuards(AuthGuard('google'))
  @Get('google')
  googleLogin() {}

  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async googleCallback(@Req() req: any, @Res() res: any) {
    try {
      const user = await this.auth.upsertSocialUser({
        provider: 'GOOGLE',
        providerId: String(req.user.id),
        nickname: req.user.displayName || 'google-user',
      });

      const token = this.auth.signToken({
        userId: user.id,
        provider: 'google',
      });

      return res.redirect(
        `${this.FRONTEND_URL}/auth/google/callback?token=${token}`,
      );
    } catch (error) {
      const err = error instanceof ForbiddenException ? 'banned' : 'unknown';
      console.error('Google Login Error:', error);
      return res.redirect(
        `${this.FRONTEND_URL}/auth/google/callback?error=${err}`,
      );
    }
  }

  // ---- NAVER ----
  @UseGuards(AuthGuard('naver'))
  @Get('naver')
  naverLogin() {}

  @UseGuards(AuthGuard('naver'))
  @Get('naver/callback')
  async naverCallback(@Req() req: any, @Res() res: any) {
    try {
      const user = await this.auth.upsertSocialUser({
        provider: 'NAVER',
        providerId: String(req.user.id),
        nickname: req.user.nickname || 'naver-user',
      });

      const token = this.auth.signToken({ userId: user.id, provider: 'naver' });

      return res.redirect(
        `${this.FRONTEND_URL}/auth/naver/callback?token=${token}`,
      );
    } catch (error) {
      const err = error instanceof ForbiddenException ? 'banned' : 'unknown';
      console.error('Naver Login Error:', error);
      return res.redirect(
        `${this.FRONTEND_URL}/auth/naver/callback?error=${err}`,
      );
    }
  }
}
