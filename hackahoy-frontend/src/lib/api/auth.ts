// src/lib/api/auth.ts
import { apiRequest } from "./client";
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
} from "@/domain/types/api";

// 공통 로그인 API
export function loginApi(body: LoginRequest) {
  return apiRequest<ApiResponse<LoginResponse>>("/auth/login", {
    method: "POST",
    body,
  });
}

// 공통 로그아웃 API
export function logoutApi(token: string) {
  return apiRequest<ApiResponse<{ message: string }>>("/auth/logout", {
    method: "POST",
    token,
  });
}

/* 카카오 로그인 전용 헬퍼 */
export function loginWithKakao(accessToken: string) {
  const body: LoginRequest = {
    oauthProvider: "kakao",
    oauthToken: accessToken,
  };

  return loginApi(body);
}

/* 공통으로 */
export function loginWithOAuth(
  provider: "kakao" | "google" | "naver",
  accessToken: string
) {
  const body: LoginRequest = {
    oauthProvider: provider,
    oauthToken: accessToken,
  };

  return loginApi(body);
}
