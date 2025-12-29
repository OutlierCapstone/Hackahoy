"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";

export default function KakaoCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    // 1. 밴 당한 유저 처리 (백엔드에서 error=banned를 보냈을 때)
    if (error === "banned") {
      alert("⛔ 관리자에 의해 차단된 계정입니다. 접속할 수 없습니다.");
      router.replace("/");
      return;
    }

    if (token) {
      // 2. 로컬 스토리지에 토큰 저장
      localStorage.setItem("accessToken", token);

      // 3.유저 정보를 서버로부터 다시 불러와 상태 업데이트
      refreshUser()
        .then(() => {
          router.replace("/"); // 정보 동기화 후 메인 이동
        })
        .catch(() => {
          router.replace("/"); // 에러 시에도 일단 홈으로
        });
    } else {
      console.error("❌ No token found in URL");
      router.push("/");
    }
  }, [searchParams, refreshUser, router]); //의존성 배열 확인

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#1a1a1a",
        color: "white",
      }}
    >
      <p>로그인 중입니다. 잠시만 기다려주세요...</p>
    </div>
  );
}
