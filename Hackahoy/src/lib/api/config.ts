// src/lib/api/config.ts
//
// 백엔드 주소를 한 곳에서만 정한다.
// 기본값은 기존 실서버 주소라 프로덕션 동작은 그대로고,
// 로컬에서는 .env.local 의 NEXT_PUBLIC_API_BASE_URL 로 덮어쓴다.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://44.199.70.243:4000";
