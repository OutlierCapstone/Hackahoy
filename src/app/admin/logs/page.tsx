"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import AdminShell from "@/components/common/admin/AdminShell";
import styles from "./logs.module.css";

type LogRow = {
  id: string;
  time: string;
  actor: string;
  action: string;
  target?: string;
};

const MOCK_LOGS: LogRow[] = [
  {
    id: "l1",
    time: "2025-12-19 16:10",
    actor: "ADMIN",
    action: "BAN",
    target: "user1",
  },
  {
    id: "l2",
    time: "2025-12-19 16:12",
    actor: "ADMIN",
    action: "ROLE_USER",
    target: "user2",
  },
  {
    id: "l3",
    time: "2025-12-19 16:15",
    actor: "ADMIN",
    action: "CREATE_PROBLEM",
    target: "chal-101",
  },
];

export default function AdminLogsPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return MOCK_LOGS;
    return MOCK_LOGS.filter(
      (l) =>
        l.actor.toLowerCase().includes(s) ||
        l.action.toLowerCase().includes(s) ||
        (l.target ?? "").toLowerCase().includes(s)
    );
  }, [q]);

  const onLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <AdminShell>
      <main className={styles.page}>
        <div className={styles.bg} aria-hidden />

        <button
          className={styles.homeBtn}
          onClick={() => router.push("/")}
          aria-label="HOME"
        >
          <Image src="/assets/ui/home.png" alt="HOME" width={86} height={46} />
        </button>

        <button
          className={styles.logoutBtn}
          onClick={onLogout}
          aria-label="LOGOUT"
        >
          <Image
            src="/assets/ui/logout.png"
            alt="LOGOUT"
            width={96}
            height={44}
          />
        </button>

        <section className={styles.board}>
          <div className={styles.headerRow}>
            <div className={styles.title}>Logs</div>

            <div className={styles.searchWrap}>
              <input
                className={styles.searchInput}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="search logs..."
              />
              <button
                type="button"
                className={styles.enterBtn}
                aria-label="ENTER"
              >
                <Image
                  src="/assets/ui/enter.png"
                  alt="ENTER"
                  width={46}
                  height={24}
                />
              </button>
            </div>
          </div>

          <div className={styles.table}>
            <div className={`${styles.row} ${styles.head}`}>
              <div className={styles.cell}>time</div>
              <div className={styles.cell}>actor</div>
              <div className={styles.cell}>action</div>
              <div className={styles.cell}>target</div>
            </div>

            {filtered.map((l) => (
              <div key={l.id} className={styles.row}>
                <div className={styles.cell}>{l.time}</div>
                <div className={styles.cell}>{l.actor}</div>
                <div className={styles.cell}>{l.action}</div>
                <div className={styles.cell}>{l.target ?? "-"}</div>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <button
              className={styles.backAdminBtn}
              onClick={() => router.push("/admin")}
            >
              <Image
                src="/assets/ui/back.png"
                alt="BACK"
                width={86}
                height={46}
              />
            </button>
          </div>
        </section>
      </main>
    </AdminShell>
  );
}
