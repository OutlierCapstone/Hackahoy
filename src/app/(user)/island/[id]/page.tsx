// src/app/(user)/island/[id]/page.tsx
"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./island.module.css";
import { useAuth } from "@/components/common/AuthContext";
import {
  loadStore,
  getProblemsByPin,
  type IslandsStore,
  type PinId,
} from "@/lib/islandStore";

type FixedIslandItem = {
  id: string;
  img: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const FIXED_PIN1_ISLANDS: FixedIslandItem[] = [
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

function toPinId(v: string | undefined): PinId | null {
  if (!v) return null;
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3) return n as PinId;
  return null;
}

export default function IslandSelectPage() {
  const { id } = useParams<{ id: string }>();
  const pinId = useMemo(() => toPinId(id), [id]);
  const router = useRouter();
  const { user } = useAuth();

  const [store, setStore] = useState<IslandsStore>({});

  useEffect(() => {
    const reload = () => setStore(loadStore());
    reload();

    const onUpdate = () => reload();
    window.addEventListener("hackahoy:islands-updated", onUpdate);
    return () =>
      window.removeEventListener("hackahoy:islands-updated", onUpdate);
  }, []);

  if (!pinId) return null;

  const level = user?.level ?? 1;
  const shipImg = SHIP_BY_LEVEL[level] ?? SHIP_BY_LEVEL[1];

  // ✅ pin1 고정 (유지)
  if (pinId === 1) {
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

  // ✅ pin2/3: store에 있는 만큼(최대3) 디폴트 섬 표시
  const problems = getProblemsByPin(store, pinId).slice(0, 3);

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

        {problems.map((p, idx) => {
          const pos = DEFAULT_SLOTS[idx];
          return (
            <button
              key={p.islandId}
              className={styles.islandButton}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => router.push(`/challenge/${p.islandId}`)}
              aria-label={`Go to challenge ${p.islandId}`}
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
