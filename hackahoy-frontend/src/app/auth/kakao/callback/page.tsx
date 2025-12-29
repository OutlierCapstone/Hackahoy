"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("accessToken", token);
      refreshUser()
        .then(() => router.replace("/"))
        .catch(() => router.replace("/"));
    } else {
      router.replace("/");
    }
  }, [searchParams, refreshUser, router]);

  return <p>카카오 로그인 처리 중...</p>;
}

export default function KakaoCallback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KakaoCallbackContent />
    </Suspense>
  );
}
