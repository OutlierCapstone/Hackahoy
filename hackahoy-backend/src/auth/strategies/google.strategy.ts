import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: ConfigService) {
    // 1. 환경 변수 로드
    const clientID = config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL');

    // 2. 배포 전 필수 체크 (환경 변수가 하나라도 누락되면 서버 실행을 차단하여 에러 방지)
    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error(
        'CRITICAL ERROR: Google OAuth 환경 변수(ID, Secret, Callback)가 설정되지 않았습니다. .env 파일을 확인하세요.',
      );
    }

    // 3. 부모 클래스(PassportStrategy) 초기화
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['profile', 'email'],
      // 구글 표준 엔드포인트 설정
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://oauth2.googleapis.com/token',
    });
  }

  /**
   * 구글 인증이 성공하면 실행되는 메서드
   * 여기서 반환된 user 객체는 Passport에 의해 req.user에 저장됩니다.
   */
  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value ?? null;

    // 닉네임 결정 우선순위: 전체 이름 -> 이름 -> 이메일 아이디 -> 기본값
    const nickname =
      profile.displayName ||
      profile.name?.givenName ||
      email?.split('@')[0] ||
      'google-user';

    const user = {
      googleId: profile.id,
      email,
      nickname,
    };

    // 검증 성공 후 다음 단계로 유저 정보 전달
    done(null, user);
  }
}
