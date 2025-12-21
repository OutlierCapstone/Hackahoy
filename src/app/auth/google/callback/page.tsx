"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";

// base64url → JSON 디코딩
function decodeJwtPayload(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT");
  const payloadB64 = parts[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
  const json = atob(payloadB64);
  return JSON.parse(json);
}

export default function GoogleCallbackPage() {
  const { login } = useAuth();
  const router = useRouter();
  const doneRef = useRef(false); // ✅ dev 모드에서 두 번 실행 방지

  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;

    // #access_token=...&id_token=... 파싱
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);

    const accessToken = params.get("access_token");
    const idToken = params.get("id_token");
    const state = params.get("state");

    if (!accessToken || !idToken) {
      console.error("[GOOGLE CALLBACK] token missing", {
        accessToken,
        idToken,
      });
      alert("구글 로그인에 실패했습니다.");
      // 안전하게 홈으로
      window.location.replace("/");
      return;
    }

    // state 검증 (선택)
    const savedState = sessionStorage.getItem("google_oauth_state");
    if (savedState && state && savedState !== state) {
      console.error("[GOOGLE CALLBACK] state mismatch", { savedState, state });
      alert("구글 로그인 요청이 올바르지 않습니다.");
      window.location.replace("/");
      return;
    }

    let payload: any;
    try {
      payload = decodeJwtPayload(idToken);
      console.log("[GOOGLE CALLBACK] id_token payload:", payload);
    } catch (e) {
      console.error("[GOOGLE CALLBACK] failed to decode id_token", e);
      alert("구글 로그인 토큰 처리 중 오류가 발생했습니다.");
      window.location.replace("/");
      return;
    }

    const profile = {
      id: payload.sub,
      nickname: payload.name || payload.given_name || "GoogleUser",
      email: payload.email,
    };

    const fakeUser = {
      userId: profile.id,
      nickname: profile.nickname,
      level: 1,
      oauthProvider: "google",
      email: profile.email ?? "unknown@google.com",
      isAdmin: false,
      isBanned: false,
    };

    const appToken = accessToken; // 데모용: 그냥 accessToken을 우리 토큰처럼 사용

    // ✅ Hackahoy 쪽 로그인 상태로 만들기
    login(appToken, fakeUser);

    // ✅ 라우터 + 브라우저 네비게이션 둘 다 써서 확실히 이동
    try {
      router.replace("/");
    } catch {
      // 혹시 라우터가 이상하면 브라우저로 강제 이동
      window.location.replace("/");
    }
  }, [login, router]);

  return (
    <div
      style={{
        height: "100vh",
        background: "#0b1723",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
      }}
    >
      구글 로그인 처리 중...
    </div>
  );
}
