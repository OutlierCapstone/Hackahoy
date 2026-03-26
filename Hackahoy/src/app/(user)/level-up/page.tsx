'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './levelUp.module.css';

// ... (기존 import 생략)

export default function LevelUpPage() {
  const router = useRouter();
  const params = useSearchParams();

  const prevShip = params.get('prevShip');
  const newShip = params.get('newShip');
  const redirect = params.get('redirect') ?? '/';

  if (!prevShip || !newShip) {
    router.replace(redirect);
    return null;
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1 className={styles.title}>CHALLENGE CLEAR</h1>
        <div className={styles.subtitle}>Level Up</div>

        <div className={styles.ships}>
          <Image src={prevShip} alt="Previous ship" width={220} height={160} />
          <div className={styles.arrow} aria-hidden> → </div>
          <Image src={newShip} alt="New ship" width={220} height={160} />
        </div>

        <div className={styles.buttonArea}>
          <button
            type="button"
            className={styles.imgBtn}
            onClick={() => router.push(redirect)}
          >
            <Image src="/assets/ui/continue.png" alt="Continue" width={220} height={70} priority />
          </button>

          {/* ✨ 추천 버튼 클릭 시 백엔드 연동 로직 추가 */}
          <button
            type="button"
            className={styles.recommendBtn}
            onClick={async () => {
              try {
                const token = localStorage.getItem('accessToken');
                // 백엔드에 추천용 데이터 추출(콘솔 출력) 요청
                await fetch(`http://localhost:4000/ai-tutor/recommend-context`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  }
                });
                
                // 데이터 확인용 알림 (선택 사항)
                console.log("✅ 추천 데이터 로그 생성 완료");
                
                // 로그 찍힌 거 확인 후 추천 페이지로 이동
                router.push('/recommend');
              } catch (err) {
                console.error("추천 데이터 요청 실패:", err);
                // 실패해도 페이지 이동은 시켜줍니다.
                router.push('/recommend');
              }
            }}
          >
            <Image
              src="/assets/ui/startrecommand.png"
              alt="Start Recommended Challenges"
              width={220}
              height={25}
            />
          </button>
        </div>
      </section>
    </main>
  );
}