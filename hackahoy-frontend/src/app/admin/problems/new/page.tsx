// src/app/admin/problems/new/page.tsx
"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./new.module.css";
import { useAuth } from "@/components/common/AuthContext";
import axios from "axios";

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

  const isAdmin = user?.isAdmin === true;

  if (user === null) {
    return <div style={{ color: "white" }}>사용자 확인 중...</div>;
  }

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

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. 유효성 검사
    if (!isAdmin || !pinId) return;

    try {
      const token = localStorage.getItem("accessToken");

      // 2. 백엔드 API 호출 (axios 사용)
      await axios.post(
        "http://localhost:4000/admin/problems",
        {
          islandId: Number(pinId), // 섬 번호
          title: title.trim(), // 제목
          description: description.trim(), // 설명
          hint: "힌트는 기본값입니다.", // 힌트
          correctFlag: flag.trim(), // 정답 (correctFlag로 이름 매칭)
          serverLink: serverUrl.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("✅ 문제가 서버에 등록되었습니다!");
      router.push(`/island/${pinId}`); // 등록 후 해당 섬으로 이동
    } catch (err: any) {
      setError(err.response?.data?.message || "서버 등록에 실패했습니다.");
    }
  };

  if (!isAdmin) {
    return <div style={{ color: "white" }}>관리자 권한이 없습니다.</div>;
  }

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
                placeholder="hackahoy{enter_your_flag}"
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
