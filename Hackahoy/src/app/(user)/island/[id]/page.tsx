'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './island.module.css';
import { useAuth } from '@/components/common/AuthContext';
import { getIslandProblems } from '@/lib/api/islands';

// 섬 데이터 타입 정의
type FixedIslandItem = {
  id: string; // 문제 ID와 매칭
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

// 1번 핑(구역)에는 1~3번 섬, 2번 핑(구역)에는 4~6번 섬, 3번 핑에는 7번 섬 고정
const FIXED_ISLANDS_DATA: Record<number, FixedIslandItem[]> = {
  1: [
    { id: '1', img: '/assets/islands/island-1.png', x: 18, y: 72, w: 300, h: 250 },
    { id: '2', img: '/assets/islands/island-2.png', x: 50, y: 50, w: 300, h: 250 },
    { id: '3', img: '/assets/islands/island-3.png', x: 82, y: 72, w: 300, h: 250 },
  ],
  2: [
    { id: '4', img: '/assets/islands/island-4.png', x: 18, y: 72, w: 420, h: 320 },
    { id: '5', img: '/assets/islands/island-5.png', x: 50, y: 50, w: 250, h: 200 },
    { id: '6', img: '/assets/islands/island-6.png', x: 82, y: 72, w: 300, h: 300 },
  ],
  3: [
    { id: '7', img: '/assets/islands/island-7.png', x: 18, y: 72, w: 300, h: 250 },
    // 슬롯 2, 3은 DB에서 자동 채움
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
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  const islandId = Number(id);
  const level = user?.levelNum ?? 1;
  const shipImg = SHIP_BY_LEVEL[level] ?? SHIP_BY_LEVEL[1];

  useEffect(() => {
    if (!id) return;

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
  }, [id, islandId]);

  if (!id) return null;

  const currentFixedIslands = FIXED_ISLANDS_DATA[islandId];

  // 고정 섬 ID 목록 (DB 문제 필터링용)
  const fixedIds = new Set(currentFixedIslands?.map((f) => f.id) ?? []);

  // 고정 섬 이후 DB에서 채울 문제들 (고정 ID 제외, 남은 슬롯만큼)
  const remainingSlots = currentFixedIslands
    ? 3 - currentFixedIslands.length
    : 3;

  const dbProblems = problems
    .filter((p) => !fixedIds.has(String(p.id)))
    .slice(0, remainingSlots);

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
        {/* 로딩 표시 */}
        {loading && (
          <div
            className={styles.loadingOverlay}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontSize: '20px',
              zIndex: 10,
            }}
          >
            🏝️ 섬을 찾는 중...
          </div>
        )}

        {/* 배 표시 */}
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

        {/* 고정 섬 렌더링 (1~7번) */}
        {currentFixedIslands?.map((island) => (
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
        ))}

        {/* DB 문제 자동 배치 (고정 섬 이후 남은 슬롯) */}
        {dbProblems.map((problem, idx) => {
          const slotIdx = (currentFixedIslands?.length ?? 0) + idx;
          const pos = DEFAULT_SLOTS[slotIdx];
          if (!pos) return null;
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