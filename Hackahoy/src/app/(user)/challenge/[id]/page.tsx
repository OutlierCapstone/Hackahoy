'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import styles from './challenge.module.css';
import { getProblem, submitFlag } from '@/lib/api/islands';
import { useAuth } from '@/components/common/AuthContext';

type HintData = { img: string; text: string };

type Problem = {
  id: number;
  title: string;
  description: string;
  hint: string | null;
  serverLink: string;
  islandId: number;
};

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const [flagInput, setFlagInput] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Auth 데이터 추출 (userId 필드 사용)
  const auth: any = useAuth();
  const user = auth?.user;
  const refreshUser = auth?.refreshUser;

  const [aiHint, setAiHint] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const router = useRouter();

  // 🔥 [핵심] AI 서버가 원하는 "POST /api/..." 형식으로 로그를 가공하는 함수
  // ChallengePage.tsx 내부의 saveUserLog 함수 수정

const saveUserLog = useCallback(async (type: 'VISIT' | 'SUBMIT' | 'HINT', data: any = {}) => {
  try {
    const token = localStorage.getItem('accessToken');
    const currentUserId = user?.userId; 
    // 🔥 여기에 로그 추가
    console.log('[saveUserLog] 호출됨', { type, token: !!token, id, currentUserId });

    if (!token || !id || !currentUserId) return;

    let fakeMethod = "POST";
    let fakeUri = "/";
    let fakePayload = {};

    if (type === 'VISIT') {
      fakeMethod = "GET";
      fakeUri = "/"; // 👈 여기
      fakePayload = { url: data.url };
    } else if (type === 'SUBMIT') {
      fakeMethod = "POST";
      fakeUri = "/api/auth/login"; // 👈 여기
      fakePayload = { id: "admin", pwd: data.input }; 
    } else if (type === 'HINT') {
      fakeMethod = "POST";
      fakeUri = "/api/ai/hint"; // 👈 여기
      fakePayload = { current_attempt: data.input };
    }

    await fetch(`http://localhost:4000/api/collect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: currentUserId,
        problem_id: Number(id),
        method: fakeMethod,
        // 🔥 수정: fakeMethod를 빼고 fakeUri만 보냅니다. 
        // 백엔드에서 "GET" + " /" 를 합쳐서 "GET /"를 만들어줄 겁니다.
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

    // 🔥 로그 남기기 (변장된 포맷)
    saveUserLog('SUBMIT', { input: flagInput });

    setSubmitting(true);
    try {
      const result = await submitFlag(problem.id, flagInput.trim());
      if (result.correct) {
        const prevLevel = user?.levelNum ?? 1;
        const newLevel = result.newLevel;
        if (refreshUser) await refreshUser();

        if (newLevel > prevLevel) {
          router.push(`/level-up?prevShip=${encodeURIComponent(`/assets/ships/ship-${prevLevel}.png`)}&newShip=${encodeURIComponent(`/assets/ships/ship-${newLevel}.png`)}&redirect=/`);
        } else {
          alert("정답입니다! 🎉");
          setFlagInput("");
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

  // 3. AI 힌트 클릭 (로그 저장 + 힌트 요청 연동)
  const handleHintClick = async () => {
    if (!problem) return;
    setIsAiLoading(true);
    setHintOpen(true);
    
    // 🔥 힌트 요청 로그 남기기
    saveUserLog('HINT', { input: flagInput });

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:4000/ai-tutor/hint`, {
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
      <div className={styles.bg} style={{ backgroundImage: `url(/assets/backgrounds/island-${problem.id}.png)` }} />
      <section className={styles.stage}>
        <div className={styles.boardWrap}>
          <div className={styles.board}>
            <h1 className={styles.title}>{problem.title}</h1>
            <p className={styles.desc}>{problem.description}</p>
            {problem.serverLink && (
              <p className={styles.link}>
                Server: <a 
                          href={`http://localhost:500${problem.id}/set-uid?uid=${user?.userId}`} // 👈 localhost 대신 실제 IP 사용
                          target="_blank" 
                          rel="noopener noreferrer" // 보안을 위해 추가 권장
                          onClick={() => saveUserLog('VISIT', { url: problem.serverLink })}
                        >
                          {`http://52.78.240.6:500${problem.id}`}
                        </a>
              </p>
            )}
            <form className={styles.formRow} onSubmit={onSubmit}>
              <input className={styles.input} value={flagInput} onChange={(e) => setFlagInput(e.target.value)} placeholder="flag{...}" disabled={submitting} />
              <button type="submit" className={styles.flagBtn} disabled={submitting}>
                <Image src="/assets/ui/flag.png" alt="flag" width={94} height={70} />
              </button>
            </form>
          </div>
          <button type="button" className={styles.hintBtn} onClick={handleHintClick}>
            <Image src={`/assets/icons/hint-${[1,2,3,4,5,6,7].includes(problem.id) ? problem.id : 'default'}.png`} alt="hint" width={260} height={320} />
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