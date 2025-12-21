// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/components/common/AuthContext";
import KakaoProvider from "@/components/common/KakaoProvider";

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
        {/* ✅ 네이버 로그인 SDK: 전역에서 한 번만 로드 */}
        <Script
          src="https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <KakaoProvider>
          <AuthProvider>{children}</AuthProvider>
        </KakaoProvider>
      </body>
    </html>
  );
}
