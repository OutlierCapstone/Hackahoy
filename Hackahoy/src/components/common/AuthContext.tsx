"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api/config";

export type AuthUser = {
  userId: string;
  nickname: string;
  levelNum: number;
  isAdmin: boolean;
  provider: "KAKAO" | "NAVER" | "GOOGLE" | "GUEST";
  providerId?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  authReady: boolean;
  loginAsGuest: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LEGACY_ACCESS_TOKEN_KEY = "accessToken";
const LEGACY_GUEST_TOKEN_KEY = "guestAccessToken";

/**
 * Existing beta users may still have the old JavaScript-readable JWTs. Send
 * them once to the migration endpoint, which converts them to HttpOnly
 * cookies, and remove both localStorage entries even if migration fails.
 */
async function migrateLegacySession() {
  const accessToken = localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
  const guestToken = localStorage.getItem(LEGACY_GUEST_TOKEN_KEY);
  if (!accessToken && !guestToken) return;

  try {
    await axios.post(
      `${API_BASE_URL}/auth/migrate-browser-session`,
      {},
      {
        withCredentials: true,
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(guestToken ? { "X-Legacy-Guest-Token": guestToken } : {}),
        },
      },
    );
    // A 200 response means the server either migrated the token or confirmed
    // that it is no longer valid. In both cases it should leave localStorage.
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    localStorage.removeItem(LEGACY_GUEST_TOKEN_KEY);
  } catch (error) {
    // Keep the legacy values for a later retry if the backend was temporarily
    // unavailable. Do not log the Axios error object because it contains the
    // migration headers and therefore the legacy tokens.
    console.error("기존 로그인 세션을 안전한 쿠키로 이전하지 못했습니다.");
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const guestIssueRef = useRef<Promise<AuthUser | null> | null>(null);
  const router = useRouter();

  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  const refreshUser = async (): Promise<AuthUser | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        withCredentials: true,
      });
      const userData = response.data as AuthUser;
      setUser(userData);
      return userData;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        console.error("유저 정보 갱신 실패:", error);
      }
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await migrateLegacySession();
      if (!cancelled) await refreshUser();
    })().finally(() => {
      if (!cancelled) setAuthReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const loginAsGuest = async (): Promise<AuthUser | null> => {
    if (guestIssueRef.current) return guestIssueRef.current;

    const issue = (async (): Promise<AuthUser | null> => {
      const existing = await refreshUser();
      if (existing) {
        setLoginModalOpen(false);
        return existing;
      }

      try {
        await axios.post(
          `${API_BASE_URL}/auth/guest`,
          {},
          { withCredentials: true },
        );
        setLoginModalOpen(false);
        return await refreshUser();
      } catch (error) {
        console.error("게스트 세션 발급 실패:", error);
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

  const logout = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true },
      );
    } catch (error) {
      console.error("로그아웃 요청 실패:", error);
    } finally {
      setUser(null);
      setLoginModalOpen(false);
      router.push("/");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        loginAsGuest,
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
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
