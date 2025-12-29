export type JwtPayload = {
  userId: string;
  provider: 'kakao' | 'google' | 'naver';
};
