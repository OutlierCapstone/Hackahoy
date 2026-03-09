<<<<<<< HEAD
<<<<<<< HEAD
'use client';
=======
<<<<<<< HEAD
// src/app/(user)/island/[id]/page.tsx
"use client";
>>>>>>> 229fd6d (feat: implement user unban logic and automated daily security report)

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './island.module.css';
import { useAuth } from '@/components/common/AuthContext';
import { getIslandProblems } from '@/lib/api/islands';

// 섬 데이터 타입 정의
type FixedIslandItem = {
<<<<<<< HEAD
  id: string; // 문제 ID와 매칭
=======
  id: string;
=======
=======
>>>>>>> fae79c4 (Feat: OpenResty 설정 및 collect 서비스 추가, 챌린지 로직 수정)
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
<<<<<<< HEAD
>>>>>>> 18190ce (feat: implement user unban logic and automated daily security report)
>>>>>>> 229fd6d (feat: implement user unban logic and automated daily security report)
=======
>>>>>>> fae79c4 (Feat: OpenResty 설정 및 collect 서비스 추가, 챌린지 로직 수정)
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

<<<<<<< HEAD
<<<<<<< HEAD
=======
<<<<<<< HEAD
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
=======
>>>>>>> 229fd6d (feat: implement user unban logic and automated daily security report)
=======
>>>>>>> fae79c4 (Feat: OpenResty 설정 및 collect 서비스 추가, 챌린지 로직 수정)
// 1번 핑(구역)에는 1~3번 섬, 2번 핑(구역)에는 4~6번 섬 배치
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
};
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 18190ce (feat: implement user unban logic and automated daily security report)
>>>>>>> 229fd6d (feat: implement user unban logic and automated daily security report)
=======
>>>>>>> fae79c4 (Feat: OpenResty 설정 및 collect 서비스 추가, 챌린지 로직 수정)

const DEFAULT_SLOTS = [
  { x: 22, y: 62, w: 280, h: 220 },
  { x: 50, y: 52, w: 280, h: 220 },
  { x: 78, y: 62, w: 280, h: 220 },
] as const;

<<<<<<< HEAD
<<<<<<< HEAD
const DEFAULT_ISLAND_IMG = '/assets/islands/island-default.png';
const OCEAN_BG = '/assets/backgrounds/island-map.png';

const SHIP_BY_LEVEL: Record<number, string> = {
  1: '/assets/ships/ship-1.png',
  2: '/assets/ships/ship-2.png',
  3: '/assets/ships/ship-3.png',
=======
<<<<<<< HEAD
const DEFAULT_ISLAND_IMG = "/assets/islands/island-default.png";
const OCEAN_BG = "/assets/backgrounds/island-map.png";

const SHIP_BY_LEVEL: Record<number, string> = {
  1: "/assets/ships/ship-1.png",
  2: "/assets/ships/ship-2.png",
  3: "/assets/ships/ship-3.png",
=======
=======
>>>>>>> fae79c4 (Feat: OpenResty 설정 및 collect 서비스 추가, 챌린지 로직 수정)
const DEFAULT_ISLAND_IMG = '/assets/islands/island-default.png';
const OCEAN_BG = '/assets/backgrounds/island-map.png';

const SHIP_BY_LEVEL: Record<number, string> = {
  1: '/assets/ships/ship-1.png',
  2: '/assets/ships/ship-2.png',
  3: '/assets/ships/ship-3.png',
<<<<<<< HEAD
>>>>>>> 18190ce (feat: implement user unban logic and automated daily security report)
>>>>>>> 229fd6d (feat: implement user unban logic and automated daily security report)
=======
>>>>>>> fae79c4 (Feat: OpenResty 설정 및 collect 서비스 추가, 챌린지 로직 수정)
};

export default function IslandSelectPage() {
  const params = useParams<{ id: string }>();
  const islandId = Number(params.id); // URL 파라미터에서 islandId 추출
  const router = useRouter();
  const { user } = useAuth();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

<<<<<<< HEAD
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> 229fd6d (feat: implement user unban logic and automated daily security report)
  const islandId = Number(id);
  const level = user?.levelNum ?? 1;
  const shipImg = SHIP_BY_LEVEL[level] ?? SHIP_BY_LEVEL[1];

<<<<<<< HEAD
=======
>>>>>>> 18190ce (feat: implement user unban logic and automated daily security report)
>>>>>>> 229fd6d (feat: implement user unban logic and automated daily security report)
=======
  // 사용자 레벨에 따른 배 이미지 결정 (기본값 ship-1)
  const shipImg = SHIP_BY_LEVEL[user?.levelNum || 1] || SHIP_BY_LEVEL[1];

>>>>>>> fae79c4 (Feat: OpenResty 설정 및 collect 서비스 추가, 챌린지 로직 수정)
  useEffect(() => {
    if (!islandId) return;

    async function fetchProblems() {
      try {
<<<<<<< HEAD
<<<<<<< HEAD
        const data = await getIslandProblems(islandId);
        setProblems(data);
=======
<<<<<<< HEAD
        const islandId = Number(id);
        const data = await getIslandProblems(islandId);
        setProblems(data);
        console.log(`✅ Island ${islandId} problems loaded:`, data);
=======
        const data = await getIslandProblems(islandId);
        setProblems(data);
>>>>>>> 18190ce (feat: implement user unban logic and automated daily security report)
>>>>>>> 229fd6d (feat: implement user unban logic and automated daily security report)
=======
        const data = await getIslandProblems(islandId);
        setProblems(data);
>>>>>>> fae79c4 (Feat: OpenResty 설정 및 collect 서비스 추가, 챌린지 로직 수정)
      } catch (error) {
        console.error('❌ Failed to fetch island problems:', error);
      } finally {
        setLoading(false);
      }
    }
<<<<<<< HEAD
<<<<<<< HEAD
=======
<<<<<<< HEAD

>>>>>>> 229fd6d (feat: implement user unban logic and automated daily security report)
    fetchProblems();
  }, [id, islandId]);
=======
    fetchProblems();
  }, [islandId]);
>>>>>>> fae79c4 (Feat: OpenResty 설정 및 collect 서비스 추가, 챌린지 로직 수정)

  if (!islandId) return null;

<<<<<<< HEAD
  // 1. 해당 핑에 고정 디자인 데이터가 있는지 확인
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
        {/* 로딩 표시 */}
        {loading && (
          <div className={styles.loadingOverlay} style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            color: 'white', fontSize: '20px', zIndex: 10
          }}>
            🏝️ 섬을 찾는 중...
          </div>
        )}

