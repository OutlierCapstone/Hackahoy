"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./challenge.module.css";
import { getProblem, submitFlag } from "@/lib/api/islands";
import { useAuth } from "@/components/common/AuthContext";

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
        if (data && data.data) data = data.data;
        if (Array.isArray(data)) data = data[0];

        if (data && (data.title || data.id)) {
          setProblem(data);
        } else {
          setProblem(null);
        }
      } catch (error) {
        console.error('❌ 문제 로드 실패:', error);
        setProblem(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProblem();
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem || submitting) return;

    setSubmitting(true);
    try {
      const result = await submitFlag(problem.id, flagInput.trim());

      if (result.correct) {
        if (result.alreadySolved) {
          alert("이미 해결한 문제입니다! ✅");
          setSubmitting(false);
          return;
        }

        const prevLevel = user?.levelNum ?? 1;
        const newLevel = result.newLevel;
        await refreshUser();

        if (newLevel > prevLevel) {
          const prevShip = encodeURIComponent(`/assets/ships/ship-${prevLevel}.png`);
          const newShip = encodeURIComponent(`/assets/ships/ship-${newLevel}.png`);
          const redirect = encodeURIComponent(`/`);
          router.push(`/level-up?prevShip=${prevShip}&newShip=${newShip}&redirect=${redirect}`);
        } else {
          alert("정답입니다! 🎉");
          setFlagInput("");
        }
      } else {
        alert("틀렸습니다. 다시 생각해보세요! ❌");
      }
    } catch (err) {
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

const getBackgroundImage = (islandId: number) => {
  // islandId === 1 조건을 제거하여 모든 구역의 1~6번 문제가 전용 배경을 갖도록 합니다.
  if (problem && problem.id >= 1 && problem.id <= 6) {
    return `/assets/backgrounds/island-${problem.id}.png`;
  }
  
  // 특정 구역(1, 2번 핑)에 따른 기본 배경 설정
  if (islandId === 1 || islandId === 2) {
    return `/assets/backgrounds/island-map.png`; 
  }

  return "/assets/backgrounds/default-island.png";
};

  // 2. 힌트 아이콘 로직 (6번까지 확장)
const getHintImage = (problemId: number, islandId: number) => {
  // islandId 조건 없이 problemId가 1~6 사이이면 해당 이미지를 가져오도록 수정
  if ([1, 2, 3, 4, 5, 6].includes(problemId)) {
    return `/assets/icons/hint-${problemId}.png`;
  }
  return "/assets/icons/default-hint.png";
};

  if (loading) {
    return <main className={styles.pageRoot}><div className={styles.statusText}>문제를 불러오는 중...</div></main>;
  }

  if (!problem || !problem.title) {
    return <main className={styles.pageRoot}><div className={styles.statusText}>문제가 아직 생성되지 않았습니다.</div></main>;
  }

  const bg = getBackgroundImage(problem.islandId);
  const hintIcon = getHintImage(problem.id, problem.islandId);

  const DEFAULT_HINT_TEXT = "힌트는 기본값입니다.";
  const isDefaultHint = !problem.hint || problem.hint.trim() === "" || problem.hint === DEFAULT_HINT_TEXT;

  const hintData: HintData | null = !isDefaultHint ? { img: hintIcon, text: problem.hint! } : null;

  return (
    <main className={styles.pageRoot}>
      <div className={styles.bg} style={{ backgroundImage: `url(${bg})` }} />

      <section className={styles.stage}>
        <div className={styles.boardWrap}>
          <div className={styles.board}>
            <h1 className={styles.title}>{problem.title}</h1>
            <p className={styles.desc}>{problem.description}</p>

            {/* 3. 서버 링크 출력 로직 (6번까지 확장 및 정리) */}
            {problem.serverLink && (
              <p className={styles.link}>
                Server link: &nbsp;
                <a href={problem.serverLink} target="_blank" rel="noopener noreferrer">
                  {(() => {
                    if (problem.id >= 1 && problem.id <= 6) {
                      return `http://52.78.240.6:800${problem.id}`;
                    }
                    return problem.serverLink; 
                  })()}
                </a>
              </p>
            )}

            <form className={styles.formRow} onSubmit={onSubmit}>
              <input
                className={styles.input}
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
                placeholder="flag{enter_your_flag}"
                disabled={submitting}
              />
              <button type="submit" className={styles.flagBtn} disabled={submitting}>
                <Image src="/assets/ui/flag.png" alt="flag" width={94} height={70} />
              </button>
            </form>
            {submitting && <p style={{ color: "yellow", marginTop: "10px" }}>제출 중...</p>}
          </div>

          {hintData ? (
            <button
              type="button"
              className={styles.hintBtn}
              onClick={async () => {
                try {
                  const token = localStorage.getItem('accessToken'); 
                  await fetch(`http://localhost:4000/problem/${problem.id}/hint`, {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  });
                } catch (error) {
                  console.error('❌ 힌트 로그 저장 실패:', error);
                }
                setHintOpen(true);
              }}           
              aria-label="open hint"
            >
              <Image src={hintData.img} alt="hint" width={260} height={320} />
            </button>
          ) : (
            <div 
              className={styles.hintBtn} 
              style={{ 
                cursor: 'default', 
                opacity: 0.5, 
                filter: 'grayscale(1)',
                pointerEvents: 'none' 
              }}
            >
              <Image src={hintIcon} alt="no-hint" width={260} height={320} />
            </div>
          )}
        </div>
      </section>

      {hintOpen && hintData && (
        <div className={styles.modalDim} onClick={() => setHintOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>HINT</div>
              <button className={styles.modalClose} onClick={() => setHintOpen(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>{hintData.text}</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.okBtn} onClick={() => setHintOpen(false)}>
                <span className={styles.okBtnText}>ok</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}