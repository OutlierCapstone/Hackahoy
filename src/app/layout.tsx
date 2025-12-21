// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/components/common/AuthContext";
import KakaoProvider from "@/components/common/KakaoProvider";
import AppTopNav from "@/components/common/AppTopNav";

export const metadata: Metadata = {
  title: "Hackahoy",
  description: "Pixel Adventure Project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* 네이버 로그인 SDK: 전역 1회 로드 */}
        <Script
          src="https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <KakaoProvider>
          <AuthProvider>
            {/* ✅ 공통 상단 버튼 (모든 페이지에서 뜸) */}
            <AppTopNav />
            {children}
          </AuthProvider>
        </KakaoProvider>
      </body>
    </html>
  );
}
