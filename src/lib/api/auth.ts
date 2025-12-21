// src/lib/api/auth.ts
import { apiRequest } from "./client";
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
} from "@/domain/types/api";

// 공통 로그인 API (이미 있던 거)
export function loginApi(body: LoginRequest) {
  return apiRequest<ApiResponse<LoginResponse>>("/auth/login", {
    method: "POST",
    body,
  });
}

// 공통 로그아웃 API (이미 있던 거)
export function logoutApi(token: string) {
  return apiRequest<ApiResponse<{ message: string }>>("/auth/logout", {
    method: "POST",
    token,
  });
}

/** ✅ 카카오 로그인 전용 헬퍼 (프론트에서 이 함수만 쓰면 됨) */
export function loginWithKakao(accessToken: string) {
  const body: LoginRequest = {
    oauthProvider: "kakao",
    oauthToken: accessToken,
  };

  return loginApi(body);
}

/** (옵션) 나중에 구글/네이버까지 공통으로 쓰고 싶으면 */
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
