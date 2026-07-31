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

// 리버스 프록시(OpenResty)가 떠 있는 호스트. 반드시 한 곳으로 고정한다.
const CHALLENGE_HOST = process.env.NEXT_PUBLIC_CHALLENGE_HOST ?? '44.199.70.243';

/**
 * 챌린지 진입 주소를 만든다. 화면에 보이는 문자열과 실제 이동 주소가 항상 같다.
 *
 * 왜 이렇게 하는가
 *   uid 쿠키는 프록시의 /set-uid 를 거칠 때만 심기고, 쿠키가 없으면 학습자의 모든
 *   요청이 서버에서 anonymous 로 폐기된다(로그가 하나도 안 쌓인다).
 *   이전 코드는 href 가 44.199.70.243, 화면 표시가 52.78.240.6 으로 서로 달랐다.
 *   학습자가 보이는 주소를 복사해 접속하면 쿠키 없는 다른 오리진이 되어
 *   공격 시도 로그가 전부 사라졌다.
 *
 *   포트도 `500${problem.id}` 로 문자열 결합하고 있었다. 문제 id 가 8 이상이면
 *   5008(nginx 에 listen 이 없다), 두 자리면 50010 이 된다.
 *
 * 호스트와 포트를 분리해서 다루는 이유
 *   serverLink 는 관리자가 문제 등록 화면에서 직접 입력하는 자유 텍스트라
 *   옛 호스트가 섞여 있을 수 있다. 그래서 호스트는 CHALLENGE_HOST 로 고정하고
 *   포트만 serverLink 에서 가져온다. 포트를 못 찾으면 문제 번호 규칙으로 되돌린다.
 */
function buildChallengeEntry(
  problem: Problem,
  userId?: string,
): { display: string; href: string } {
  let port = '';

  try {
    port = new URL(problem.serverLink).port;
  } catch {
    // serverLink 가 URL 형식이 아닐 수 있다 (예: "52.78.240.6:5004")
  }
  if (!port) {
    const matched = problem.serverLink?.match(/:(\d{4,5})(?:\D|$)/);
    port = matched ? matched[1] : String(5000 + problem.id);
  }

  const origin = `http://${CHALLENGE_HOST}:${port}`;
  const entry = new URL('/set-uid', origin);
  // uid 가 없으면 파라미터를 붙이지 않는다. 프록시가 "uid 없음" 경고를 남긴다.
  if (userId) entry.searchParams.set('uid', userId);

  return { display: origin, href: entry.toString() };
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
            {problem.serverLink && (() => {
              const entry = buildChallengeEntry(problem, user?.userId);
              return (
                <p className={styles.link}>
                  Server: <a
                    href={entry.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => saveUserLog('VISIT', { url: problem.serverLink })}
                  >
                    {entry.display}
                  </a>
                </p>
              );
            })()}
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