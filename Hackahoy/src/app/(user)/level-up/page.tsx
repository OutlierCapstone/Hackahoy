'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react'; // useEffect, useState 추가
import styles from './levelUp.module.css';

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
    const fetchRecommendation = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`http://localhost:4000/ai-tutor/recommend`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
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
  }, []);

  if (!newShip) {
    if (typeof window !== 'undefined') {
      router.replace(redirect);
    }
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

        <div className={styles.buttonArea}>
          <button
            type="button"
            className={styles.imgBtn}
            onClick={() => router.push(redirect)}
          >
            <Image src="/assets/ui/continue.png" alt="Continue" width={220} height={70} priority />
          </button>

          {/* 🔥 추천 버튼 수정: 데이터가 있을 때만 활성화하거나 핸들러 연결 */}
          <button
            type="button"
            className={`${styles.recommendBtn} ${!recommendedId ? styles.disabled : ''}`}
            onClick={handleRecommendClick}
            disabled={!recommendedId} // 데이터 없으면 클릭 방지
          >
            <Image
              src="/assets/ui/startrecommand.png"
              alt="Start Recommended Challenges"
              width={220}
              height={30}
            />
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