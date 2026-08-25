'use client';

import Image from 'next/image';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';
import { listUsers, setUserBanned, AdminUser } from '@/lib/api/admin';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api/config';

type Role = 'ADMIN' | 'USER';

const PAGE_SIZE = 3;

export default function AdminPage() {
  const router = useRouter();

  const [q, setQ] = useState('');
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listUsers({ keyword: q });
      setRows(data);
    } catch (err) {
      console.error('유저 목록 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, safePage]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const toggleRole = (id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, role: r.role === 'ADMIN' ? 'USER' : 'ADMIN' } : r,
      ),
    );
  };

  const handleToggleBanned = (userId: string, currentBanned: boolean) => {
    setRows((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, banned: !currentBanned } : u)),
    );
  };

  const onSave = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/admin/users/batch-update`,
        { users: rows },
        { withCredentials: true },
      );

      alert('변경 사항이 성공적으로 저장되었습니다! 💾');
    } catch (err) {
      console.error('저장 실패:', err);
      alert(
        '서버에 저장하는 중 오류가 발생했습니다. 백엔드 엔드포인트를 확인하세요.',
      );
    }
  };

  return (
    <section className={styles.board}>
      <div className={styles.headRow}>
        <div className={styles.title}>Admin</div>
        <div className={styles.topRightActions}>
          <button
            type="button"
            className={styles.bellBtn}
            onClick={() => router.push('/admin/notifications')}
            aria-label="보안 알림 보기"
          >
            <Image src="/assets/ui/bell.png" alt="" width={28} height={28} />
          </button>

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
      </div>

      <div className={styles.table}>
        <div className={`${styles.row} ${styles.rowHead}`}>
          <div className={styles.cell}>닉네임</div>
          <div className={styles.cell}>권한</div>
          <div className={styles.cell}>banned</div>
        </div>

        {loading ? (
          <div className={styles.row}>
            <div
              className={styles.cell}
              style={{ width: '100%', textAlign: 'center' }}
            >
              Loading...
            </div>
          </div>
        ) : (
          pageRows.map((r) => (
            <div key={r.id} className={styles.row}>
              <div className={styles.cell}>{r.nickname}</div>
              <div className={styles.cell}>
                <button
                  type="button"
                  className={`${styles.roleBtn} ${
                    r.role === 'ADMIN' ? styles.roleAdmin : styles.roleUser
                  }`}
                  onClick={() => toggleRole(r.id)}
                  aria-label={`${r.nickname} 권한 변경`}
                  aria-pressed={r.role === 'ADMIN'}
                >
                  {r.role === 'ADMIN' ? 'ADMIN' : 'USER'}
                  <span className={styles.toggleMark}>↕</span>
                </button>
              </div>
              <div className={styles.cell}>
                <button
                  type="button"
                  className={styles.banBox}
                  onClick={() => handleToggleBanned(r.id, r.banned)}
                  aria-label={`${r.nickname} 차단 상태 변경`}
                  aria-pressed={r.banned}
                >
                  <span className={r.banned ? styles.banned : styles.active}>
                    {r.banned ? 'BANNED' : 'ACTIVE'}
                  </span>
                </button>
              </div>
            </div>
          ))
        )}

        {!loading &&
          Array.from({ length: PAGE_SIZE - pageRows.length }).map((_, i) => (
            <div key={`empty-${i}`} className={styles.row}>
              <div className={styles.cell}>&nbsp;</div>
              <div className={styles.cell}>&nbsp;</div>
              <div className={styles.cell}>&nbsp;</div>
            </div>
          ))}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className="pixel-btn"
          onClick={() => router.push('/admin/problems/select')}
        >
          CREATE PROBLEM
        </button>

        <div className={styles.pager}>
          <button
            type="button"
            className={`${styles.pagerIconBtn} ${styles.pagerLeft}`}
            onClick={goPrev}
            disabled={safePage <= 1}
            aria-label="이전 페이지"
          />
          <div className={styles.pageText}>
            {safePage} / {totalPages}
          </div>
          <button
            type="button"
            className={`${styles.pagerIconBtn} ${styles.pagerRight}`}
            onClick={goNext}
            disabled={safePage >= totalPages}
            aria-label="다음 페이지"
          />
        </div>

        <button type="button" className="pixel-btn" onClick={onSave}>
          SAVE
        </button>
      </div>
    </section>
  );
}
