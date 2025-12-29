"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://52.78.240.6:4000";

export type AuthUser = {
  id: string; // ✅ /auth/me 가 prisma user 그대로 주면 id임
  nickname: string;
  levelNum: number;
  provider: "KAKAO" | "NAVER" | "GOOGLE";
  providerId: string;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;

  login: (jwt: string) => Promise<void>;
  logout: () => void;

  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;

  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  const refreshUser = async () => {
    const savedToken = localStorage.getItem("accessToken");
    if (!savedToken) {
      setUser(null);
      setToken(null);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });

      // ✅ /auth/me 는 user 객체 자체를 반환
      setToken(savedToken);
      setUser(res.data);
    } catch (err) {
      console.error("❌ 유저 정보 갱신 실패:", err);
      localStorage.removeItem("accessToken");
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 로그인: token 저장 후 /auth/me 로 사용자 갱신
  const login = async (jwt: string) => {
    localStorage.setItem("accessToken", jwt);
    setToken(jwt);
    setLoginModalOpen(false);
    await refreshUser();
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setToken(null);
    setUser(null);
    setLoginModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        refreshUser,
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
