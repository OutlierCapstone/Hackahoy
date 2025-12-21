"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import styles from "./island.module.css";
import { useAuth } from "@/components/common/AuthContext";

type IslandItem = {
  id: string;
  img: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const ISLANDS_BY_MAP: Record<string, IslandItem[]> = {
  "1": [
    {
      id: "101",
      img: "/assets/islands/island-1.png",
      x: 18,
      y: 72,
      w: 300,
      h: 250,
    },
    {
      id: "102",
      img: "/assets/islands/island-2.png",
      x: 50,
      y: 50,
      w: 300,
      h: 250,
    },
    {
      id: "103",
      img: "/assets/islands/island-3.png",
      x: 82,
      y: 72,
      w: 300,
      h: 250,
    },
  ],
  "2": [
    {
      id: "201",
      img: "/assets/islands/island-2.png",
      x: 22,
      y: 50,
      w: 280,
      h: 220,
    },
    {
      id: "202",
      img: "/assets/islands/island-3.png",
      x: 50,
      y: 68,
      w: 280,
      h: 220,
    },
    {
      id: "203",
      img: "/assets/islands/island-1.png",
      x: 78,
      y: 50,
      w: 280,
      h: 220,
    },
  ],
};

const SHIP_BY_LEVEL: Record<number, string> = {
  1: "/assets/ships/ship-1.png",
  2: "/assets/ships/ship-2.png",
  3: "/assets/ships/ship-3.png",
};

export default function IslandSelectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const islands = ISLANDS_BY_MAP[id];
  if (!islands) return null;

  const level = user?.level ?? 1;
  const shipImg = SHIP_BY_LEVEL[level] ?? SHIP_BY_LEVEL[1];

  return (
    <main className={styles.pageRoot}>
      {/* 🔥 전체 화면 배경 */}
      <section className={styles.mapArea} />

      {/* 섬 / 배 레이어 */}
      <div className={styles.mapStage}>
        {/* 배 */}
        <div className={styles.ship}>
          <Image src={shipImg} alt="ship" width={240} height={220} priority />
        </div>

        {/* 섬 */}
        {islands.map((island) => (
          <button
            key={island.id}
            className={styles.islandButton}
            style={{ left: `${island.x}%`, top: `${island.y}%` }}
            onClick={() => router.push(`/challenge/${island.id}`)}
            aria-label={`Go to challenge ${island.id}`}
          >
            <Image
              src={island.img}
              alt="island"
              width={island.w}
              height={island.h}
              priority
            />
          </button>
        ))}
      </div>
    </main>
  );
}
