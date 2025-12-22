// src/app/(user)/challenge/[id]/page.tsx
"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./challenge.module.css";
import {
  loadStore,
  findProblemByIslandId,
  type IslandRecord,
} from "@/lib/islandStore";

type HintData = { img: string; text: string };

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();

  const [flagInput, setFlagInput] = useState("");
  const [hintOpen, setHintOpen] = useState(false);
  const [dynamic, setDynamic] = useState<IslandRecord | null>(null);

  // ✅ pin1 고정 문제 (절대 유지)
  const BG_BY_CHALLENGE: Record<string, string> = {
    "101": "/assets/backgrounds/island-1.png",
    "102": "/assets/backgrounds/island-2.png",
    "103": "/assets/backgrounds/island-3.png",
  };

  // ✅ pin1 힌트 (절대 유지)
  const HINT_BY_CHALLENGE: Record<string, HintData> = {
    "101": { img: "/assets/icons/hint-1.png", text: "힌트 : ..." },
    "102": { img: "/assets/icons/hint-2.png", text: "힌트 : ..." },
    "103": { img: "/assets/icons/hint-3.png", text: "힌트 : ..." },
  };

  // ✅ 동적 문제(pin-2-1 같은)는 store에서 읽기
  useEffect(() => {
    if (BG_BY_CHALLENGE[id]) {
      setDynamic(null);
      return;
    }
    const store = loadStore();
    setDynamic(findProblemByIslandId(store, id));
  }, [id]);

  // ✅ 배경 결정
  // - 101~103: 기존 배경 유지
  // - 동적: default-island.png 사용
  const bg = useMemo(() => {
    if (BG_BY_CHALLENGE[id]) return BG_BY_CHALLENGE[id];
    return "/assets/backgrounds/default-island.png";
  }, [id]);

  // ✅ 고정 문제는 기존 hint, 동적은(일단) hint 없음
  const hint = HINT_BY_CHALLENGE[id]; // 동적힌트는 추후 확장 가능
  const okImg = "/assets/ui/ok.png";

  // ✅ admin에서 저장된 값 표시
  const title = dynamic ? dynamic.title : `[challenge ${id}]`;
  const desc = dynamic ? dynamic.description : "시나리오 입니다.";
  const serverUrl = dynamic ? dynamic.serverUrl : "https://example.com";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 동적 문제는 flag 검증
    if (dynamic) {
      const ok = flagInput.trim() === dynamic.flag.trim();
      alert(ok ? "정답입니다!" : "오답입니다.");
      return;
    }

    // 고정 문제는 아직 데모
    alert("데모: 고정 문제(101~103)는 아직 정답 로직 연결 전입니다.");
  };

  return (
    <main className={styles.pageRoot}>
      <div className={styles.bg} style={{ backgroundImage: `url(${bg})` }} />

      <section className={styles.stage}>
        <div className={styles.boardWrap}>
          <div className={styles.board}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.desc}>{desc}</p>

            <p className={styles.link}>
              Server link:&nbsp;
              <a href={serverUrl} target="_blank" rel="noreferrer">
                {serverUrl}
              </a>
            </p>

            <form className={styles.formRow} onSubmit={onSubmit}>
              <input
                className={styles.input}
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
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
