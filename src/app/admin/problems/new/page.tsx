// src/app/admin/problems/new/page.tsx
"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./new.module.css";
import { useAuth } from "@/components/common/AuthContext";

import {
  loadStore,
  saveStore,
  getProblemsByPin,
  getUsedSlots,
  addProblemToPin,
  type IslandsStore,
  type PinId,
  type IslandRecord,
} from "@/lib/islandStore";

function toPinId(v: string | null): PinId | null {
  if (!v) return null;
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3) return n as PinId;
  return null;
}

function pickNextSlot(used: Set<1 | 2 | 3>): 1 | 2 | 3 | null {
  if (!used.has(1)) return 1;
  if (!used.has(2)) return 2;
  if (!used.has(3)) return 3;
  return null;
}

export default function AdminCreateProblemPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { user } = useAuth() as any;

  const isAdmin = user?.role === "ADMIN";
  const pinId = useMemo(() => toPinId(sp.get("pin")), [sp]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flag, setFlag] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 핀 없으면 select로, pin=1은 고정이라 생성 금지
  useEffect(() => {
    if (!isAdmin) return;
    if (!pinId) router.replace("/admin/problems/select");
    if (pinId === 1) router.replace("/admin/problems/select");
  }, [isAdmin, pinId, router]);

  const canSubmit =
    isAdmin &&
    !!pinId &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    flag.trim().length > 0 &&
    serverUrl.trim().length > 0;

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAdmin) return;
    if (!pinId || pinId === 1) return;

    const current = loadStore();
    const curList = getProblemsByPin(current, pinId);

    if (curList.length >= 3) {
      setError("이 핀은 이미 3개가 꽉 찼습니다. 다른 핀을 선택하세요.");
      return;
    }

    const used = getUsedSlots(current, pinId);
    const slot = pickNextSlot(used);
    if (!slot) {
      setError("슬롯이 모두 사용 중입니다.");
      return;
    }

    const rec: IslandRecord = {
      islandId: `pin-${pinId}-${slot}`, // ✅ pin 내부 슬롯과 1:1 매핑
      pinId,
      slot, // ✅ 여기 때문에 에러 해결
      title: title.trim(),
      description: description.trim(),
      flag: flag.trim(),
      serverUrl: serverUrl.trim(),
      createdAt: new Date().toISOString(),
    };

    const next: IslandsStore = addProblemToPin(current, pinId, rec);
    saveStore(next);
    window.dispatchEvent(new Event("hackahoy:islands-updated"));

    // ✅ 생성 완료 -> 바다 위 default 섬이 1개 추가된 상태가 됨
    router.push(`/island/${pinId}`);
  };

  if (!isAdmin) return null;

  return (
    <section className={styles.stage}>
      <div className={styles.board}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => router.push("/admin/problems/select")}
          aria-label="close"
          title="Close"
        >
          ✕
        </button>

        <h1 className={styles.title}>Create Problem</h1>

        {error && (
          <div style={{ color: "#b00020", fontWeight: 900, marginBottom: 10 }}>
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={onCreate}>
          <div className={styles.field}>
            <div className={styles.label}>Title</div>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문제 제목"
            />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>Description</div>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="문제 설명"
            />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <div className={styles.label}>Flag</div>
              <input
                className={styles.input}
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="flag{enter_your_flag}"
              />
            </div>

            <div className={styles.field}>
              <div className={styles.label}>Server</div>
              <input
                className={styles.input}
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://localhost"
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="submit"
              className={styles.imgBtn}
              disabled={!canSubmit}
            >
              <Image
                src="/assets/ui/createproblem.png"
                alt="CREATE PROBLEM"
                width={170}
                height={64}
                priority
              />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
