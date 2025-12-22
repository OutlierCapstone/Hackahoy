"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

type Role = "ADMIN" | "USER";

type Row = {
  id: string;
  nickname: string;
  role: Role;
  banned: boolean;
};

const PAGE_SIZE = 3;

const MOCK_USERS: Row[] = [
  { id: "1", nickname: "ABC", role: "ADMIN", banned: false },
  { id: "2", nickname: "user1", role: "USER", banned: true },
  { id: "3", nickname: "user2", role: "USER", banned: false },
  { id: "4", nickname: "user3", role: "USER", banned: false },
  { id: "5", nickname: "user4", role: "USER", banned: true },
  { id: "6", nickname: "user5", role: "USER", banned: false },
];

export default function AdminPage() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>(MOCK_USERS);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.nickname.toLowerCase().includes(s));
  }, [q, rows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const toggleRole = (id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, role: r.role === "ADMIN" ? "USER" : "ADMIN" } : r
      )
    );
  };

  const toggleBanned = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, banned: !r.banned } : r))
    );
  };

  const onSave = () => {
    console.log("[ADMIN SAVE]", rows);
    alert("저장(데모): 콘솔에서 rows 확인");
  };

  return (
    <section className={styles.board}>
      <div className={styles.headRow}>
        <div className={styles.title}>Admin</div>

        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="search user..."
          />
        </div>
      </div>

      <div className={styles.table}>
        <div className={`${styles.row} ${styles.rowHead}`}>
          <div className={styles.cell}>닉네임</div>
          <div className={styles.cell}>권한</div>
          <div className={styles.cell}>banned</div>
        </div>

        {pageRows.map((r) => (
          <div key={r.id} className={styles.row}>
            <div className={styles.cell}>{r.nickname}</div>

            <div className={styles.cell}>
              <button
                type="button"
                className={styles.roleBtn}
                onClick={() => toggleRole(r.id)}
              >
                {r.role === "ADMIN" ? "Admin" : "User"} <span>↕</span>
              </button>
            </div>

            <div className={styles.cell}>
              <button
                type="button"
                className={styles.banBox}
                onClick={() => toggleBanned(r.id)}
                aria-label={`toggle ban ${r.nickname}`}
              >
                {r.banned ? <span className={styles.check}>✓</span> : null}
              </button>
            </div>
          </div>
        ))}

        {Array.from({ length: PAGE_SIZE - pageRows.length }).map((_, i) => (
          <div key={`empty-${i}`} className={styles.row}>
            <div className={styles.cell}>&nbsp;</div>
            <div className={styles.cell}>&nbsp;</div>
            <div className={styles.cell}>&nbsp;</div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        // (AdminPage 내) CREATE 버튼 onClick만 수정
        <button
          type="button"
          className={styles.createBtn}
          onClick={() => router.push("/admin/problems/select")}
        >
          <Image
            src="/assets/ui/createproblem.png"
            alt="CREATE PROBLEM"
            width={160}
            height={90}
            priority
          />
        </button>
        <div className={styles.pager}>
          <button
            type="button"
            className={`${styles.pagerIconBtn} ${styles.pagerLeft}`}
            onClick={goPrev}
            disabled={safePage <= 1}
            aria-label="prev"
          />
          <div className={styles.pageText}>
            {safePage} / {totalPages}
          </div>
          <button
            type="button"
            className={`${styles.pagerIconBtn} ${styles.pagerRight}`}
            onClick={goNext}
            disabled={safePage >= totalPages}
            aria-label="next"
          />
        </div>
        <button type="button" className={styles.saveBtn} onClick={onSave}>
          <Image
            src="/assets/ui/save.png"
            alt="SAVE"
            width={160}
            height={90}
            priority
          />
        </button>
      </div>
    </section>
  );
}
