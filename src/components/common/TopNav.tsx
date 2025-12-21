"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./TopNav.module.css";

type Props = {
  onBack?: () => void;
  onHome?: () => void;
};

export default function TopNav({ onBack, onHome }: Props) {
  const router = useRouter();

  return (
    <div className={styles.topNav} aria-label="top navigation">
      <button
        type="button"
        className={styles.navBtn}
        onClick={onBack ?? (() => router.back())}
        aria-label="Back"
      >
        <Image
          src="/assets/ui/back.png"
          alt="Back"
          width={120}
          height={56}
          priority
        />
      </button>

      <button
        type="button"
        className={styles.navBtn}
        onClick={onHome ?? (() => router.push("/"))}
        aria-label="Home"
      >
        <Image
          src="/assets/ui/home.png"
          alt="Home"
          width={120}
          height={56}
          priority
        />
      </button>
    </div>
  );
}
