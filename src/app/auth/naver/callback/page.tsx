// src/app/auth/naver/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";

declare global {
  interface Window {
    naver: any;
    opener: Window | null;
  }
}

export default function NaverCallbackPage() {
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const w = window as any;

    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!;
    const callbackUrl = window.location.href.split("#")[0]; // #access_token 앞까지만

    if (!w.naver || !w.naver.LoginWithNaverId) {
      console.error("[NAVER CALLBACK] naver SDK not loaded");
      return;
    }

    console.log("[NAVER CALLBACK] init with", { clientId, callbackUrl });

    const naverLogin = new w.naver.LoginWithNaverId({
      clientId,
      callbackUrl,
      isPopup: true, // 팝업/리다이렉트 모두 허용
    });

    naverLogin.init();

    naverLogin.getLoginStatus((status: boolean) => {
      if (!status) {
        console.error("[NAVER CALLBACK] login status false");
        return;
      }

      const u = naverLogin.user;

      // JS SDK는 보통 메서드로 제공됨
      const profile = {
        id: u.getId ? u.getId() : u.id,
        nickname: u.getNickName ? u.getNickName() : u.nickname,
        email: u.getEmail ? u.getEmail() : u.email,
      };

      console.log("[NAVER CALLBACK] user:", profile);

      /* 1) 팝업 모드: 부모 창으로 결과 전달 후 창 닫기 */
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          {
            type: "naver-login-success",
            profile,
          },
          window.location.origin
        );

        try {
          window.close();
        } catch (e) {
          console.warn("[NAVER CALLBACK] window.close blocked", e);
        }
        return;
      }

      /* 2) 리다이렉트 모드: 이 페이지에서 바로 로그인 처리 */
      const fakeUser = {
        userId: profile.id,
        nickname: profile.nickname ?? "네이버유저",
        level: 1,
        oauthProvider: "naver",
        email: profile.email ?? "unknown@naver.com",
        isAdmin: false,
        isBanned: false,
      };

      const fakeToken = "dev-jwt-token-naver";
      login(fakeToken, fakeUser);

      // 메인 맵으로 돌려보내기
      router.replace("/");
    });
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
      네이버 로그인 처리 중...
    </div>
  );
}
