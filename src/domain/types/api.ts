// src/domain/types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Auth
export type OAuthProvider = "google" | "kakao" | "naver";

export interface User {
  userId: string;
  nickname: string;
  level: number;
  oauthProvider: OAuthProvider;
  isAdmin: boolean;
  isBanned: boolean;
}

export interface LoginRequest {
  oauthProvider: OAuthProvider;
  oauthToken: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// MyPage
export interface SolvedHistoryItem {
  problemId: number;
  isCorrect: boolean;
  solvedAt: string;
}

export interface MyPageData {
  userId: string;
  nickname: string;
  level: number;
  shipImage: string;
  solvedCount: number;
  solvedHistory: SolvedHistoryItem[];
}

// Island
export interface IslandSummary {
  islandId: number;
  name: string;
  theme: string;
  image: string;
}

export interface IslandListResponse {
  success: true;
  data: IslandSummary[];
}

export interface ProblemSummary {
  problemId: number;
  title: string;
  difficulty: number;
  isCleared: boolean;
}

export interface IslandDetailData {
  island: {
    islandId: number;
    name: string;
    theme: string;
  };
  problems: ProblemSummary[];
}

// Problem
export interface ProblemDetail {
  problemId: number;
  islandId: number;
  title: string;
  description: string;
  serverLink: string;
  difficulty: number;
  isCleared: boolean;
}

// Flag 제출
export interface SubmitFlagRequest {
  flag: string;
}

export interface SubmitFlagCorrectData {
  isCorrect: true;
  clearedProblemId: number;
  levelUp: boolean;
  newLevel: number;
  shipUpgraded: boolean;
  newShipImage: string;
}

export interface SubmitFlagWrongData {
  isCorrect: false;
  message: string;
}
