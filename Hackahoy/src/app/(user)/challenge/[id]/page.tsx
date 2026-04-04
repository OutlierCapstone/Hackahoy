'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import styles from './challenge.module.css';
import { getProblem, submitFlag } from '@/lib/api/islands';
import { useAuth } from '@/components/common/AuthContext';

type Problem = {
  id: number;
  title: string;
  description: string;
  hint: string | null;
  serverLink: string;
  islandId: number;
};

// 1~7번 문제는 고정 에셋 사용, 그 외는 default
const FIXED_PROBLEM_IDS = new Set([1, 2, 3, 4, 5, 6, 7]);

function getBgImage(problem: Problem): string {
  if (FIXED_PROBLEM_IDS.has(problem.id)) {
    return `/assets/backgrounds/island-${problem.id}.png`;
  }
  return `/assets/backgrounds/default-island.png`;
}

function getHintIcon(problem: Problem): string {
  if (FIXED_PROBLEM_IDS.has(problem.id)) {
    return `/assets/icons/hint-${problem.id}.png`;
  }
  return `/assets/icons/default-hint.png`;
}

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const [flagInput, setFlagInput] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const auth: any = useAuth();
  const user = auth?.user;
  const refreshUser = auth?.refreshUser;

  const [aiHint, setAiHint] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const router = useRouter();

  const saveUserLog = useCallback(async (type: 'VISIT' | 'SUBMIT' | 'HINT', data: any = {}) => {
    try {
      const token = localStorage.getItem('accessToken');
      const currentUserId = user?.userId;
      console.log('[saveUserLog] 호출됨', { type, token: !!token, id, currentUserId });

      if (!token || !id || !currentUserId) return;

      let fakeMethod = "POST";
      let fakeUri = "/";
      let fakePayload = {};

      if (type === 'VISIT') {
        fakeMethod = "GET";
        fakeUri = "/";
        fakePayload = { url: data.url };
      } else if (type === 'SUBMIT') {
        fakeMethod = "POST";
        fakeUri = "/api/auth/login";
        fakePayload = { id: "admin", pwd: data.input };
      } else if (type === 'HINT') {
        fakeMethod = "POST";
        fakeUri = "/api/ai/hint";
        fakePayload = { current_attempt: data.input };
      }

      await fetch(`http://44.199.70.243:4000/api/collect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUserId,
          problem_id: Number(id),
          method: fakeMethod,
          uri: fakeUri,
          payload: JSON.stringify(fakePayload),
          headers: { "user-agent": navigator.userAgent }
        }),
      });
    } catch (err) {
      console.error("❌ 로그 저장 실패:", err);
    }
  }, [id, user]);

  // 1. 문제 로드
  useEffect(() => {
    if (!id) return;
    async function fetchProblem() {
      try {
        const response = await getProblem(Number(id));
        let data = response?.data || response;
        if (Array.isArray(data)) data = data[0];
        setProblem(data?.title || data?.id ? data : null);
      } catch (error) {
        setProblem(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProblem();
  }, [id]);

  // 2. 정답 제출
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem || submitting) return;

    saveUserLog('SUBMIT', { input: flagInput });

    setSubmitting(true);
    try {
      const result = await submitFlag(problem.id, flagInput.trim());
      if (result.correct) {
        const prevLevel = user?.levelNum ?? 1;
        const newLevel = result.newLevel;
        if (refreshUser) await refreshUser();

        if (newLevel > prevLevel) {
          router.push(`/level-up?prevShip=${encodeURIComponent(`/assets/ships/ship-${prevLevel}.png`)}&newShip=${encodeURIComponent(`/assets/ships/ship-${newLevel}.png`)}&isLevelUp=true&redirect=/`);
        } else {
          const currentLevel = result.newLevel ?? prevLevel;
          router.push(`/level-up?newShip=${encodeURIComponent(`/assets/ships/ship-${currentLevel}.png`)}&isLevelUp=false&redirect=/`);
        }
      } else {
        alert("틀렸습니다. 다시 생각해보세요! ❌");
      }
    } catch (err) {
      alert("서버 통신 오류");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. AI 힌트
  const handleHintClick = async () => {
    if (!problem) return;
    setIsAiLoading(true);
    setHintOpen(true);

    saveUserLog('HINT', { input: flagInput });

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://44.199.70.243:4000/ai-tutor/hint`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: problem.id })
      });
      const result = await res.json();
      setAiHint(typeof result === 'string' ? result : result.hint);
    } catch (err) {
      console.error("힌트 에러:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (loading) return <main className={styles.pageRoot}><div className={styles.statusText}>Loading...</div></main>;
  if (!problem) return <main className={styles.pageRoot}><div className={styles.statusText}>No Problem.</div></main>;

  return (
    <main className={styles.pageRoot}>
      {/* 배경: 1~7번은 고정 에셋, 그 외는 default */}
      <div className={styles.bg} style={{ backgroundImage: `url(${getBgImage(problem)})` }} />

      <section className={styles.stage}>
        <div className={styles.boardWrap}>
          <div className={styles.board}>
            <h1 className={styles.title}>{problem.title}</h1>
            <p className={styles.desc}>{problem.description}</p>
            {problem.serverLink && (
              <p className={styles.link}>
                Server: <a
                  href={`http://44.199.70.243:500${problem.id}/set-uid?uid=${user?.userId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => saveUserLog('VISIT', { url: problem.serverLink })}
                >
                  {`http://52.78.240.6:500${problem.id}`}
                </a>
              </p>
            )}
            <form className={styles.formRow} onSubmit={onSubmit}>
              <input
                className={styles.input}
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
                placeholder="hackahoy{...}"
                disabled={submitting}
              />
              <button type="submit" className={styles.flagBtn} disabled={submitting}>
                <Image src="/assets/ui/flag.png" alt="flag" width={94} height={70} />
              </button>
            </form>
          </div>

          {/* 힌트 아이콘: 1~7번은 고정 에셋, 그 외는 default */}
          <button type="button" className={styles.hintBtn} onClick={handleHintClick}>
            <Image src={getHintIcon(problem)} alt="hint" width={260} height={320} />
          </button>
        </div>
      </section>

      {hintOpen && (
        <div className={styles.modalDim} onClick={() => setHintOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>🤖 AI TUTOR HINT</div>
              <button className={styles.modalClose} onClick={() => setHintOpen(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                {isAiLoading ? "AI 분석 중..." : (aiHint || problem.hint || "힌트가 없습니다.")}
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.okBtn} onClick={() => setHintOpen(false)}>ok</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}