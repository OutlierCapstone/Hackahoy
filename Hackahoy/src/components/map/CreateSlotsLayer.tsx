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
  occupiedPins: storeOccupiedPins, 
  islands = [],
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

  const isOccupied = (id: PinId) => {
  // 1번과 2번 핀은 무조건 활성화 상태(true)로 리턴합니다.
  if (id === 1 || id === 2) return true;

  const dbOccupied = islands.some(isl => isl.id === id);
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
        const occupied = isOccupied(pin.id);

        const clickable =
          mode === "play" ? occupied : isAdmin && !occupied && pin.id !== 1;

        return (
          <div key={pin.id} style={{ position: "absolute", left: pin.left, top: pin.top, transform: "translate(-50%, -50%)" }}>
            <button
              type="button"
              onClick={() => {
                if (!clickable) return;
                if (mode === "play") return goIsland(pin.id);
                onSelectEmptyPin?.(pin.id);
              }}
              disabled={!clickable}
              style={{ background: "none", border: "none", padding: 0, cursor: clickable ? "pointer" : "not-allowed" }}
            >
              <Image
                src="/assets/icons/main-marker.png"
                alt="map pin"
                width={48}
                height={48}
                style={{
                  imageRendering: "pixelated",
                  opacity: mode === "select" ? (occupied ? 0.35 : 1) : (occupied ? 1 : 0.35),
                }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}