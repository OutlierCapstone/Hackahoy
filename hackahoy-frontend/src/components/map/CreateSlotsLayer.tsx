// src/components/map/CreateSlotsLayer.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import type { PinId } from "@/lib/islandStore";

const PIN_POS: { id: PinId; left: string; top: string }[] = [
  { id: 1, left: "20%", top: "56%" },
  { id: 2, left: "50%", top: "42%" },
  { id: 3, left: "82%", top: "56%" },
];

type Mode = "play" | "select";

export default function CreateSlotsLayer({
  mode = "play",
  occupiedPins: storeOccupiedPins, // 기존 로컬스토리지 기반 데이터
  islands = [], // MapView에서 넘겨준 DB 데이터
  onSelectEmptyPin,
}: {
  mode?: Mode;
  occupiedPins?: Set<PinId>;
  islands?: any[];
  onSelectEmptyPin?: (pinId: PinId) => void;
}) {
  const router = useRouter();
  const { user, openLoginModal } = useAuth() as any;

  const isAdmin = user?.role === "ADMIN";

  //DB 데이터(islands)에 해당 pinId가 있는지 확인하는 로직 추가
  const isOccupied = (id: PinId) => {
    // 1. DB 데이터에 이 pinId(islandId)를 가진 섬이 있는지 확인
    const dbOccupied = islands.some((isl) => isl.id === id);
    // 2. 혹은 기존 로컬스토리지(storeOccupiedPins)에 있는지 확인
    const localOccupied = storeOccupiedPins?.has(id) ?? false;

    return dbOccupied || localOccupied;
  };

  const goIsland = (pinId: PinId) => {
    if (!user) {
      openLoginModal?.();
      return;
    }
    router.push(`/island/${pinId}`);
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
      {PIN_POS.map((pin) => {
        const occupied = isOccupied(pin.id); //수정된 판별 로직 사용

        const clickable =
          mode === "play" ? occupied : isAdmin && !occupied && pin.id !== 1;

        return (
          <div
            key={pin.id}
            style={{
              position: "absolute",
              left: pin.left,
              top: pin.top,
              transform: "translate(-50%, -50%)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (!clickable) return;
                if (mode === "play") return goIsland(pin.id);
                onSelectEmptyPin?.(pin.id);
              }}
              disabled={!clickable}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: clickable ? "pointer" : "not-allowed",
              }}
            >
              <Image
                src="/assets/icons/main-marker.png"
                alt="map pin"
                width={48}
                height={48}
                style={{
                  imageRendering: "pixelated",
                  opacity:
                    mode === "select"
                      ? occupied
                        ? 0.35
                        : 1
                      : occupied
                      ? 1
                      : 0.35,
                }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
