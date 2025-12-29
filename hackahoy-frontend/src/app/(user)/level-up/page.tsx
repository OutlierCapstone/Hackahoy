"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./levelUp.module.css";

export default function LevelUpPage() {
  const router = useRouter();
  const params = useSearchParams();

  const prevShip = params.get("prevShip");
  const newShip = params.get("newShip");
  const redirect = params.get("redirect") ?? "/";

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