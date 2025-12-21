// src/components/common/AuthContext.tsx
"use client";

import { createContext, useContext, useState } from "react";

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
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (jwt: string, userData: AuthUser) => {
    setToken(jwt);
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
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
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, devLoginAsAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
