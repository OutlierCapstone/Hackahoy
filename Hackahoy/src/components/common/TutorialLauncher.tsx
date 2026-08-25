"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./TutorialLauncher.module.css";

/**
 * 첫 방문 사용법 안내(튜토리얼).
 *
 * 왜 필요한가
 *   베타에서 참가자들이 문제 추천/힌트/추천 같은 핵심 기능을 몰라 완주에 실패했다.
 *   Notion 사용법 문서를 6단계 캐러셀로 요약해, 처음 들어온 사용자에게 1회 자동으로
 *   보여준다. 이후에는 우측 하단 물음표(?) 버튼으로 언제든 다시 열 수 있다.
 *
 * 저장
 *   게스트도 대상이라 서버 프로필이 없으므로, "봤음" 여부는 브라우저 localStorage 에
 *   기록한다. 키를 v1 로 두어 나중에 내용이 크게 바뀌면 v2 로 올려 다시 노출할 수 있다.
 */
// 영구 종료: 튜토리얼을 끝까지 보거나("시작하기") "다시 보지 않기"를 누르면 저장.
// 이후로는 자동으로 열리지 않는다(? 버튼으로는 언제든 다시 열 수 있음).
const DISMISS_KEY = "hackahoy_tutorial_dismissed";
// 이번 세션에서만 닫기: X·Esc·배경 클릭으로 닫으면 저장. 같은 세션에선 다시 자동으로
// 열리지 않지만, 브라우저를 새로 열면(새 세션) 완주/영구종료 전까지 다시 안내한다.
const SESSION_KEY = "hackahoy_tutorial_closed";

type Step = {
  emoji: string;
  title: string;
  body: string[];
};

const STEPS: Step[] = [
  {
    emoji: "🏴‍☠️",
    title: "Ahoy! Hackahoy에 오신 걸 환영해요",
    body: [
      "Hackahoy는 보안 취약점을 직접 찾아 Flag를 획득하며 해킹·보안을 게임처럼 배우는 워게임 플랫폼이에요.",
      "지금은 AI와 Web 분야의 문제를 다루고 있어요. 막히면 AI 튜터의 단계별 힌트를 활용해 스스로 답을 찾아갈 수 있어요.",
      "⚠️ 문제 풀이는 반드시 제공된 워게임 환경 안에서만 진행해 주세요. Hackahoy 메인 서버를 대상으로 한 공격·취약점 테스트는 금지되어 있어요.",
      "💻 PC·노트북 화면에 최적화되어 있어요. 모바일에서도 가능하지만 PC 사용을 권장해요.",
    ],
  },
  {
    emoji: "🔑",
    title: "시작하기",
    body: [
      "화면 우측 상단의 ‘LOGIN’ 버튼으로 로그인할 수 있어요.",
      "시범 운영 기간에는 로그인 창 맨 아래의 ‘비회원으로 시작하기’를 이용해 주세요. 별도 정보 입력 없이 바로 시작할 수 있어요.",
    ],
  },
  {
    emoji: "🚢",
    title: "메인 화면 — 배를 키워요",
    body: [
      "화면 중앙의 배는 문제를 풀수록 성장해요. 뗏목 → 보트 → 돛단배… 2ⁿ개(1, 2, 4, 8…)의 문제를 해결할 때마다 배가 업그레이드돼요.",
      "지도의 마커 아이콘을 클릭하면 해당 지역의 섬들을 볼 수 있어요. (현재 두 개의 마커를 지원해요.)",
      "각 지역에는 세 개의 섬이 있고, 섬을 클릭하면 문제로 이동해요.",
    ],
  },
  {
    emoji: "🧩",
    title: "문제 풀이 & AI 힌트",
    body: [
      "섬에 들어가면 문제의 제목·설명·서버 주소가 보여요. 서버 주소로 이동해 관련 보안 취약점을 찾고 hackahoy{…} 형태의 flag를 획득하세요.",
      "잘 안 풀리면 우측의 캐릭터 버튼을 눌러 힌트를 받을 수 있어요. 힌트는 당신의 접근 방법을 AI가 분석해 맞춤형으로 생성하며, 문제당 최대 5번까지 받을 수 있어요.",
      "찾은 flag를 아래 칸에 입력하고 ‘FLAG’ 버튼으로 제출하세요.",
    ],
  },
  {
    emoji: "🎉",
    title: "정답을 맞히면",
    body: [
      "축하 화면이 나타나요! 2ⁿ개를 해결할 때마다 배가 업그레이드돼요. (이미 푼 문제를 다시 제출해도 해결 수는 늘지 않아요.)",
      "이때 ‘다음 추천 문제 풀러 가기’ 버튼을 누르면, 당신의 풀이 이력을 기반으로 다음에 풀기 좋은 유형·난이도의 문제로 바로 이동해요.",
      "‘메인으로 돌아가기’를 누르면 지도로 돌아가요.",
    ],
  },
  {
    emoji: "💬",
    title: "문의 & 피드백",
    body: [
      "이용 중 에러나 불편한 점이 있으면 Discord로 제보해 주세요. 궁금한 점, ‘힌트를 다 썼는데도 모르겠어요’ 같은 문의, 피드백 모두 환영이에요.",
      "공개 피드백: Hackahoy Discord → 피드백 채널",
      "비공개 문의: Hackahoy Discord → 문의하기 채널 → ‘문의하기’ 버튼 → 생성된 비공개 채널(ticket-xxxx)에서 작성",
      "여러분의 한마디가 서비스 운영과 개선에 큰 도움이 돼요. 이제 항해를 시작해 보세요! ⚓",
    ],
  },
];

