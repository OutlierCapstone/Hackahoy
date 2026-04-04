"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export type AuthUser = {
  userId: string;
  nickname: string;
  levelNum: number;
  isAdmin: boolean; 
  provider: "KAKAO" | "NAVER" | "GOOGLE";
  prividerId?: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  login: (jwt: string, userData: AuthUser) => void;
  logout: () => void;
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const router = useRouter();

  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  const refreshUser = async (): Promise<AuthUser | null> => {
    const savedToken = localStorage.getItem("accessToken");
    if (!savedToken) return null;

    try {
      const res = await axios.get("http://44.199.70.243:4000/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const userData = res.data as AuthUser;
      setUser(userData);
      setToken(savedToken);
      return userData; 
    } catch (err) {
      console.error("유저 정보 갱신 실패:", err);
      localStorage.removeItem("accessToken");
      setToken(null);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (jwt: string, userData: AuthUser) => {
    setToken(jwt);
    setUser(userData);
    localStorage.setItem("accessToken", jwt);
    setLoginModalOpen(false);

    router.push("/");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    setLoginModalOpen(false);
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        token, user, login, logout,
        refreshUser, loginModalOpen, openLoginModal, closeLoginModal,
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