"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import TopNav, { NavButton, NavButtonType } from "@/components/common/TopNav";
import { useAuth } from "@/components/common/AuthContext";

export default function AppTopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, openLoginModal } = useAuth();

  const isLoggedIn = !!user;
  const isAdmin = user?.role === "ADMIN";

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
    // 비로그인: login만
    if (!isLoggedIn) {
      return [
        mk("login", () => {
          // 홈이든 어디든, 모달은 MapView에 있으므로
          // 현재 페이지가 "/"가 아니면 먼저 "/"로 보내고 모달 열기
          if (pathname !== "/") router.push("/");
          // push 후에도 바로 열 수 있도록 약간의 여유
          setTimeout(() => openLoginModal(), 0);
        }),
      ];
    }

    // 로그인 상태 공통
    const arr: NavButton[] = [];

    // mypage에서는 mypage 대신 home
    if (isMypage) {
      arr.push(mk("home", () => router.push("/")));
    } else {
      arr.push(mk("mypage", () => router.push("/mypage")));
    }

    // admin이면 admin 버튼을 항상 추가
    if (isAdmin) {
      arr.push(mk("admin", () => router.push("/admin")));
    }

    // 로그아웃은 로그인 상태에서 항상
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
