// src/app/(user)/island/[id]/page.tsx
"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./Island.module.css";
import { useAuth } from "@/components/common/AuthContext";
import { getIslandProblems } from "@/lib/api/islands";

type FixedIslandItem = {
  id: string;
  img: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type Problem = {
  id: number;
  title: string;
  description: string;
  hint: string | null;
  solved: boolean;
};

const FIXED_PIN1_ISLANDS: FixedIslandItem[] = [
  {
    id: "1",
    img: "/assets/islands/island-1.png",
    x: 18,
    y: 72,
    w: 300,
    h: 250,
  },
  {
    id: "2",
    img: "/assets/islands/island-2.png",
    x: 50,
    y: 50,
    w: 300,
    h: 250,
  },
  {
    id: "3",
    img: "/assets/islands/island-3.png",
    x: 82,
    y: 72,
    w: 300,
    h: 250,
  },
];

// pin2/3 섬 위치 3개(고정)
const DEFAULT_SLOTS = [
  { x: 22, y: 62, w: 280, h: 220 },
  { x: 50, y: 52, w: 280, h: 220 },
  { x: 78, y: 62, w: 280, h: 220 },
] as const;

const DEFAULT_ISLAND_IMG = "/assets/islands/island-default.png";
const OCEAN_BG = "/assets/backgrounds/island-map.png";

const SHIP_BY_LEVEL: Record<number, string> = {
  1: "/assets/ships/ship-1.png",
  2: "/assets/ships/ship-2.png",
  3: "/assets/ships/ship-3.png",
};

export default function IslandSelectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  // 백엔드에서 문제 목록 가져오기
  useEffect(() => {
    if (!id) return;

    async function fetchProblems() {
      try {
        const islandId = Number(id);
        const data = await getIslandProblems(islandId);
        setProblems(data);
      } catch (error) {
        console.error("❌ Failed to fetch island problems:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProblems();
  }, [id]);

  if (!id) return null;

  const level = user?.level ?? 1;
  const shipImg = SHIP_BY_LEVEL[level] ?? SHIP_BY_LEVEL[1];
  const islandId = Number(id);

  // pin1 고정 (유지)
  if (islandId === 1) {
    return (
      <main className={styles.pageRoot}>
        <section
          className={styles.mapArea}
          style={{
            backgroundImage: `url('${OCEAN_BG}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className={styles.mapStage}>
          <div className={styles.ship}>
            <Image
              src={shipImg}
              alt="ship"
              width={240}
              height={220}
              priority
              style={{ imageRendering: "pixelated" }}
            />
          </div>

          {FIXED_PIN1_ISLANDS.map((island) => (
            <button
              key={island.id}
              className={styles.islandButton}
              style={{ left: `${island.x}%`, top: `${island.y}%` }}
              onClick={() => router.push(`/challenge/${island.id}`)}
            >
              <Image
                src={island.img}
                alt="island"
                width={island.w}
                height={island.h}
                priority
                style={{ imageRendering: "pixelated" }}
              />
            </button>
          ))}
        </div>
      </main>
    );
  }

  // 백엔드에서 가져온 문제들 표시 (최대 3개)
  const displayProblems = problems.slice(0, 3);

  return (
    <main className={styles.pageRoot}>
      <section
        className={styles.mapArea}
        style={{
          backgroundImage: `url('${OCEAN_BG}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className={styles.mapStage}>
        {loading && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "white",
              fontSize: "24px",
              fontWeight: "bold",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              zIndex: 100,
            }}
          >
            🏝️ 문제를 불러오는 중...
          </div>
        )}

        <div className={styles.ship}>
          <Image
            src={shipImg}
            alt="ship"
            width={240}
            height={220}
            priority
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {displayProblems.map((problem, idx) => {
          const pos = DEFAULT_SLOTS[idx];
          return (
            <button
              key={problem.id}
              className={styles.islandButton}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => router.push(`/challenge/${problem.id}`)}
              aria-label={`Go to challenge ${problem.id}`}
            >
              <Image
                src={DEFAULT_ISLAND_IMG}
                alt="default island"
                width={pos.w}
                height={pos.h}
                priority
                style={{ imageRendering: "pixelated" }}
              />
            </button>
          );
        })}
      </div>
    </main>
  );
}
