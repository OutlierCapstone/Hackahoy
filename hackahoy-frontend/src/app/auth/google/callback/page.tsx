"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";

export default function GoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    // 1. 밴 당한 유저 처리
    if (error === "banned") {
      alert("⛔ 관리자에 의해 차단된 계정입니다. 접속할 수 없습니다.");
      router.replace("/");
      return;
    }

    // 2. 정상 로그인 처리
    if (token) {
      localStorage.setItem("accessToken", token);

      refreshUser()
        .then(() => {
          router.replace("/");
        })
        .catch(() => {
          router.replace("/");
        });
    } else {
      // 3. 기타 로그인 실패 처리
      console.error("[GOOGLE CALLBACK] 로그인 실패 또는 토큰 누락");
      alert("로그인에 실패했습니다.");
      router.replace("/");
    }
  }, [searchParams, refreshUser, router]);

  return (
    <div
      style={{
        backgroundColor: "#0b1723",
        height: "100vh",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <p>구글 로그인 처리 중...</p>
    </div>
  );
}
