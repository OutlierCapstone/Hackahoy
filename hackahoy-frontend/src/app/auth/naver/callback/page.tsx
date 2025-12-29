"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";

export default function NaverCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    // 1. 밴 당한 유저 처리 (백엔드 ForbiddenException 대응)
    if (error === "banned") {
      alert("⛔ 관리자에 의해 차단된 계정입니다. 접속할 수 없습니다.");
      router.replace("/");
      return;
    }

    // 2. 정상 토큰 수신 시 처리
    if (token) {
      // 로컬 스토리지 저장
      localStorage.setItem("accessToken", token);

      // 유저 정보 동기화 (AuthContext 상태 업데이트)
      refreshUser()
        .then(() => {
          router.replace("/");
        })
        .catch(() => {
          router.replace("/");
        });
    } else {
      // 3. 토큰이 아예 없는 경우 (취소 등)
      console.error("[NAVER CALLBACK] 토큰이 없습니다.");
      alert("네이버 로그인에 실패했습니다.");
      router.replace("/");
    }
  }, [searchParams, refreshUser, router]);

  return (
    <div
      style={{
        backgroundColor: "#03c75a",
        height: "100vh",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <p>네이버 로그인 처리 중...</p>
    </div>
  );
}
