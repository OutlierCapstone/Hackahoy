// src/app/(user)/challengelist/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import styles from './challengelist.module.css';
import { API_BASE_URL } from "@/lib/api/config";
import { useAuth } from '@/components/common/AuthContext';

interface Problem {
  id: number;
  title: string;
  category: 'WEB' | 'AI';
  solved: boolean;
}

export default function ChallengeListPage() {
  const router = useRouter();
  const { user, authReady } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;

  // authReady 를 기다린다.
  //
  // 게스트 발급(loginAsGuest)은 비동기라 POST /auth/guest 응답이 와야 토큰이 저장된다.
  // 예전에는 마운트 즉시 localStorage 를 읽고 deps 가 [] 였다. 그래서 발급이 끝나기 전에
  // 이 페이지가 마운트되면 Bearer null 로 401 을 받고, 토큰이 나중에 들어와도
  // 재요청을 안 해 리스트가 영구히 비어 있었다.
  // 마이페이지가 같은 이유로 홈으로 튕기던 것과 동일한 버그다.
  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      setLoading(false);
      setLoadError(true);
      return;
    }

    let cancelled = false;
    const fetchProblems = async () => {
      try {
        const response = await axios.get<Problem[]>(
          `${API_BASE_URL}/problem/user-list`,
          { withCredentials: true },
        );
        if (cancelled) return;
        setProblems(response.data);
        setLoadError(false);
      } catch (error) {
        if (cancelled) return;
        console.error('데이터 로드 실패:', error);
        setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProblems();
    return () => {
      cancelled = true;
    };
  }, [authReady, user?.userId]);

  const filteredList = useMemo(() => {
    return problems.filter((p) => {
      if (filter === 'ALL') return true;
      if (filter === 'SOLVED') return p.solved;
      if (filter === 'UNSOLVED') return !p.solved;
      return p.category === filter;
    });
  }, [filter, problems]);

  const pagedList = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;

  if (loading)
    return (
      <main className={styles.pageRoot}>
        <div className={styles.statusText}>Loading...</div>
      </main>
    );

  return (
    <main className={styles.pageRoot}>
      <div className={styles.card}>
        <header className={styles.boardHeader}>
          <h1 className={styles.boardTitle}>CHALLENGE BOARD</h1>
          <span className={styles.boardCount}>{filteredList.length}개의 임무</span>
        </header>

        <nav className={styles.filterBar} aria-label="문제 필터">
          {['ALL', 'AI', 'WEB', 'SOLVED', 'UNSOLVED'].map((type) => (
            <button
              key={type}
              type="button"
              className={`${styles.filterTab} ${filter === type ? styles.filterTabActive : ''}`}
              aria-label={`${type} 문제 필터`}
              aria-pressed={filter === type}
              onClick={() => {
                setFilter(type);
                setCurrentPage(0);
              }}
            >
              {type}
            </button>
          ))}
        </nav>

        <div className={styles.listScroll}>
          {/* 빈 리스트를 말없이 보여주면 고장인지 아닌지 구분이 안 된다. */}
          {loadError && problems.length === 0 && (
            <div className={styles.statusText}>
              목록을 불러오지 못했습니다. 새로고침해 주세요.
            </div>
          )}
          {pagedList.map((p) => (
            <button
              key={p.id}
              type="button"
              className={styles.challengeItem}
              onClick={() => router.push(`/challenge/${p.id}`)}
              aria-label={`${p.title}, ${p.solved ? '해결함' : '미해결'}`}
            >
              <span className={styles.challengeTitle}>{p.title}</span>
              <span
                className={`${styles.statusBadge} ${
                  p.solved ? styles.statusSolved : styles.statusUnsolved
                }`}
              >
                <span className={styles.statusMark} aria-hidden>{p.solved ? '✓' : '×'}</span>
                {p.solved ? 'SOLVED' : 'UNSOLVED'}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.footer}>
          <button
            className={`pixel-btn pixel-btn--sm ${styles.mypageBtn}`}
            onClick={() => router.push('/mypage')}
          >
            MY PAGE
          </button>
          <div className={styles.pagination}>
            <button
              className={styles.arrowBtn}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              ◀
            </button>
            <span className={styles.pageText}>
              {currentPage + 1} / {totalPages}
            </span>
            <button
              className={styles.arrowBtn}
              onClick={() =>
                setCurrentPage((p) => (p + 1 < totalPages ? p + 1 : p))
              }
              disabled={currentPage + 1 >= totalPages}
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
