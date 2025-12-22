// src/lib/islandStore.ts

export type PinId = 1 | 2 | 3;

export type IslandRecord = {
  islandId: string; // 예: "pin-2-1"
  pinId: PinId; // 2 | 3
  slot: 1 | 2 | 3; // 핀 내부 섬 슬롯
  title: string;
  description: string;
  flag: string;
  serverUrl: string;
  createdAt: string;
};

export type IslandsStore = Record<string, IslandRecord[]>;
// key: "2" | "3" (pin 1은 고정이라 저장 안 씀)

export const STORE_KEY = "hackahoy:islands";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadStore(): IslandsStore {
  if (typeof window === "undefined") return {};
  return safeParse<IslandsStore>(localStorage.getItem(STORE_KEY), {});
}

export function saveStore(next: IslandsStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORE_KEY, JSON.stringify(next));
}

export function getProblemsByPin(
  store: IslandsStore,
  pinId: PinId
): IslandRecord[] {
  const v = store[String(pinId)];
  return Array.isArray(v) ? v : [];
}

export function getUsedSlots(
  store: IslandsStore,
  pinId: PinId
): Set<1 | 2 | 3> {
  const used = new Set<1 | 2 | 3>();
  for (const p of getProblemsByPin(store, pinId)) {
    used.add(p.slot);
  }
  return used;
}

export function addProblemToPin(
  store: IslandsStore,
  pinId: PinId,
  rec: IslandRecord
): IslandsStore {
  const list = getProblemsByPin(store, pinId);

  // 슬롯 중복 방지
  if (list.some((x) => x.slot === rec.slot)) return store;

  // 최대 3개 제한
  if (list.length >= 3) return store;

  return {
    ...store,
    [String(pinId)]: [...list, rec].sort((a, b) => a.slot - b.slot),
  };
}

// pin이 "점유됐다"의 의미: 그 pin에 최소 1개라도 문제가 생성된 경우
// pin이 "선택 불가"의 의미: 그 pin이 3개로 꽉 찬 경우
export function getFullPins(store: IslandsStore): Set<PinId> {
  const s = new Set<PinId>();
  for (const k of Object.keys(store)) {
    const n = Number(k);
    if (n === 2 || n === 3) {
      if (getProblemsByPin(store, n as PinId).length >= 3) s.add(n as PinId);
    }
  }
  return s;
}

// ✅ pin1은 고정이므로 무조건 FULL 처리
export function getFullPinsWithFixed(store: IslandsStore): Set<PinId> {
  const s = new Set<PinId>([1]);
  for (const k of Object.keys(store)) {
    const n = Number(k);
    if (n === 2 || n === 3) {
      if (getProblemsByPin(store, n as PinId).length >= 3) s.add(n as PinId);
    }
  }
  return s;
}

// ✅ 핀 선택 화면에서 1번은 무조건 막아야 하니까 fixed 포함 버전
export function getOccupiedPinsWithFixed(store: IslandsStore): Set<PinId> {
  const s = new Set<PinId>([1]);
  for (const k of Object.keys(store)) {
    const n = Number(k);
    if ((n === 2 || n === 3) && getProblemsByPin(store, n as PinId).length > 0)
      s.add(n as PinId);
  }
  return s;
}

// challenge에서 islandId로 문제 찾기 (pin-2-1 같은 값)
export function findProblemByIslandId(
  store: IslandsStore,
  islandId: string
): IslandRecord | null {
  for (const pinKey of Object.keys(store)) {
    const list = store[pinKey];
    if (!Array.isArray(list)) continue;
    const hit = list.find((x) => x.islandId === islandId);
    if (hit) return hit;
  }
  return null;
}
