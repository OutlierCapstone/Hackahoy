// src/lib/api/config.ts
//
// 백엔드 주소를 한 곳에서만 정한다.
// 기본값은 HTTPS 실서버 주소고,
// 로컬에서는 .env.local 의 NEXT_PUBLIC_API_BASE_URL 로 덮어쓴다.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://hackahoy.duckdns.org/backend";
