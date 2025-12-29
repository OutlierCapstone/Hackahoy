"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";

// 1. 실제 로직을 담은 내부 컴포넌트
function NaverCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error === "banned") {
      alert("⛔ 관리자에 의해 차단된 계정입니다.");
      router.replace("/");
      return;
    }

    if (token) {
      localStorage.setItem("accessToken", token);
      refreshUser()
        .then(() => router.replace("/"))
        .catch(() => router.replace("/"));
    } else {
      router.replace("/");
    }
  }, [searchParams, refreshUser, router]);

  return <p>구글 로그인 처리 중...</p>;
}

// 2. 외부에서 부르는 메인 컴포넌트 (Suspense로 감싸기)
export default function NaverCallbackPage() {
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
      <Suspense fallback={<p>잠시만 기다려 주세요...</p>}>
        <NaverCallbackContent />
      </Suspense>
    </div>
  );
}
