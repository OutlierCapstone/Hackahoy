"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import AppTopNav from "@/components/common/AppTopNav";
import styles from "./adminLayout.module.css"; 

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 1. 토큰이 아예 없거나 (로그아웃 상태)
    // 2. 유저 정보가 로드되었는데 isAdmin이 false라면 메인으로 쫓아냄
    const savedToken = localStorage.getItem("accessToken");
    
    if (!savedToken) {
      alert("로그인이 필요합니다.");
      router.replace("/");
      return;
    }

    // 유저 데이터가 로드된 후 권한 체크
    if (user && !user.isAdmin) {
      alert("관리자 권한이 없습니다.");
      router.replace("/");
    }
  }, [user, router]);

  // 권한 확인 중이거나 권한이 없는 경우 화면을 렌더링하지 않음
  if (!user || !user.isAdmin) {
    return (
      <main className={styles.page}>
        <div className={styles.bg} aria-hidden />
        <p style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>
          권한을 확인 중입니다...
        </p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.bg} aria-hidden />

      {/* admin 영역: 상단 네비게이션 */}
      <AppTopNav
        variant="admin"
        authPath="/login"
        showMyPageInAdmin={false}
        confirmLogout={false}
      />

      <div className={styles.stage}>{children}</div>
    </main>
  );
}