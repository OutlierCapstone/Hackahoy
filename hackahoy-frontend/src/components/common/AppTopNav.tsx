// src/components/common/AppTopNav.tsx
"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import TopNav, { NavButton, NavButtonType } from "@/components/common/TopNav";
import { useAuth } from "@/components/common/AuthContext";

export default function AppTopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, openLoginModal } = useAuth(); //

  const isLoggedIn = !!user;
  // DB 데이터(isAdmin)에 맞춰 판별 로직 변경
  const isAdmin = user?.isAdmin === true;

  const isMypage = pathname === "/mypage";
  const isSub =
    pathname.startsWith("/island/") || pathname.startsWith("/challenge/");

  const mk = (
    type: NavButtonType,
    onClick?: NavButton["onClick"]
  ): NavButton => ({
    type,
    onClick,
  });

  const left: NavButton[] = useMemo(() => {
    if (isSub) {
      return [mk("back", () => router.back())];
    }
    return [];
  }, [isSub, router]);

  const right: NavButton[] = useMemo(() => {
    // 1. 비로그인 상태
    if (!isLoggedIn) {
      return [
        mk("login", () => {
          if (pathname !== "/") router.push("/");
          setTimeout(() => openLoginModal(), 0);
        }),
      ];
    }

    // 2. 로그인 상태 공통
    const arr: NavButton[] = [];

    // 마이페이지 여부에 따라 홈 또는 마이페이지 버튼 추가
    if (isMypage) {
      arr.push(mk("home", () => router.push("/")));
    } else {
      arr.push(mk("mypage", () => router.push("/mypage")));
    }

    // 어드민 버튼 추가 (isAdmin 판별 결과 사용)
    if (isAdmin) {
      arr.push(mk("admin", () => router.push("/admin")));
    }

    // 로그아웃 버튼은 항상 추가
    arr.push(
      mk("logout", async () => {
        await logout();
        router.push("/");
      })
    );

    return arr;
  }, [isLoggedIn, isMypage, isAdmin, logout, openLoginModal, pathname, router]);

  return <TopNav left={left} right={right} />;
}