<<<<<<< HEAD
=======
          {FIXED_PIN1_ISLANDS.map((island) => (
=======
    fetchProblems();
  }, [id, islandId]);

  if (!id) return null;

  // 1. 해당 핑에 고정 디자인 데이터가 있는지 확인
=======
>>>>>>> fae79c4 (Feat: OpenResty 설정 및 collect 서비스 추가, 챌린지 로직 수정)
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

<<<<<<< HEAD
>>>>>>> 229fd6d (feat: implement user unban logic and automated daily security report)
        {/* 배 표시 */}
=======
>>>>>>> fae79c4 (Feat: OpenResty 설정 및 collect 서비스 추가, 챌린지 로직 수정)
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

<<<<<<< HEAD
        {/* 섬 렌더링 로직 */}
        {currentFixedIslands ? (
          // 케이스 A: 고정 데이터(1~6번 섬)가 있는 핑 1, 2
          currentFixedIslands.map((island) => (
<<<<<<< HEAD
=======
>>>>>>> 18190ce (feat: implement user unban logic and automated daily security report)
>>>>>>> 229fd6d (feat: implement user unban logic and automated daily security report)
            <button
              key={island.id}
              className={styles.islandButton}
              style={{ left: `${island.x}%`, top: `${island.y}%` }}
              onClick={() => router.push(`/challenge/${island.id}`)}
            >
              <Image
                src={island.img}
<<<<<<< HEAD
                alt={`island-${island.id}`}
=======
<<<<<<< HEAD
                alt="island"
>>>>>>> 229fd6d (feat: implement user unban logic and automated daily security report)
                width={island.w}
                height={island.h}
                priority
                style={{ imageRendering: 'pixelated' }}
              />
            </button>
          ))
        ) : (
          // 케이스 B: 고정 데이터가 없는 일반 핑 (DB에서 가져온 문제 자동 배치)
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
          })
        )}
<<<<<<< HEAD
=======

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
=======
                alt={`island-${island.id}`}
                width={island.w}
                height={island.h}
                priority
                style={{ imageRendering: 'pixelated' }}
              />
            </button>
          ))
        ) : (
          // 케이스 B: 고정 데이터가 없는 일반 핑 (DB에서 가져온 문제 자동 배치)
          problems.slice(0, 3).map((problem, idx) => {
            const pos = DEFAULT_SLOTS[idx];
            return (
=======
        {currentFixedIslands
          ? currentFixedIslands.map((island) => (
>>>>>>> fae79c4 (Feat: OpenResty 설정 및 collect 서비스 추가, 챌린지 로직 수정)
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
<<<<<<< HEAD
            );
          })
        )}
>>>>>>> 18190ce (feat: implement user unban logic and automated daily security report)
>>>>>>> 229fd6d (feat: implement user unban logic and automated daily security report)
=======
            ))
          : problems.slice(0, 3).map((problem, idx) => {
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
>>>>>>> fae79c4 (Feat: OpenResty 설정 및 collect 서비스 추가, 챌린지 로직 수정)
      </div>
    </main>
  );
}
