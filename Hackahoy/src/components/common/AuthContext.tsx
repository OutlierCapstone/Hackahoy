"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api/config";

export type AuthUser = {
  userId: string;
  nickname: string;
  levelNum: number;
  isAdmin: boolean;
  provider: "KAKAO" | "NAVER" | "GOOGLE" | "GUEST";
  prividerId?: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  /**
   * 저장된 토큰으로 첫 세션 복구가 끝났는지.
   *
   * 이 값을 보지 않고 user 만 보면, /auth/me 응답이 오기 전의 null 을
   * "비로그인" 으로 오해한다. 보호 화면에서 그대로 홈으로 되돌려 버리기 때문에
   * 새로고침이나 링크 직접 진입이 항상 튕긴다.
   */
  authReady: boolean;
  login: (jwt: string, userData: AuthUser) => void;
  loginAsGuest: () => Promise<AuthUser | null>;
  logout: () => void;
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// 게스트 토큰을 accessToken 과 별도로 한 벌 더 들고 있는다.
//
// 게스트는 자격증명이 없어서 한 번 토큰을 잃으면 같은 계정으로 돌아올 방법이 없다.
// 그런데 logout() 은 accessToken 을 지우므로, 로그아웃 후 "비회원으로 시작하기" 를
// 다시 누르면 매번 새 User 가 만들어졌다(게스트-1e6c -> 게스트-7c31 로 실측).
// 그러면 같은 사람의 행동 로그가 여러 계정으로 쪼개져 베타에서 모으려는
// 궤적 데이터를 쓸 수 없게 된다.
//
// 그래서 로그아웃은 accessToken 만 지우고 이 키는 남긴다. 다시 비회원으로 들어오면
// 이 토큰으로 원래 계정을 복구한다. 토큰이 만료·무효면 그때 버리고 새로 발급한다.
const GUEST_TOKEN_KEY = "guestAccessToken";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // 게스트 발급이 겹쳐 들어오면 User 레코드가 중복 생성된다.
  // 발급이 끝나기 전에 들어온 호출은 같은 Promise 를 기다리게 한다.
  const guestIssueRef = useRef<Promise<AuthUser | null> | null>(null);

  const router = useRouter();

  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  const refreshUser = async (): Promise<AuthUser | null> => {
    const savedToken = localStorage.getItem("accessToken");
    if (!savedToken) return null;

    try {
      const res = await axios.get(`${API_BASE_URL}/auth/me`, {
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
    // 성공이든 실패든 복구 시도가 끝나야 보호 화면이 판단을 시작할 수 있다.
    refreshUser().finally(() => setAuthReady(true));
  }, []);

  const login = (jwt: string, userData: AuthUser) => {
    setToken(jwt);
    setUser(userData);
    localStorage.setItem("accessToken", jwt);
    setLoginModalOpen(false);

    router.push("/");
  };

  /**
   * 비회원(게스트)으로 시작한다.
   *
   * localStorage 에 토큰이 있으면 그 세션을 그대로 재사용하고 게스트를 새로 만들지 않는다.
   * 이걸 지키지 않으면 재방문마다 다른 User 로 쪼개져서 로그가 파편화되고,
   * 베타에서 모은 데이터를 user-item 행렬로 쓸 수 없게 된다.
   */
  const loginAsGuest = async (): Promise<AuthUser | null> => {
    if (guestIssueRef.current) return guestIssueRef.current;

    const issue = (async (): Promise<AuthUser | null> => {
      // 1) 기존 세션 재사용이 항상 우선이다.
      const existing = await refreshUser();
      if (existing) {
        setLoginModalOpen(false);
        return existing;
      }

      // 1-2) 로그아웃으로 accessToken 이 지워졌더라도 이전 게스트로 돌아간다.
      const savedGuest = localStorage.getItem(GUEST_TOKEN_KEY);
      if (savedGuest) {
        localStorage.setItem("accessToken", savedGuest);
        const restored = await refreshUser();
        if (restored) {
          setLoginModalOpen(false);
          return restored;
        }
        // 만료됐거나 서버에서 지워진 계정이면 붙잡고 있을 이유가 없다.
        // (refreshUser 가 실패하면서 accessToken 은 이미 지웠다)
        localStorage.removeItem(GUEST_TOKEN_KEY);
      }

      // 2) 쓸 수 있는 토큰이 없을 때만 새 게스트를 발급한다.
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/guest`);
        const jwt = res.data?.data?.token as string | undefined;
        if (!jwt) throw new Error("게스트 토큰이 응답에 없습니다.");

        localStorage.setItem("accessToken", jwt);
        localStorage.setItem(GUEST_TOKEN_KEY, jwt);
        setToken(jwt);
        setLoginModalOpen(false);

        // 화면에 쓰는 사용자 정보는 /auth/me 응답 모양으로 통일한다.
        // (로그인 응답과 필드명이 달라서 그대로 쓰면 닉네임·레벨이 비어 보인다.)
        return await refreshUser();
      } catch (err) {
        console.error("게스트 세션 발급 실패:", err);
        return null;
      }
    })();

    guestIssueRef.current = issue;
    try {
      return await issue;
    } finally {
      guestIssueRef.current = null;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    // GUEST_TOKEN_KEY 는 일부러 남긴다. 게스트는 다시 로그인할 수단이 없어서
    // 여기서 지우면 이전 기록으로 돌아갈 방법이 사라진다.
    localStorage.removeItem("accessToken");
    setLoginModalOpen(false);
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        token, user, authReady, login, loginAsGuest, logout,
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
