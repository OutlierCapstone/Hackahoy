'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react'; // useEffect, useState 추가
import styles from './levelUp.module.css';
import { API_BASE_URL } from "@/lib/api/config";

function LevelUpContent() {
  const router = useRouter();
  const params = useSearchParams();
  
  // 💡 추천된 문제 ID를 저장할 상태
  const [recommendedId, setRecommendedId] = useState<number | null>(null);

  const prevShip = params.get('prevShip');
  const newShip = params.get('newShip');
  const isLevelUp = params.get('isLevelUp') === 'true';
  const redirect = params.get('redirect') ?? '/';

  // 🔥 [추가] 페이지 로드 시 백엔드에 AI 추천 문제 요청
  useEffect(() => {
    if (!newShip) return;

    const fetchRecommendation = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ai-tutor/recommend`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        const data = await res.json();
        
        // 백엔드에서 { recommended_problem_id: 3 } 형태로 주기로 했으므로
        if (data.recommended_problem_id) {
          setRecommendedId(data.recommended_problem_id);
        }
      } catch (err) {
        console.error("추천 로드 실패:", err);
      }
    };

    fetchRecommendation();
  }, [newShip]);

  // 쿼리 없이 직접 들어온 경우 렌더 도중 Router 상태를 바꾸면 React 경고가 발생한다.
  // 화면을 한 번 그린 뒤 안전하게 원래 경로로 돌려보낸다.
  useEffect(() => {
    if (!newShip) router.replace(redirect);
  }, [newShip, redirect, router]);

  if (!newShip) {
    return null;
  }

  // 🔥 [추가] 추천 문제 페이지로 이동하는 핸들러
  const handleRecommendClick = () => {
    if (recommendedId) {
      // url 형식: http://localhost:3000/challenge/3
      router.push(`/challenge/${recommendedId}`);
    } else {
      alert("추천할 다음 문제가 없거나 로딩 중입니다!");
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1 className={styles.title}>CHALLENGE CLEAR</h1>

        <div className={styles.subtitle}>
          {isLevelUp ? 'Level Up!' : 'Great Job!'}
        </div>

        <div className={styles.ships}>
          {isLevelUp && prevShip ? (
            <>
              <div className={styles.shipWrapper}>
                <Image src={prevShip} alt="Previous ship" width={220} height={160} />
              </div>
              <div className={styles.arrow} aria-hidden>→</div>
              <div className={styles.shipWrapper}>
                <Image src={newShip} alt="New ship" width={220} height={160} />
              </div>
            </>
          ) : (
            <div className={styles.shipWrapper}>
              <Image src={newShip} alt="Current ship" width={280} height={200} priority />
            </div>
          )}
        </div>

        {/* 추천 문제는 이 화면의 핵심 다음 행동이다. 베타에서 구석의 얇은 PNG 라
            아무도 못 봤다는 피드백이 있어, 화면 중앙에 큰 1순위 버튼으로 올린다. */}
        <div className={styles.buttonArea}>
          <div className={styles.recommendBlock}>
            <p className={styles.recommendHint}>
              🧭 당신의 풀이 이력을 분석해 다음에 풀기 좋은 문제를 추천해드려요
            </p>
            <button
              type="button"
              className={`pixel-btn pixel-btn--block ${styles.recommendCta}`}
              onClick={handleRecommendClick}
              disabled={!recommendedId}
            >
              {recommendedId
                ? '다음 추천 문제 풀러 가기 →'
                : '추천 문제 불러오는 중...'}
            </button>
          </div>

          <button
            type="button"
            className="pixel-btn pixel-btn--secondary"
            onClick={() => router.push(redirect)}
          >
            메인으로 돌아가기
          </button>
        </div>
      </section>
    </main>
  );
}

export default function LevelUpPage() {
  return (
    <Suspense fallback={<div className={styles.page}>Loading...</div>}>
      <LevelUpContent />
    </Suspense>
  );
}
