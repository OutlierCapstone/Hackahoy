"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import styles from "./admin.module.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";

type Role = "ADMIN" | "USER";

type Row = {
  id: string;
  nickname: string;
  role: Role;
  banned: boolean;
};

const PAGE_SIZE = 3;

// 데모 데이터 (나중에 API로 교체)
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
  const { user, logout } = useAuth();

  // ✅ 권한 없으면 튕기기 (프론트 가드)
  if (!user || user.role !== "ADMIN") {
    // 필요하면 router.replace("/")로 바꿔도 됩니다.
    return null;
  }

  const adminName = user.nickname ?? "ADMIN";

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>(MOCK_USERS);
  const [page, setPage] = useState(1); // 1-based

  // 검색
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.nickname.toLowerCase().includes(s));
  }, [q, rows]);

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  // 권한 토글 (데모)
  const toggleRole = (id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, role: r.role === "ADMIN" ? "USER" : "ADMIN" } : r
      )
    );
  };

  // ✅ banned 토글 = ban / unban (데모, 나중에 API로 교체)
  const toggleBanned = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, banned: !r.banned } : r))
    );

    // TODO: 백엔드 연결 시
    // - banned: false -> true  => ban API 호출
    // - banned: true  -> false => unban API 호출
  };

  const onSave = () => {
    console.log("[ADMIN SAVE]", rows);
    alert("저장(데모): 콘솔에서 rows 확인");
  };

  return (
    <main className={styles.page}>
      {/* ✅ 메인처럼: 가운데 지도 + 좌우 여백 */}
      <div className={styles.bg} />

      {/* 좌상단 HOME */}
      <button
        type="button"
        className={`${styles.topBtn} ${styles.homeBtn}`}
        onClick={() => router.push("/")}
        aria-label="HOME"
      >
        <Image src="/assets/ui/home.png" alt="HOME" width={110} height={50} />
      </button>

      {/* 우상단 LOGOUT */}
      <button
        type="button"
        className={`${styles.topBtn} ${styles.logoutBtn}`}
        onClick={async () => {
          await logout();
          router.push("/");
        }}
        aria-label="LOGOUT"
      >
        <Image
          src="/assets/ui/logout.png"
          alt="LOGOUT"
          width={110}
          height={50}
        />
      </button>

      {/* 중앙 보드 */}
      <section className={styles.board}>
        {/* 상단: Admin + search */}
        <div className={styles.headRow}>
          <div className={styles.title}>Admin : {adminName}</div>

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
            {/* ✅ ENTER: 이미지 버튼 */}
            <button
              type="button"
              className={styles.enterImgBtn}
              aria-label="ENTER"
            >
              <Image
                src="/assets/ui/enter.png" // ✅ 실제 파일명으로 맞추세요
                alt="ENTER"
                width={120}
                height={80}
                priority
              />
            </button>
          </div>
        </div>

        {/* 테이블 */}
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
                {/* ✅ 박스 크기 고정 / 체크가 있어도 흔들리지 않게 */}
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

          {/* ✅ 빈 줄 채우기: 항상 3줄 보이게 */}
          {Array.from({ length: PAGE_SIZE - pageRows.length }).map((_, i) => (
            <div key={`empty-${i}`} className={styles.row}>
              <div className={styles.cell}>&nbsp;</div>
              <div className={styles.cell}>&nbsp;</div>
              <div className={styles.cell}>&nbsp;</div>
            </div>
          ))}
        </div>

        {/* 하단 영역 */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.createBtn}
            onClick={() => router.push("/admin/problems/new")}
          >
            <Image
              src="/assets/ui/createproblem.png"
              alt="CREATE PROBLEM"
              width={160}
              height={90}
              priority
            />
          </button>

          {/* ✅ ◀ ▶ 페이지 넘김 (70x70 느낌) */}
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
    </main>
  );
}
