"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * 소셜 로그인 콜백 화면.
 *
 * 이전 구현은 token 이 없을 때를 아예 다루지 않았다. 백엔드는 실패하면
 * `?error=banned` / `?error=unknown` 으로 되돌려 보내는데, 화면은 그때도
 * "로그인 성공! 이동 중..." 을 띄운 채 영영 멈춰 있었다.
 * 사용자 입장에서는 소셜 로그인이 "그냥 안 되는" 것으로 보인다.
 */
const MESSAGES: Record<string, string> = {
  banned: "이용이 제한된 계정입니다.",
  unknown: "로그인 처리 중 오류가 발생했습니다.",
};

function OAuthCallbackContent({ provider }: { provider: string }) {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("로그인 처리 중...");

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (token) {
      localStorage.setItem("accessToken", token);
      setMessage("로그인 성공! 이동 중...");
      // 전체 새로고침으로 넘겨 AuthProvider 가 저장된 토큰으로 세션을 복구하게 한다.
      window.location.href = "/";
      return;
    }

    // 실패 경로. 토큰도 에러 파라미터도 없는 경우(직접 URL 진입 등)까지 여기서 받는다.
    setMessage(
      `${MESSAGES[error ?? ""] ?? "로그인에 실패했습니다."} 잠시 후 처음 화면으로 돌아갑니다.`,
    );
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 2000);
    return () => clearTimeout(timer);
  }, [searchParams, provider]);

  return <div style={{ padding: "20px" }}>{message}</div>;
}

export default function OAuthCallback({ provider }: { provider: string }) {
  return (
    <Suspense fallback={<div style={{ padding: "20px" }}>로딩 중...</div>}>
      <OAuthCallbackContent provider={provider} />
    </Suspense>
  );
}
