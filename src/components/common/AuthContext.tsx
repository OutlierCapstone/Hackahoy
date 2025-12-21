// src/components/common/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState } from "react";

export type AuthUser = {
  userId: string;
  nickname: string;
  level: number;
  role: "USER" | "ADMIN";
  oauthProvider: "kakao" | "naver" | "google";
  email?: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  login: (jwt: string, userData: AuthUser) => void;
  logout: () => void;
  devLoginAsAdmin: () => void;

  // ✅ 로그인 모달 전역 제어
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // ✅ 로그인 모달 상태
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  const login = (jwt: string, userData: AuthUser) => {
    setToken(jwt);
    setUser(userData);
    // ✅ 로그인 성공 시 모달 자동 닫기
    setLoginModalOpen(false);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    // 로그아웃 시 모달은 닫아두는 게 UX상 안전
    setLoginModalOpen(false);
  };

  // DEV 전용 ADMIN 로그인
  const devLoginAsAdmin = () => {
    setToken("DEV_ADMIN_TOKEN");
    setUser({
      userId: "admin",
      nickname: "ADMIN",
      level: 99,
      role: "ADMIN",
      oauthProvider: "google",
      email: "admin@hackahoy.dev",
    });
    setLoginModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        devLoginAsAdmin,
        loginModalOpen,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
