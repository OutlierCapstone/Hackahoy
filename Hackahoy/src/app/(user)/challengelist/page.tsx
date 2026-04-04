// src/app/(user)/challengelist/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './challengelist.module.css';

interface Problem {
  id: number;
  title: string;
  category: 'WEB' | 'AI';
  solved: boolean;
}

export default function ChallengeListPage() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get<Problem[]>(
          'http://44.199.70.243:4000/problem/user-list',
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setProblems(response.data);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        // 에러 시 처리 (예: 로그인 페이지 이동)
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

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
        <div className={styles.filterBarContainer}>
          <Image
            src="/assets/ui/challengelistbar.png"
            alt="Filter Bar"
            width={580}
            height={60}
            priority
          />
          <div className={styles.filterOverlay}>
            {['ALL', 'AI', 'WEB', 'SOLVED', 'UNSOLVED'].map((type) => (
              <div
                key={type}
                className={styles.filterZone}
                onClick={() => {
                  setFilter(type);
                  setCurrentPage(0);
                }}
              />
            ))}
          </div>
        </div>

        <div className={styles.listScroll}>
          {pagedList.map((p) => (
            <div
              key={p.id}
              className={styles.challengeItem}
              onClick={() => router.push(`/challenge/${p.id}`)}
            >
              <span className={styles.challengeTitle}>{p.title}</span>
              <div className={styles.statusIcon}>
                <Image
                  src={
                    p.solved
                      ? '/assets/ui/solved.png'
                      : '/assets/ui/unsolved.png'
                  }
                  alt={p.solved ? 'SOLVED' : 'UNSOLVED'}
                  width={130}
                  height={p.solved ? 40 : 35}
                />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.mypageBtn}
            onClick={() => router.push('/mypage')}
          >
            <Image
              src="/assets/ui/mypage.png"
              alt="MYPAGE"
              width={100}
              height={40}
            />
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