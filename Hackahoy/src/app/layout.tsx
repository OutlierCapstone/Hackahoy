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
        <Script
          src="https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        {/*
          AppTopNav 를 여기서 렌더하지 않는다.
          (user)/layout.tsx 와 admin/layout.tsx 가 각자 렌더하기 때문에
          루트에서도 렌더하면 헤더가 두 번 겹쳐 보인다.
        */}
        <KakaoProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </KakaoProvider>
      </body>
    </html>
  );
}
