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

  // 추천이 없을 때 백엔드가 주는 사유. 예전에는 이걸 버리고 버튼만 disabled 시켰는데,
  // .disabled 클래스가 CSS 에 없어서 버튼이 멀쩡해 보이는 채로 눌러도 아무 일도
  // 일어나지 않았다(disabled 라 onClick 도, 안의 alert 도 뜨지 않는다).
  // 보이는 문제를 전부 푼 참가자가 축하 화면에서 먹통 버튼을 보게 되는 경로다.
  const [recommendNote, setRecommendNote] = useState<string | null>(null);

  const prevShip = params.get('prevShip');
  const newShip = params.get('newShip');
  const isLevelUp = params.get('isLevelUp') === 'true';
  const redirect = params.get('redirect') ?? '/';

  // 🔥 [추가] 페이지 로드 시 백엔드에 AI 추천 문제 요청
  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE_URL}/ai-tutor/recommend`, {
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
        } else {
          setRecommendNote(data.message ?? '추천할 다음 문제가 없습니다.');
        }
      } catch (err) {
        console.error("추천 로드 실패:", err);
        setRecommendNote('추천을 불러오지 못했습니다.');
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
          {/* 추천이 없다는 답을 받은 경우에는 먹통 버튼 대신 사유를 보여 준다.
              아직 응답 전(둘 다 null)이면 기존대로 비활성 버튼을 그린다. */}
          {!recommendedId && recommendNote ? (
            <p className={styles.recommendNote}>{recommendNote}</p>
          ) : (
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
          )}
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