export default function TutorialLauncher({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // 첫 방문 자동 노출: 로그인(게스트 포함)이 준비되고, 아직 본 적 없으면 연다.
  useEffect(() => {
    if (!enabled) return;
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
      const closedThisSession = sessionStorage.getItem(SESSION_KEY) === "1";
      if (!dismissed && !closedThisSession) {
        setStep(0);
        setOpen(true);
      }
    } catch {
      // localStorage 접근 불가(시크릿 모드 등)면 조용히 넘어간다.
    }
  }, [enabled]);

  // X·Esc·배경 클릭 — 이번 세션에서만 닫는다.
  const closeForNow = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* 무시 */
    }
    setOpen(false);
  }, []);

  // "시작하기"(완주) 또는 "다시 보지 않기" — 영구 종료.
  const dismissForever = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* 무시 */
    }
    setOpen(false);
  }, []);

  const openFromStart = useCallback(() => {
    setStep(0);
    setOpen(true);
  }, []);

  // 랜딩의 "게임 설명" 버튼 등 외부에서 열 수 있도록 커스텀 이벤트를 듣는다.
  useEffect(() => {
    const onOpen = () => openFromStart();
    window.addEventListener("hackahoy:open-tutorial", onOpen);
    return () => window.removeEventListener("hackahoy:open-tutorial", onOpen);
  }, [openFromStart]);

  // 키보드: Esc 닫기(이번 세션), ←/→ 로 단계 이동
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeForNow();
      else if (e.key === "ArrowRight") setStep((s) => Math.min(STEPS.length - 1, s + 1));
      else if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeForNow]);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <>
      {/* 언제든 다시 열 수 있는 도움말 버튼 */}
      <button
        type="button"
        className={styles.helpFab}
        onClick={openFromStart}
        aria-label="사용법 안내 열기"
        title="사용법 안내"
      >
        ?
      </button>

      {open && (
        <div className={styles.dim} onClick={closeForNow} role="presentation">
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <span className={styles.badge}>사용법 안내</span>
              <button
                type="button"
                className={styles.closeX}
                onClick={closeForNow}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className={styles.body}>
              <div className={styles.emoji} aria-hidden>
                {current.emoji}
              </div>
              <h2 id="tutorial-title" className={styles.title}>
                {current.title}
              </h2>
              <div className={styles.text}>
                {current.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            <div className={styles.dots} aria-hidden>
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`${styles.dot} ${i === step ? styles.dotActive : ""}`}
                />
              ))}
            </div>

            <div className={styles.footer}>
              <button
                type="button"
                className="pixel-btn pixel-btn--sm pixel-btn--secondary"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                이전
              </button>

              <span className={styles.progress}>
                {step + 1} / {STEPS.length}
              </span>

              {isLast ? (
                <button
                  type="button"
                  className="pixel-btn pixel-btn--sm"
                  onClick={dismissForever}
                >
                  시작하기 →
                </button>
              ) : (
                <button
                  type="button"
                  className="pixel-btn pixel-btn--sm"
                  onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                >
                  다음
                </button>
              )}
            </div>

            <button type="button" className={styles.skip} onClick={dismissForever}>
              건너뛰고 다시 보지 않기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
