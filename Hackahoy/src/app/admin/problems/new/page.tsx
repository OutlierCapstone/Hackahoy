'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './new.module.css';
import axios from 'axios';

// 핀 ID 유효성 검사 함수
function toPinId(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return n === 1 || n === 2 || n === 3 ? n : null;
}

export default function AdminCreateProblemPage() {
  return (
    <Suspense fallback={<div style={{ color: 'white' }}>로딩 중...</div>}>
      <AdminCreateProblemContent />
    </Suspense>
  );
}

function AdminCreateProblemContent() {
  const router = useRouter();
  const sp = useSearchParams();

  // 상태 관리
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [flag, setFlag] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [category, setCategory] = useState<'WEB' | 'AI' | ''>(''); // 카테고리 상태 추가
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pinId = useMemo(() => toPinId(sp.get('pin')), [sp]);

  // 접근 권한 및 핀 ID 체크
  useEffect(() => {
    if (!pinId) {
      router.replace('/admin/problems/select');
    }
  }, [pinId, router]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const rawTitle = title.trim();
    const rawDescription = description.trim();
    const rawFlag = flag.trim();
    const rawUrl = serverUrl.trim();

    // 필수 입력값 검증
    if (!rawTitle || !rawDescription || !rawFlag || !rawUrl || !category) {
      setError('모든 필드를 입력하고 카테고리(WEB/AI)를 선택해주세요.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      await axios.post(
        'http://localhost:4000/admin/problems',
        {
          islandId: pinId,
          title: rawTitle,
          description: rawDescription,
          category: category, // 선택된 카테고리 전송
          hint: '힌트는 기본값입니다.',
          correctFlag: rawFlag,
          serverLink: rawUrl,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      alert('✅ 문제가 성공적으로 등록되었습니다!');
      router.push(`/island/${pinId}`);
    } catch (err: any) {
      setError(
        err.response?.data?.message || '등록 실패: 서버 설정을 확인하세요.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.stage}>
      <div className={styles.board}>
        {/* 우측 상단 닫기 버튼 */}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => router.push('/admin/problems/select')}
        >
          ✕
        </button>

        <h1 className={styles.title}>Create Problem</h1>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form className={styles.form} onSubmit={onCreate}>
          {/* Title 입력 */}
          <div className={styles.field}>
            <div className={styles.label}>Title</div>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요."
            />
          </div>

          {/* Description 입력 */}
          <div className={styles.field}>
            <div className={styles.label}>Description</div>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="설명을 입력하세요"
            />
          </div>

          {/* Category 선택 버튼 (WEB / AI) */}
          <div className={styles.field}>
            <div className={styles.label}>Category</div>
            <div className={styles.categoryRow}>
              <button
                type="button"
                className={`${styles.catBtn} ${category === 'WEB' ? styles.catBtnActive : ''}`}
                onClick={() => setCategory('WEB')}
              >
                WEB
              </button>
              <button
                type="button"
                className={`${styles.catBtn} ${category === 'AI' ? styles.catBtnActive : ''}`}
                onClick={() => setCategory('AI')}
              >
                AI
              </button>
            </div>
          </div>

          <div className={styles.row2}>
            {/* Flag 입력 */}
            <div className={styles.field}>
              <div className={styles.label}>Flag</div>
              <input
                className={styles.input}
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="hackahoy{...}"
              />
            </div>
            {/* Server URL 입력 */}
            <div className={styles.field}>
              <div className={styles.label}>Server</div>
              <input
                className={styles.input}
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* 생성 버튼 */}
          <div className={styles.footer}>
            <button type="submit" className={styles.imgBtn} disabled={loading}>
              <Image
                src="/assets/ui/createproblem.png"
                alt="CREATE"
                width={170}
                height={64}
              />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
