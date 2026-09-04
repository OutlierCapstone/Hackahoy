'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import styles from './challenge.module.css';
import { getProblem, submitFlag } from '@/lib/api/islands';
import { useAuth } from '@/components/common/AuthContext';
import { API_BASE_URL } from "@/lib/api/config";

type Problem = {
  id: number;
  title: string;
  description: string;
  hint: string | null;
  serverLink: string;
  islandId: number;
  /** 이 사용자가 이미 해결한 문제인지. 서버가 내려준다. */
  solved?: boolean;
};

type ConceptExplanation = {
  title: string;
  headline: string;
  concept: string;
  walkthrough: string;
  cause: string;
  defense: string;
};

const CONCEPT_EXPLANATIONS: Record<number, ConceptExplanation> = {
  1: {
    title: 'Context Poisoning',
    headline: '신뢰할 수 없는 문서와 AI 지시의 경계',
    concept:
      'Context Poisoning은 LLM이 참고하는 문서에 조작된 정보를 삽입하여 AI의 판단을 왜곡하는 공격입니다.',
    walkthrough:
      'AI가 판정에 사용하는 외부 문서에 정상적인 점검 기록처럼 보이는 내용을 삽입합니다. AI가 이를 신뢰하면 문지기의 보안 상태를 OPEN으로 잘못 판단합니다.',
    cause: '신뢰할 수 없는 문서를 검증 없이 AI의 Context에 포함함',
    defense: '외부 문서의 출처와 무결성을 검증하고, 데이터와 명령을 구분함',
  },
  2: {
    title: 'IDOR(Insecure Direct Object Reference)',
    headline: '객체 식별자와 접근 권한의 경계',
    concept:
      'IDOR은 URL이나 요청값의 객체 식별자를 변경하여 다른 사용자의 정보에 접근하는 취약점입니다.',
    walkthrough:
      '요청에 포함된 userId를 선장의 ID로 변경합니다. 서버가 정보의 소유자를 확인하지 않아 선장의 임무 정보를 반환합니다.',
    cause: '로그인 여부만 확인하고 데이터 접근 권한은 검사하지 않음',
    defense: '서버에서 요청한 사용자와 데이터의 소유자를 확인함',
  },
  3: {
    title: 'Prompt Injection',
    headline: '사용자 입력과 시스템 지시의 경계',
    concept:
      'Prompt Injection은 공격자가 새로운 지시를 입력하여 LLM이 기존 지시를 무시하거나 의도하지 않은 행동을 하도록 유도하는 공격입니다.',
    walkthrough:
      '챗봇이 따르던 기존 규칙을 무시하도록 새로운 지시를 입력합니다. AI가 이 지시를 우선하면 숨겨진 정보가 노출되거나 서비스의 원래 기능에서 벗어난 응답을 생성합니다.',
    cause: '사용자의 입력과 시스템의 지시를 AI가 완전히 구분하지 못함',
    defense: '민감한 정보를 프롬프트에 직접 저장하지 않고, 출력 결과를 별도로 검증함',
  },
  4: {
    title: 'OS Command Injection',
    headline: '사용자 입력과 시스템 명령의 경계',
    concept:
      'OS Command Injection은 사용자 입력이 시스템 명령어에 포함되어 의도하지 않은 운영체제 명령까지 실행되는 취약점입니다.',
    walkthrough:
      'ping 입력값에 다른 시스템 명령어가 함께 실행되도록 조작합니다. 입력값이 서버의 exec() 함수에 그대로 전달되면서 추가 명령이 실행됩니다.',
    cause: '사용자 입력을 시스템 명령어에 직접 연결함',
    defense: '셸을 사용하지 않고 명령어와 인자를 분리하며 허용된 값만 전달함',
  },
  5: {
    title: '접근 통제 취약점(BAC, Broken Access Control)',
    headline: '화면 제한과 서버 권한 검증의 경계',
    concept:
      'Broken Access Control은 인증된 사용자가 자신의 권한 범위를 넘어 다른 사용자의 자원이나 제한된 기능에 접근·수정할 수 있는 취약점입니다.',
    walkthrough:
      '화물 수정 요청의 대상을 선장 소유의 황금 해골로 바꿉니다. 서버가 요청자의 역할과 화물 소유자를 다시 확인하지 않으면 제한된 화물의 목적지가 변경됩니다.',
    cause: '화면에서만 권한을 제한하고 서버가 수정 대상의 소유자와 역할을 검증하지 않음',
    defense: '서버에서 요청마다 사용자 권한·자원 소유권·허용된 변경 범위를 검증함',
  },
  6: {
    title: 'JWT 권한 변조',
    headline: '토큰 내용과 서명 검증의 경계',
    concept:
      'JWT는 Header, Payload, Signature로 구성됩니다. Payload는 누구나 읽거나 수정할 수 있으므로 서버가 서명을 검증해야 변조를 발견할 수 있습니다.',
    walkthrough:
      'JWT의 Payload에 담긴 권한 정보를 관리자 권한으로 변경합니다. 서버가 Signature를 검증하지 않으면 변조된 토큰으로 관리자 기능에 접근할 수 있습니다.',
    cause: 'JWT를 단순히 decode()하고 서명을 검증하지 않음',
    defense: '반드시 verify()로 서명을 검증하고 서버에서 권한을 재확인함',
  },
  7: {
    title: 'Context-level Prompt Injection',
    headline: '사용자 작성 문서와 공식 승인 기록의 경계',
    concept:
      'Context-level Prompt Injection은 AI가 참고하는 문서의 수정 가능한 영역에 조작된 내용을 넣어 모델의 판단을 왜곡하는 공격입니다.',
    walkthrough:
      '출항 신고서의 비고란에 관리자 승인과 검증이 완료된 기록처럼 보이는 내용을 삽입합니다. AI가 이를 신뢰하면 가짜 신고서를 정식 신고서로 오인하여 출항을 승인합니다.',
    cause: '사용자가 작성한 비고란을 신뢰할 수 있는 승인 기록처럼 처리함',
    defense: '사용자 입력과 공식 기록을 분리하고, 실제 승인 여부는 서버에서 검증함',
  },
};

