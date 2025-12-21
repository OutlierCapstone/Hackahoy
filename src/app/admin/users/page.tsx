"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import styles from "./users.module.css";

type Row = {
  id: string;
  nickname: string;
  role: "ADMIN" | "USER";
  banned: boolean;
  email?: string;
};

const MOCK_USERS: Row[] = [
  { id: "1", nickname: "ABC", role: "ADMIN", banned: false, email: "a@a.com" },
  { id: "2", nickname: "user1", role: "USER", banned: true, email: "u1@a.com" },
  {
    id: "3",
    nickname: "user2",
    role: "USER",
    banned: false,
    email: "u2@a.com",
  },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuth(); // logout 제거

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>(MOCK_USERS);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.nickname.toLowerCase().includes(s) ||
        (r.email ?? "").toLowerCase().includes(s)
    );
  }, [q, rows]);

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
    console.log("[USERS SAVE]", rows);
    alert("저장(데모): 콘솔 확인");
  };

  return (
    <section className={styles.board}>
      <div className={styles.headerRow}>
        <div className={styles.title}>
          Users (Ban) : {user?.nickname ?? "ADMIN"}
        </div>

        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search user..."
          />
          <button type="button" className={styles.enterBtn} aria-label="ENTER">
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
          <div className={styles.cell}>닉네임</div>
          <div className={styles.cell}>권한</div>
          <div className={styles.cell}>banned</div>
        </div>

        {filtered.map((r) => (
          <div key={r.id} className={styles.row}>
            <div className={styles.cell}>{r.nickname}</div>

            <div className={styles.cell}>
              <button
                type="button"
                className={styles.roleBtn}
                onClick={() => toggleRole(r.id)}
              >
                {r.role === "ADMIN" ? "Admin" : "User"}
                <span className={styles.roleArrow}>↕</span>
              </button>
            </div>

            <div className={styles.cell}>
              <button
                type="button"
                className={styles.banBox}
                onClick={() => toggleBanned(r.id)}
              >
                {r.banned && <span className={styles.banCheck}>✓</span>}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <button
          className={styles.backAdminBtn}
          onClick={() => router.push("/admin")}
        >
          <Image src="/assets/ui/back.png" alt="BACK" width={86} height={46} />
        </button>

        <button className={styles.saveBtn} onClick={onSave}>
          <Image src="/assets/ui/save.png" alt="SAVE" width={92} height={48} />
        </button>
      </div>
    </section>
  );
}
