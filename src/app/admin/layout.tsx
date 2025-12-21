"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import AppTopNav from "@/components/common/AppTopNav";
import styles from "./adminLayout.module.css"; // 실제 파일명에 맞추세요(스크린샷에 adminLayout.module.css 존재)

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "ADMIN") router.replace("/");
  }, [user, router]);

  if (!user || user.role !== "ADMIN") return null;

  return (
    <main className={styles.page}>
      <div className={styles.bg} aria-hidden />

      {/* admin 영역: 기본은 LOGOUT만 */}
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
