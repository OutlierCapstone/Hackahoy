"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import AppTopNav from "@/components/common/AppTopNav";
import styles from "./adminLayout.module.css"; 

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      alert("로그인이 필요합니다.");
      router.replace("/");
      return;
    }

    // 권한 체크
    if (user && !user.isAdmin) {
      alert("관리자 권한이 없습니다.");
      router.replace("/");
    }
  }, [authReady, user, router]);

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

      <AppTopNav />

      <div className={styles.stage}>{children}</div>
    </main>
  );
}
