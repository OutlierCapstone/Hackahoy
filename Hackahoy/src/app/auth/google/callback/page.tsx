"use client";
export const dynamic = "force-dynamic";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function GoogleCallbackContent() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            localStorage.setItem("accessToken", token);
            // 토큰 저장 후 0.5초 뒤에 메인으로 강제 이동 (새로고침 효과)
            setTimeout(() => {
                window.location.href = "/";
            }, 500);
        }
    }, [searchParams]);

    return <div style={{padding: "20px"}}>로그인 성공! 이동 중...</div>;
}

export default function GoogleCallback() {
    return (
        <Suspense fallback={<div>로딩 중...</div>}>
            <GoogleCallbackContent />
        </Suspense>
    );
}
