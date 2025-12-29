export type JwtPayload = {
    userId : String;
    provider : 'kakao' | 'google' | 'naver';
};