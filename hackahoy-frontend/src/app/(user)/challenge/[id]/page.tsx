// src/app/(user)/challenge/[id]/page.tsx
"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./challenge.module.css";
import { getProblem, submitFlag } from "@/lib/api/islands";
import { useAuth } from "@/components/common/AuthContext";
import { useRouter } from "next/navigation";

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
  const [flagInput, setFlagInput] = useState("");
  const [hintOpen, setHintOpen] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    async function fetchProblem() {
      try {
        const problemId = Number(id);
        const response = await getProblem(problemId);

        let data = response;
        if (data && data.data) data = data.data; // nestjs/axios 구조 대응
        if (Array.isArray(data)) data = data[0]; // 배열 대응

        if (data && (data.title || data.id)) {
          setProblem(data);
        } else {
          console.error("❌ 데이터를 가져왔으나 구조가 올바르지 않습니다.");
          setProblem(null);
        }
      } catch (error) {
        console.error("❌ 문제 로드 중 서버 에러:", error);
        setProblem(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProblem();
  }, [id]);

  //플래그 제출
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem) return;
    if (submitting) return;

    setSubmitting(true);
    try {
      const result = await submitFlag(problem.id, flagInput.trim());

      if (result.correct) {
        if (result.alreadySolved) {
          alert("이미 해결한 문제입니다! ✅");
          setSubmitting(false);
          return;
        }

        // 레벨업 판단을 위해 현재 유저 레벨 저장
        const prevLevel = user?.levelNum ?? 1;
        const newLevel = result.newLevel;

        // 최신 정보로 유저 상태 갱신 (상단바 등을 위해)
        await refreshUser();

        // 레벨이 올랐다면 레벨업 페이지로 이동
        if (newLevel > prevLevel) {
          const prevShip = encodeURIComponent(
            `/assets/ships/ship-${prevLevel}.png`
          );
          const newShip = encodeURIComponent(
            `/assets/ships/ship-${newLevel}.png`
          );
          const redirect = encodeURIComponent(`/`); // 컨티뉴 버튼 누르면 홈으로

          router.push(
            `/level-up?prevShip=${prevShip}&newShip=${newShip}&redirect=${redirect}`
          );
        } else {
          // 레벨업은 아니지만 정답인 경우
          alert("정답입니다! 🎉");
          setFlagInput("");
        }
      } else {
        alert("틀렸습니다. 다시 생각해보세요! ❌");
      }
    } catch (err) {
      console.error("제출 에러:", err);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 로딩 중
  if (loading) {
    return (
      <main className={styles.pageRoot}>
        <div className={styles.statusText}>🎯 문제를 불러오는 중...</div>
      </main>
    );
  }

  // 데이터 없음
  if (!problem || !problem.title) {
    return (
      <main className={styles.pageRoot}>
        <div className={styles.statusText}>
          ❌ 문제가 아직 생성되지 않았습니다.
        </div>
      </main>
    );
  }

  const getBackgroundImage = (islandId: number) => {
    // Pin 1 (Island 1)에 속한 경우 고유 배경 사용
    if (islandId === 1) {
      // 문제 id나 다른 규칙이 있다면 추가 분기 가능
      // 여기서는 예시로 문제 ID가 1, 2, 3인 경우 각각 island-1, 2, 3 매칭
      if (problem.id <= 3) {
        return `/assets/backgrounds/island-${problem.id}.png`;
      }
      // Island 1의 다른 문제라면 기본 island-1 사용
      return `/assets/backgrounds/island-1.png`;
    }

    // Pin 2, 3 등 새로 생성된 섬은 무조건 디폴트 배경
    return "/assets/backgrounds/default-island.png";
  };

  const bg = getBackgroundImage(problem.islandId);

  // 2. 힌트 및 기타 설정
  const getHintImage = (problemId: number, islandId: number) => {
    if (islandId === 1) {
      if (problemId === 1 || problemId === 2 || problemId === 3) {
        return `/assets/icons/hint-${problemId}.png`;
      }
    }
    return "/assets/icons/default-hint.png";
  };

  // 2. 힌트 및 기타 설정 (return 문 직전 부분 수정)
  const hintIcon = getHintImage(problem.id, problem.islandId);

  const hintData: HintData | null = problem.hint
    ? { img: hintIcon, text: problem.hint }
    : null;

  return (
    <main className={styles.pageRoot}>
      <div className={styles.bg} style={{ backgroundImage: `url(${bg})` }} />

      <section className={styles.stage}>
        <div className={styles.boardWrap}>
          <div className={styles.board}>
            <h1 className={styles.title}>{problem.title}</h1>
            <p className={styles.desc}>{problem.description}</p>

            {problem.serverLink && (
              <p className={styles.link}>
                Server link:&nbsp;
                <a href={problem.serverLink} target="_blank" rel="noreferrer">
                  {problem.serverLink}
                </a>
              </p>
            )}

            <form className={styles.formRow} onSubmit={onSubmit}>
              <input
                className={styles.input}
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
                placeholder="hackahoy{enter_your_flag}"
                disabled={submitting}
              />
              <button
                type="submit"
                className={styles.flagBtn}
                disabled={submitting}
              >
                <Image
                  src="/assets/ui/flag.png"
                  alt="flag"
                  width={94}
                  height={50}
                />
              </button>
            </form>

            {submitting && (
              <p style={{ color: "yellow", marginTop: "10px" }}>제출 중...</p>
            )}
          </div>

          {/* 힌트 버튼 영역 수정 */}
          {hintData && (
            <div
              className={styles.hintBtn}
              // 1. 클릭 이벤트 추가: 문제 ID가 1, 2, 3일 때만 모달을 엶
              onClick={() => {
                if (problem.id <= 3) {
                  setHintOpen(true);
                }
                // 그 외(새로 만든 문제)는 클릭해도 아무 반응 없음
              }}
              // 2. 스타일 수정: 1, 2, 3번 문제는 손가락 모양(pointer), 나머지는 기본 화살표(default)
              style={{ cursor: problem.id <= 3 ? "pointer" : "default" }}
            >
              {/* 이미지는 로직에 따라 ID 1,2,3은 전용 아이콘, 나머지는 디폴트 이미지가 나옴 */}
              <Image src={hintData.img} alt="hint" width={280} height={320} />
            </div>
          )}
        </div>
      </section>

      {hintOpen && hintData && (
        <div className={styles.modalDim} onClick={() => setHintOpen(false)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>HINT</div>
              <button
                className={styles.modalClose}
                onClick={() => setHintOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalText}>{hintData.text}</p>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.okBtn}
                onClick={() => setHintOpen(false)}
              >
                <Image
                  src="/assets/ui/ok.png"
                  alt="ok"
                  width={88}
                  height={46}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
