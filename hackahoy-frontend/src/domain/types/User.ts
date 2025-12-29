export interface User {
  userId: string;
  oauthProvider: "google" | "kakao" | "naver";
  nickname: string;
  level: number;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}
