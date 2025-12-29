// src/auth/strategies/kakao.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(config: ConfigService) {
    const clientID = config.get<string>('KAKAO_CLIENT_ID');
    const callbackURL = config.get<string>('KAKAO_CALLBACK_URL');

    // 환경 변수 누락 시 서버 실행 차단
    if (!clientID || !callbackURL) {
      throw new Error(
        'CRITICAL ERROR: Kakao OAuth 환경 변수(ID, Callback)가 설정되지 않았습니다. .env 파일을 확인하세요.',
      );
    }

    super({
      clientID,
      callbackURL,
    });
  }

  /**
   * 카카오 인증이 성공하면 호출되는 메서드
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any, // 카카오 프로필 구조가 복잡하므로 일단 유지하되, 필요한 정보만 추출
    done: (error: any, user?: any, info?: any) => void,
  ) {
    // 카카오에서 전달해주는 유저 정보 구조화
    const user = {
      provider: 'kakao',
      kakaoId: profile?.id?.toString(),
      email: profile?._json?.kakao_account?.email || null,
      nickname:
        profile?.displayName ||
        profile?._json?.properties?.nickname ||
        'kakao-user',
      accessToken,
    };

    // 검증 성공 후 Passport에 유저 정보 전달
    done(null, user);
  }
}
