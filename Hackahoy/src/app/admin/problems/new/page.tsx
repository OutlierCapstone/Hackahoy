'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './new.module.css';
import axios from 'axios';

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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [flag, setFlag] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [category, setCategory] = useState<'WEB' | 'AI' | ''>('');
  const [writeUp, setWriteUp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pinId = useMemo(() => toPinId(sp.get('pin')), [sp]);

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
    const rawWriteUp = writeUp.trim();

    if (!rawTitle || !rawDescription || !rawFlag || !rawUrl || !category) {
      setError('모든 필드를 입력하고 카테고리(WEB/AI)를 선택해주세요.');
      setLoading(false);
      return;
    }

    if (!rawFlag.startsWith('hackahoy{') || !rawFlag.endsWith('}')) {
      setError('Flag 형식이 올바르지 않습니다. hackahoy{...} 형식으로 입력해주세요.');
      setLoading(false);
      return;
    }

    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      setError('서버 URL 형식이 올바르지 않습니다. http:// 또는 https://로 시작해야 합니다.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      const payload = {
        islandId: pinId,
        title: rawTitle,
        description: rawDescription,
        category: category,
        hint: '힌트는 기본값입니다.',
        correctFlag: rawFlag,
        serverLink: rawUrl,
        writeup: rawWriteUp,
      };

      await axios.post(
        'http://44.199.70.243:4000/admin/problems',
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
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
          <div className={styles.field}>
            <div className={styles.label}>Title</div>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요."
            />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>Description</div>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="문제를 설명하세요."
            />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>Write-up (Solution)</div>
            <textarea
              className={styles.textarea}
              style={{ minHeight: '120px' }}
              value={writeUp}
              onChange={(e) => setWriteUp(e.target.value)}
              placeholder={`{
  "title": "문제의 제목을 입력하세요",
  "category": "분류 (예: WEB, AI, SYSTEM)",
  "type": "취약점 유형 (예: SQL Injection, Prompt Injection)",
  "point": "이 문제의 핵심 공격 원리나 취약점을 한 문장으로 요약하세요.",
  "write_up": "1. 첫 번째 단계\n2. 두 번째 단계",
  "observation": "- 발견할 수 있는 특징",
  "thinking": "- 사용자가 던져야 할 질문",
  "wrong": "- 흔한 착각",
  "difficulty": "난이도 (하/중/상)"
}`}
            />
          </div>

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
            <div className={styles.field}>
              <div className={styles.label}>Flag</div>
              <input
                className={styles.input}
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="hackahoy{...}"
              />
            </div>
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
