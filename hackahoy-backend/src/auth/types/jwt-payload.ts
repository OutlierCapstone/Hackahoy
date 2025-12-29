export type JwtPayload = {
  userId: string;
  provider: 'kakao' | 'google' | 'naver';
  iat?: number;
  exp?: number;
};
