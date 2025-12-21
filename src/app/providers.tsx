// src/app/providers.tsx
"use client";

import React from "react";
import { AuthProvider } from "@/components/common/AuthContext";
import KakaoProvider from "@/components/common/KakaoProvider";
import AppTopNav from "@/components/common/AppTopNav";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <KakaoProvider>
      <AuthProvider>
        {/* ✅ 어떤 페이지든 항상 상단 네비가 떠야 함 */}
        <AppTopNav />
        {children}
      </AuthProvider>
    </KakaoProvider>
  );
}
