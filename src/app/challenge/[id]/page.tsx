"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./challenge.module.css";
import TopNav from "@/components/common/TopNav";

type HintData = {
  img: string;
  text: string;
};

export default function ChallengePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [flag, setFlag] = useState("");
  const [hintOpen, setHintOpen] = useState(false);

  /* 배경 */
  const BG_BY_CHALLENGE: Record<string, string> = {
    "101": "/assets/backgrounds/island-1.png",
    "102": "/assets/backgrounds/island-2.png",
    "103": "/assets/backgrounds/island-3.png",
  };

  /* ✅ 챌린지별 힌트 “하나만” */
  const HINT_BY_CHALLENGE: Record<string, HintData> = {
    "101": {
      img: "/assets/icons/hint-1.png",
      text: "힌트 : UI 내 맘대러 짜서 이게 맞는지 모르겠긔",
    },
    "102": {
      img: "/assets/icons/hint-2.png",
      text: "힌트 : 똥",
    },
    "103": {
      img: "/assets/icons/hint-3.png",
      text: "힌트 : 집에 갈래.",
    },
  };

  const bg = BG_BY_CHALLENGE[id] ?? BG_BY_CHALLENGE["101"];
  const hint = HINT_BY_CHALLENGE[id]; // ✅ 여기서 하나만 선택
  const okImg = "/assets/ui/ok.png";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("submit flag:", flag);
  };

  return (
    <main className={styles.pageRoot}>
      {/* 공용 Top Navigation (BACK / HOME) */}
      <TopNav onBack={() => router.back()} onHome={() => router.push("/")} />

      {/* 배경 */}
      <div className={styles.bg} style={{ backgroundImage: `url(${bg})` }} />

      {/* 메인 스테이지 */}
      <section className={styles.stage}>
        <div className={styles.boardWrap}>
          {/* 시나리오 보드 */}
          <div className={styles.board}>
            <h1 className={styles.title}>[challenge {id}]</h1>

            <p className={styles.desc}>
              시나리오 입니다. 시나리오 입니다. 시나리오 입니다. 시나리오
              입니다. 시나리오 입니다.시나리오 입니다. 시나리오 입니다. 시나리오
              입니다. 시나리오 입니다. 시나리오 입니다.
            </p>

            <p className={styles.link}>
              Server link:&nbsp;
              <a href="https://example.com" target="_blank" rel="noreferrer">
                https://example.com
              </a>
            </p>

            <form className={styles.formRow} onSubmit={onSubmit}>
              <input
                className={styles.input}
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="flag{enter_your_flag}"
              />
              <button type="submit" className={styles.flagBtn}>
                <Image
                  src="/assets/ui/flag.png"
                  alt="flag"
                  width={94}
                  height={70}
                />
              </button>
            </form>
          </div>

          {/* 힌트 버튼 (항상 1개) */}
          {hint && (
            <button
              type="button"
              className={styles.hintBtn}
              onClick={() => setHintOpen(true)}
              aria-label="open hint"
            >
              <Image src={hint.img} alt="hint" width={260} height={320} />
            </button>
          )}
        </div>
      </section>

      {/* 힌트 모달 */}
      {hintOpen && hint && (
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
              <p className={styles.modalText}>{hint.text}</p>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.okBtn}
                onClick={() => setHintOpen(false)}
              >
                <Image src={okImg} alt="ok" width={88} height={56} />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