// 1~7번 문제는 고정 에셋 사용, 그 외는 default
const FIXED_PROBLEM_IDS = new Set([1, 2, 3, 4, 5, 6, 7]);

function getBgImage(problem: Problem): string {
  if (FIXED_PROBLEM_IDS.has(problem.id)) {
    return `/assets/backgrounds/island-${problem.id}.webp`;
  }
  return `/assets/backgrounds/default-island.webp`;
}

function getHintIcon(problem: Problem): string {
  if (FIXED_PROBLEM_IDS.has(problem.id)) {
    return `/assets/icons/hint-${problem.id}.png`;
  }
  return `/assets/icons/default-hint.png`;
}

// 운영은 challenge-N.<host> HTTPS, 로컬 데모는 현재 브라우저 호스트의 5001~5007
// 포트를 쓴다. 호스트를 비워 두면 localhost/LAN/Tailscale 이름을 자동으로 따라간다.
const CHALLENGE_HOST = process.env.NEXT_PUBLIC_CHALLENGE_HOST ?? '';
const CHALLENGE_ROUTING =
  process.env.NEXT_PUBLIC_CHALLENGE_ROUTING ?? 'subdomain';
const CHALLENGE_SCHEME =
  process.env.NEXT_PUBLIC_CHALLENGE_SCHEME ?? 'https';

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

  const challengeNumber = Number(port) - 5000;
  const hasHttpsProxy = Number.isInteger(challengeNumber)
    && challengeNumber >= 1
    && challengeNumber <= 7;
  const runtimeHost =
    CHALLENGE_HOST ||
    (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const usePortRouting = CHALLENGE_ROUTING === 'ports';
  const origin = usePortRouting
    ? `${CHALLENGE_SCHEME}://${runtimeHost}:${port}`
    : hasHttpsProxy
      ? `https://challenge-${challengeNumber}.${runtimeHost}`
      : `http://${runtimeHost}:${port}`;
  const entry = new URL('/set-uid', origin);
  // uid 가 없으면 파라미터를 붙이지 않는다. 프록시가 "uid 없음" 경고를 남긴다.
  if (userId) entry.searchParams.set('uid', userId);

  return { display: origin, href: entry.toString() };
}

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const [flagInput, setFlagInput] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [conceptOpen, setConceptOpen] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{
    type: 'status' | 'error' | 'success';
    message: string;
  } | null>(null);

  const auth: any = useAuth();
  const user = auth?.user;
  const refreshUser = auth?.refreshUser;

  const [aiHint, setAiHint] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  // 마지막으로 받은 힌트가 오류 안내인지 실제 힌트인지 구분한다.
  // 실제 힌트면 다시 요청하지 않고 그대로 다시 보여준다(중복 차감 방지).
  const [aiHintIsError, setAiHintIsError] = useState(false);
  // 로딩이 멈춘 것처럼 보이지 않도록 경과 시간을 초 단위로 보여준다.
  const [hintElapsed, setHintElapsed] = useState(0);
  const router = useRouter();

  // 힌트 생성 중에는 경과 초를 1초마다 갱신한다.
  useEffect(() => {
    if (!isAiLoading) return;
    setHintElapsed(0);
    const started = Date.now();
    const id = window.setInterval(() => {
      setHintElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [isAiLoading]);

  const saveUserLog = useCallback(async (type: 'VISIT' | 'SUBMIT' | 'HINT', data: any = {}) => {
    try {
      const currentUserId = user?.userId;

      if (!id || !currentUserId) return;

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

      await fetch(`${API_BASE_URL}/api/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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

    const normalizedFlag = flagInput.trim();
    if (!normalizedFlag) {
      setSubmitFeedback({ type: 'error', message: 'flag를 입력해 주세요.' });
      return;
    }

    // 이미 푼 문제는 서버가 제출을 받지 않는다. 요청을 보내기 전에 끊는다.
    if (problem.solved) {
      alert('이미 해결한 문제입니다. ✅');
      return;
    }

    saveUserLog('SUBMIT', { input: normalizedFlag });

    setSubmitting(true);
    setSubmitFeedback({ type: 'status', message: 'flag를 확인하고 있습니다...' });
    try {
      const result = await submitFlag(problem.id, normalizedFlag);
      if (result.alreadySolved) {
        // 다른 탭에서 먼저 풀었거나 화면 상태가 오래된 경우.
        // 레벨업 화면을 다시 띄우면 안 된다.
        setProblem((prev) => (prev ? { ...prev, solved: true } : prev));
        setSubmitFeedback({ type: 'success', message: '이미 해결한 문제입니다. ✅' });
      } else if (result.correct) {
        setSubmitFeedback({ type: 'success', message: '정답입니다! ✅' });
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
        setSubmitFeedback({
          type: 'error',
          message: '틀렸습니다. 다시 생각해보세요! ❌',
        });
      }
    } catch (err) {
      console.error('flag 제출 실패:', err);
      setSubmitFeedback({
        type: 'error',
        message: 'flag를 제출하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 3. AI 힌트
  const handleHintClick = async () => {
    if (!problem) return;

    // 항상 모달은 연다.
    setHintOpen(true);

    // 이미 요청이 진행 중이면 모달만 다시 열고 새로 요청하지 않는다.
    // (느려서 닫았다가 다시 눌러도 중복 요청/차감이 없다.)
    if (isAiLoading) return;

    // 이미 받아 둔 정상 힌트가 있으면 다시 요청하지 않고 그대로 보여준다.
    // 힌트를 받고도 모달을 닫아 놓쳤던 사용자가, 다시 열면 차감 없이 그 힌트를 본다.
    if (aiHint && !aiHintIsError) return;

    setIsAiLoading(true);
    setAiHint(null);
    setAiHintIsError(false);

    saveUserLog('HINT', { input: flagInput });

    const controller = new AbortController();
    // 힌트 생성 실측이 12~36초이고 503 재시도가 붙으면 더 늘어난다.
    // 45초는 그 범위와 겹쳐 브라우저가 먼저 끊는 최약 링크였다(백엔드는 90초).
    const timeout = window.setTimeout(() => controller.abort(), 100000);
    try {
      const res = await fetch(`${API_BASE_URL}/ai-tutor/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ problemId: problem.id }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`AI tutor returned ${res.status}`);
      const result = await res.json();
      const hint = typeof result === 'string' ? result : result.hint;
      if (!hint || typeof hint !== 'string') {
        throw new Error('AI tutor returned an empty hint');
      }
      setAiHint(hint);
      setAiHintIsError(false);
    } catch (err) {
      console.error("힌트 에러:", err);
      setAiHintIsError(true);
      setAiHint(
        err instanceof DOMException && err.name === 'AbortError'
          ? 'AI 튜터 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.'
          : 'AI 힌트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      window.clearTimeout(timeout);
      setIsAiLoading(false);
    }
  };

  if (loading) return <main className={styles.pageRoot}><div className={styles.statusText}>Loading...</div></main>;
  if (!problem) return <main className={styles.pageRoot}><div className={styles.statusText}>No Problem.</div></main>;

  const concept = CONCEPT_EXPLANATIONS[problem.id];

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
            {concept && (
              <div className={styles.conceptButtonRow}>
                <button
                  type="button"
                  className={`pixel-btn pixel-btn--sm ${styles.conceptButton}`}
                  onClick={() => setConceptOpen(true)}
                  aria-label="보안 개념 설명 열기"
                >
                  보안 개념 설명
                </button>
              </div>
            )}
            <form className={styles.formRow} onSubmit={onSubmit}>
              <input
                className={styles.input}
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
                onInput={() => setSubmitFeedback(null)}
                placeholder={problem.solved ? '이미 해결한 문제입니다' : 'hackahoy{...}'}
                disabled={submitting || Boolean(problem.solved)}
                aria-label="flag 입력"
                aria-describedby="flag-feedback"
              />
              <button
                type="submit"
                className={`pixel-btn ${styles.flagBtn}`}
                disabled={submitting || Boolean(problem.solved)}
                aria-label="flag 제출"
              >
                FLAG
              </button>
            </form>
            <p
              id="flag-feedback"
              className={`${styles.submitFeedback} ${
                submitFeedback?.type === 'error' ? styles.submitError : ''
              }`}
              role={submitFeedback?.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
            >
              {submitFeedback?.message ?? ''}
            </p>
          </div>

          {/* 힌트 아이콘: 1~7번은 고정 에셋, 그 외는 default */}
          <button
            type="button"
            className={styles.hintBtn}
            onClick={handleHintClick}
            aria-label="AI 튜터 힌트 열기"
          >
            <Image src={getHintIcon(problem)} alt="" width={260} height={320} />
          </button>
        </div>
      </section>

      {hintOpen && (
        <div className={styles.modalDim} onClick={() => setHintOpen(false)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-hint-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div id="ai-hint-title" className={styles.modalTitle}>🤖 AI TUTOR HINT</div>
              <button type="button" aria-label="힌트 닫기" className={styles.modalClose} onClick={() => setHintOpen(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                {isAiLoading
                  ? `AI가 힌트를 분석하고 있어요. 최대 1분 정도 걸릴 수 있어요. (${hintElapsed}초 경과)`
                  : (aiHint || problem.hint || "힌트가 없습니다.")}
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className="pixel-btn pixel-btn--sm" onClick={() => setHintOpen(false)}>확인</button>
            </div>
          </div>
        </div>
      )}

      {conceptOpen && concept && (
        <div className={styles.modalDim} onClick={() => setConceptOpen(false)}>
          <div
            className={`${styles.modal} ${styles.conceptModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="concept-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`${styles.modalHeader} ${styles.conceptHeader}`}>
              <div>
                <div className={styles.conceptEyebrow}>문제 {problem.id} · {concept.title}</div>
                <h1 id="concept-title" className={styles.conceptHeadline}>{concept.headline}</h1>
              </div>
              <button
                type="button"
                aria-label="보안 개념 설명 닫기"
                className={styles.modalClose}
                onClick={() => setConceptOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.conceptBody}>
              <section className={styles.conceptSummary} aria-labelledby="concept-summary-title">
                <h2 id="concept-summary-title">핵심 개념</h2>
                <p>{concept.concept}</p>
              </section>

              <section className={styles.conceptDetails} aria-labelledby="concept-details-title">
                <h2 id="concept-details-title">풀이와 대응</h2>
                <p className={styles.conceptWalkthrough}>{concept.walkthrough}</p>
                <ul>
                  <li><strong>원인</strong><span>{concept.cause}</span></li>
                  <li><strong>방어</strong><span>{concept.defense}</span></li>
                </ul>
              </section>

              <p className={styles.conceptNotice}>
                개념 설명에는 정답, FLAG, 완성된 공격 문자열이 포함되지 않습니다.
              </p>
            </div>
            <div className={`${styles.modalFooter} ${styles.conceptFooter}`}>
              <button type="button" className="pixel-btn" onClick={() => setConceptOpen(false)}>문제로 돌아가기</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
