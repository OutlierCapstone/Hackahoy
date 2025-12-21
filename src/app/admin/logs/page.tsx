"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
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

  const onLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <main className={styles.pageRoot}>
      <div className={styles.bg} aria-hidden />

      {/* 상단 고정 내비게이션 (BACK / HOME / LOGOUT) */}
      <header
        className={styles.topBar}
        role="navigation"
        aria-label="Admin Top"
      >
        <div className={styles.topSlot}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => router.back()}
            aria-label="Back"
            title="Back"
          >
            <Image
              src="/assets/ui/back.png"
              alt="BACK"
              width={96}
              height={42}
              priority
            />
          </button>
        </div>

        <div className={styles.topSlot}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => router.push("/admin")}
            aria-label="Home"
            title="Home"
          >
            <Image
              src="/assets/ui/home.png"
              alt="HOME"
              width={96}
              height={42}
              priority
            />
          </button>

          <button
            type="button"
            className={styles.navBtn}
            onClick={onLogout}
            aria-label="Logout"
            title="Logout"
          >
            <Image
              src="/assets/ui/logout.png"
              alt="LOGOUT"
              width={120}
              height={42}
              priority
            />
          </button>
        </div>
      </header>

      {/* 콘텐츠 */}
      <section className={styles.stage}>
        <div className={styles.card}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>Admin Logs</h1>

            <div className={styles.searchWrap}>
              <label className={styles.searchLabel} htmlFor="logSearch">
                Search
              </label>
              <input
                id="logSearch"
                className={styles.search}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="actor / action / target"
                autoComplete="off"
              />
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thTime}>TIME</th>
                  <th className={styles.thActor}>ACTOR</th>
                  <th className={styles.thAction}>ACTION</th>
                  <th className={styles.thTarget}>TARGET</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className={styles.empty} colSpan={4}>
                      No logs found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className={styles.tr}>
                      <td className={styles.tdMono}>{row.time}</td>
                      <td className={styles.td}>{row.actor}</td>
                      <td className={styles.tdBadge}>
                        <span className={styles.badge}>{row.action}</span>
                      </td>
                      <td className={styles.td}>{row.target ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.footerNote}>
            Tip: 검색은 actor/action/target 전체에 적용됩니다.
          </div>
        </div>
      </section>
    </main>
  );
}
