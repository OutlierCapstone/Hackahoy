'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import styles from './levelUp.module.css';

function LevelUpContent() {
  const router = useRouter();
  const params = useSearchParams();

  // 쿼리 파라미터에서 데이터 추출
  const prevShip = params.get('prevShip');
  const newShip = params.get('newShip');
  const isLevelUp = params.get('isLevelUp') === 'true'; // 레벨업 여부 확인
  const redirect = params.get('redirect') ?? '/';

  // 필수 데이터인 현재 배 이미지가 없으면 메인으로 리다이렉트
  if (!newShip) {
    if (typeof window !== 'undefined') {
      router.replace(redirect);
    }
    return null;
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1 className={styles.title}>CHALLENGE CLEAR</h1>

        {/* 레벨업 여부에 따라 서브타이틀 텍스트 변경 */}
        <div className={styles.subtitle}>
          {isLevelUp ? 'Level Up!' : 'Great Job!'}
        </div>

        <div className={styles.ships}>
          {isLevelUp && prevShip ? (
            // [A] 레벨업 시: 이전 배 -> 다음 배 (화살표 포함)
            <>
              <div className={styles.shipWrapper}>
                <Image
                  src={prevShip}
                  alt="Previous ship"
                  width={220}
                  height={160}
                />
              </div>
              <div className={styles.arrow} aria-hidden>
                →
              </div>
              <div className={styles.shipWrapper}>
                <Image src={newShip} alt="New ship" width={220} height={160} />
              </div>
            </>
          ) : (
            // [B] 단순 클리어 시: 현재 배만 중앙에 크게 표시
            <div className={styles.shipWrapper}>
              <Image
                src={newShip}
                alt="Current ship"
                width={280}
                height={200}
                priority
              />
            </div>
          )}
        </div>

        <div className={styles.buttonArea}>
          {/* CONTINUE 버튼 (중앙 정렬) */}
          <button
            type="button"
            className={styles.imgBtn}
            onClick={() => router.push(redirect)}
          >
            <Image
              src="/assets/ui/continue.png"
              alt="Continue"
              width={220}
              height={70}
              priority
            />
          </button>

          {/* 추천 챌린지 시작 버튼 (우측 하단 고정) */}
          <button
            type="button"
            className={styles.recommendBtn}
            onClick={() => router.push('/recommend')}
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

// useSearchParams를 사용하는 컴포넌트는 반드시 Suspense로 감싸야 합니다.
export default function LevelUpPage() {
  return (
    <Suspense fallback={<div className={styles.page}>Loading...</div>}>
      <LevelUpContent />
    </Suspense>
  );
}
