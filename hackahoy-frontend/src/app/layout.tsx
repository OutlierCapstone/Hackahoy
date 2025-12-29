// src/app/layout.tsx
"use client";

import "./globals.css";
import Script from "next/script";
import { AuthProvider, useAuth } from "@/components/common/AuthContext";
import KakaoProvider from "@/components/common/KakaoProvider";
import AppTopNav from "@/components/common/AppTopNav";
import { useRouter } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <Script
          src="https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <KakaoProvider>
          <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
          </AuthProvider>
        </KakaoProvider>
      </body>
    </html>
  );
}

// TopNav에 버튼을 주입하기 위한 별도 컴포넌트
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout, openLoginModal } = useAuth(); //
  const router = useRouter();

  // 오른쪽 버튼 구성
  const rightButtons = user
    ? [
        // 로그인 상태일 때
        { type: "admin" as const, onClick: () => router.push("/admin") },
        { type: "mypage" as const, onClick: () => router.push("/mypage") },
        { type: "logout" as const, onClick: () => logout() },
      ]
    : [
        // 로그아웃 상태일 때
        { type: "login" as const, onClick: () => openLoginModal() },
      ];

  return (
    <>
      <AppTopNav
        right={rightButtons} // 생성한 버튼 배열을 전달
      />
      {children}
    </>
  );
}
