// src/components/common/AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://52.78.240.6:4000";

export type AuthUser = {
  userId: string;
  nickname: string;
  levelNum: number;

  // 프론트에서 쓰는 값 (백엔드 DTO로부터 계산/매핑)
  role: "USER" | "ADMIN";
  isAdmin: boolean;
  isBanned?: boolean;

  oauthProvider: "kakao" | "naver" | "google";
  providerId?: string;
  email?: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  login: (jwt: string, userData?: AuthUser) => Promise<void> | void;
  logout: () => void;

  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;

  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeProvider(p: any): "kakao" | "naver" | "google" {
  const v = String(p ?? "").toLowerCase();
  if (v === "kakao") return "kakao";
  if (v === "naver") return "naver";
  return "google";
}

/**
 * 백엔드 /auth/me 응답을 AuthUser로 매핑
 * (백엔드가 DTO로 id, providerId, levelNum 등을 내려준다는 전제)
 */
function mapMeToAuthUser(me: any): AuthUser {
  const isAdmin = Boolean(me?.isAdmin);
  return {
    userId: String(me?.id ?? me?.userId ?? ""),
    nickname: String(me?.nickname ?? "PLAYER"),
    levelNum: Number(me?.levelNum ?? 1),

    isAdmin,
    role: isAdmin ? "ADMIN" : "USER",
    isBanned: Boolean(me?.isBanned),

    // 백엔드 DTO의 provider는 보통 'NAVER' 같은 대문자일 수 있으니 normalize
    oauthProvider: normalizeProvider(me?.provider ?? me?.oauthProvider),
    providerId: me?.providerId ? String(me.providerId) : undefined,
    email: me?.email ? String(me.email) : undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  const refreshUser = async () => {
    const savedToken = localStorage.getItem("accessToken");
    if (!savedToken) return;

    try {
      const res = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });

      // ✅ 백엔드가 "유저 객체 자체"를 내려준다는 전제로 처리
      const me = res.data;
      setUser(mapMeToAuthUser(me));
    } catch (err) {
      console.error("❌ 유저 정보 갱신 실패:", err);
      // 토큰이 깨졌을 가능성 높으니 정리
      localStorage.removeItem("accessToken");
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken");
    if (!savedToken) return;

    setToken(savedToken);
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 로그인 직후:
   * - jwt 저장
   * - userData가 있으면 즉시 setUser
   * - 없으면 /auth/me로 받아와서 setUser (가장 안전)
   */
  const login = async (jwt: string, userData?: AuthUser) => {
    setToken(jwt);
    localStorage.setItem("accessToken", jwt);
    setLoginModalOpen(false);

    if (userData) {
      setUser(userData);
      return;
    }
    await refreshUser();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
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
