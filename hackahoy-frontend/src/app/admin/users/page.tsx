"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import styles from "./users.module.css";
import axios from "axios";

type Row = {
  id: string;
  nickname: string;
  role: "ADMIN" | "USER";
  banned: boolean;
  email?: string;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuth() as any;

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]); // 1. 초기값은 빈 배열로 시작
  const [loading, setLoading] = useState(true);

  // 2. 실제 백엔드에서 유저 리스트 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get("http://52.78.240.6:4000/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 백엔드 응답 데이터(res.data)를 rows 상태에 세팅
        setRows(res.data.user);
      } catch (err) {
        console.error("유저 목록 로드 실패:", err);
        alert("유저 목록을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

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

  // 3. 변경 사항을 서버에 일괄 저장
  const onSave = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      await axios.post(
        "http://52.78.240.6:4000/admin/users/batch-update",
        { users: rows },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ 모든 변경 사항이 성공적으로 저장되었습니다.");
    } catch (err: any) {
      console.error("저장 실패:", err);
      alert(`❌ 저장 실패: ${err.response?.data?.message || "서버 에러"}`);
    }
  };

  if (loading)
    return (
      <div style={{ color: "white", padding: "20px" }}>Loading Users...</div>
    );

  return (
    <section className={styles.board}>
      <div className={styles.headerRow}>
        <div className={styles.title}>
          Users (Management) : {user?.nickname ?? "ADMIN"}
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

        {filtered.length === 0 ? (
          <div
            className={styles.row}
            style={{ justifyContent: "center", color: "#ccc" }}
          >
            검색 결과가 없습니다.
          </div>
        ) : (
          filtered.map((r) => (
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
          ))
        )}
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
            priority
          />
        </button>

        <button className={styles.saveBtn} onClick={onSave}>
          <Image
            src="/assets/ui/save.png"
            alt="SAVE"
            width={92}
            height={48}
            priority
          />
        </button>
      </div>
    </section>
  );
}
