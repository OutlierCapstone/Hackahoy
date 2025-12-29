"use client";

import { Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./levelUp.module.css";

// 1. 실제 로직이 수행되는 내부 컴포넌트
function LevelUpContent() {
  const router = useRouter();
  const params = useSearchParams();

  const prevShip = params.get("prevShip");
  const newShip = params.get("newShip");
  const redirect = params.get("redirect") ?? "/";

  // 데이터가 없을 경우 리다이렉트 처리
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
          <div className={styles.arrow} aria-hidden>
            →
          </div>
          <Image src={newShip} alt="New ship" width={220} height={160} />
        </div>

        <button
          type="button"
          className={styles.imgBtn}
          onClick={() => router.push(redirect)}
          aria-label="Continue"
        >
          <Image
            src="/assets/ui/continue.png"
            alt="Continue"
            width={220}
            height={70}
            priority
          />
        </button>
      </section>
    </main>
  );
}

// 2. Export 되는 메인 컴포넌트 (Suspense 보호막 추가)
export default function LevelUpPage() {
  return (
    // 빌드 시 useSearchParams 에러를 방지하기 위해 Suspense로 감쌉니다.
    <Suspense
      fallback={
        <div
          style={{
            backgroundColor: "#0b1723",
            height: "100vh",
            color: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p>Loading level up data...</p>
        </div>
      }
    >
      <LevelUpContent />
    </Suspense>
  );
}
