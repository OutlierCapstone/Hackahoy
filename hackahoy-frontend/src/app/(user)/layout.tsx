import type { ReactNode } from "react";
import AppTopNav from "@/components/common/AppTopNav";
import styles from "./layout.module.css";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.pageRoot}>
      <div className={styles.bg} aria-hidden />
      <AppTopNav variant="user" />
      <div className={styles.stage}>{children}</div>
    </main>
  );
}
