'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './island.module.css';
import { useAuth } from '@/components/common/AuthContext';
import { getIslandProblems } from '@/lib/api/islands';

// Type definitions
type FixedIslandItem = {
  id: string; // Matches problem ID
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

// Fixed data for Pins 1 and 2
const FIXED_ISLANDS_DATA: Record<number, FixedIslandItem[]> = {
  1: [
    {
      id: '1',
      img: '/assets/islands/island-1.png',
      x: 18,
      y: 72,
      w: 300,
      h: 250,
    },
    {
      id: '2',
      img: '/assets/islands/island-2.png',
      x: 50,
      y: 50,
      w: 300,
      h: 250,
    },
    {
      id: '3',
      img: '/assets/islands/island-3.png',
      x: 82,
      y: 72,
      w: 300,
      h: 250,
    },
  ],
  2: [
    {
      id: '4',
      img: '/assets/islands/island-4.png',
      x: 18,
      y: 72,
      w: 300,
      h: 250,
    },
    {
      id: '5',
      img: '/assets/islands/island-5.png',
      x: 50,
      y: 50,
      w: 300,
      h: 250,
    },
    {
      id: '6',
      img: '/assets/islands/island-6.png',
      x: 82,
      y: 72,
      w: 300,
      h: 250,
    },
  ],
  3: [
    {
      id: '7',
      img: '/assets/islands/island-7.png',
      x: 18,
      y: 72,
      w: 300,
      h: 250,
    },
  ],
};

const DEFAULT_SLOTS = [
  { x: 22, y: 62, w: 280, h: 220 },
  { x: 50, y: 52, w: 280, h: 220 },
  { x: 78, y: 62, w: 280, h: 220 },
] as const;

const DEFAULT_ISLAND_IMG = '/assets/islands/island-default.png';
const OCEAN_BG = '/assets/backgrounds/island-map.png';

const SHIP_BY_LEVEL: Record<number, string> = {
  1: '/assets/ships/ship-1.png',
  2: '/assets/ships/ship-2.png',
  3: '/assets/ships/ship-3.png',
};

export default function IslandSelectPage() {
  const params = useParams<{ id: string }>();
  const islandId = Number(params.id);
  const router = useRouter();
  const { user } = useAuth() as any;

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine ship image based on user level
  const shipImg = SHIP_BY_LEVEL[user?.levelNum || 1] || SHIP_BY_LEVEL[1];

  useEffect(() => {
    if (!islandId) return;

    async function fetchProblems() {
      try {
        const data = await getIslandProblems(islandId);
        setProblems(data);
      } catch (error) {
        console.error('❌ Failed to fetch island problems:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProblems();
  }, [islandId]);

  if (!islandId) return null;

  const currentFixedIslands = FIXED_ISLANDS_DATA[islandId];

  return (
    <main className={styles.pageRoot}>
      <section
        className={styles.mapArea}
        style={{
          backgroundImage: `url('${OCEAN_BG}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className={styles.mapStage}>
        {loading && (
          <div className={styles.loadingOverlay}>🏝️ 섬을 찾는 중...</div>
        )}

        {/* Ship Display */}
        <div className={styles.ship}>
          <Image
            src={shipImg}
            alt="ship"
            width={240}
            height={220}
            priority
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Island Rendering Logic */}
        {currentFixedIslands
          ? // Case A: Pins with fixed designs (1 & 2)
            currentFixedIslands.map((island) => (
              <button
                key={island.id}
                className={styles.islandButton}
                style={{ left: `${island.x}%`, top: `${island.y}%` }}
                onClick={() => router.push(`/challenge/${island.id}`)}
              >
                <Image
                  src={island.img}
                  alt={`island-${island.id}`}
                  width={island.w}
                  height={island.h}
                  priority
                  style={{ imageRendering: 'pixelated' }}
                />
              </button>
            ))
          : // Case B: Dynamic pins (Auto-layout from DB)
            problems.slice(0, 3).map((problem, idx) => {
              const pos = DEFAULT_SLOTS[idx];
              return (
                <button
                  key={problem.id}
                  className={styles.islandButton}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  onClick={() => router.push(`/challenge/${problem.id}`)}
                >
                  <Image
                    src={DEFAULT_ISLAND_IMG}
                    alt="default island"
                    width={pos.w}
                    height={pos.h}
                    priority
                    style={{ imageRendering: 'pixelated' }}
                  />
                </button>
              );
            })}
      </div>
    </main>
  );
}
