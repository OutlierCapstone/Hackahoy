import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-naver-v2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(private readonly config: ConfigService) {
    const clientID = config.get<string>('NAVER_CLIENT_ID');
    const clientSecret = config.get<string>('NAVER_CLIENT_SECRET');
    const callbackURL = config.get<string>('NAVER_CALLBACK_URL');

    if (!clientID) throw new Error('NAVER_CLIENT_ID is not set');
    if (!clientSecret) throw new Error('NAVER_CLIENT_SECRET is not set');
    if (!callbackURL) throw new Error('NAVER_CALLBACK_URL is not set');

    super({
      clientID,
      clientSecret,
      callbackURL,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    const naverId = profile.id;
    const nickname = profile.nickname ?? 'naver-user';

    done(null, {
      naverId,
      nickname,
    });
  }
}
