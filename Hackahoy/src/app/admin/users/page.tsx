'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/common/AuthContext';
import styles from './users.module.css';

type Row = {
  id: string;
  nickname: string;
  role: 'ADMIN' | 'USER';
  banned: boolean;
  email?: string;
};

const MOCK_USERS: Row[] = [
  { id: '1', nickname: 'ABC', role: 'ADMIN', banned: false, email: 'a@a.com' },
  { id: '2', nickname: 'user1', role: 'USER', banned: true, email: 'u1@a.com' },
  {
    id: '3',
    nickname: 'user2',
    role: 'USER',
    banned: false,
    email: 'u2@a.com',
  },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>(MOCK_USERS);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.nickname.toLowerCase().includes(s) ||
        (r.email ?? '').toLowerCase().includes(s),
    );
  }, [q, rows]);

  const toggleRole = (id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, role: r.role === 'ADMIN' ? 'USER' : 'ADMIN' } : r,
      ),
    );
  };

  const toggleBanned = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, banned: !r.banned } : r)),
    );
  };

  const onSave = () => {
    console.log('[USERS SAVE]', rows);
    alert('저장(데모): 콘솔 확인');
  };

  return (
    <section className={styles.board}>
      <div className={styles.headerRow}>
        <div className={styles.title}>
          Users (Ban) : {user?.nickname ?? 'ADMIN'}
        </div>

        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search user..."
          />
          <button
            type="button"
            className="pixel-btn pixel-btn--sm"
            aria-label="ENTER"
          >
            ENTER
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
                className={`${styles.roleBtn} ${
                  r.role === 'ADMIN' ? styles.roleAdmin : styles.roleUser
                }`}
                onClick={() => toggleRole(r.id)}
                aria-label={`${r.nickname} 권한 변경`}
                aria-pressed={r.role === 'ADMIN'}
              >
                {r.role === 'ADMIN' ? 'ADMIN' : 'USER'}
                <span className={styles.roleArrow}>↕</span>
              </button>
            </div>

            <div className={styles.cell}>
              <button
                type="button"
                className={styles.banBox}
                onClick={() => toggleBanned(r.id)}
                aria-label={`${r.nickname} 차단 상태 변경`}
                aria-pressed={r.banned}
              >
                <span className={r.banned ? styles.banned : styles.active}>
                  {r.banned ? 'BANNED' : 'ACTIVE'}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <button
          className="pixel-btn pixel-btn--sm"
          onClick={() => router.push('/admin')}
        >
          BACK
        </button>

        <button className="pixel-btn pixel-btn--sm" onClick={onSave}>
          SAVE
        </button>
      </div>
    </section>
  );
}
