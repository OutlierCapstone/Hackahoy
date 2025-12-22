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
  occupiedPins,
  onSelectEmptyPin,
}: {
  mode?: Mode;
  occupiedPins?: Set<PinId>;
  onSelectEmptyPin?: (pinId: PinId) => void;
}) {
  const router = useRouter();
  const { user, openLoginModal } = useAuth() as any;

  const isAdmin = user?.role === "ADMIN";
  const isOccupied = (id: PinId) => occupiedPins?.has(id) ?? false;

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

        // select: admin만 + 빈 핀만 클릭
        const clickable =
          mode === "play" ? occupied : isAdmin && !occupied && pin.id !== 1; // ✅ pin 1은 생성 선택 불가

        const title =
          mode === "play"
            ? occupied
              ? "섬으로 이동"
              : "아직 생성되지 않았습니다"
            : occupied
            ? "이미 사용 중"
            : "여기에 문제 생성";

        const onClick = () => {
          if (!clickable) return;
          if (mode === "play") return goIsland(pin.id);
          onSelectEmptyPin?.(pin.id);
        };

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
              onClick={onClick}
              disabled={!clickable}
              aria-label={`map pin ${pin.id}`}
              title={title}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                lineHeight: 0,
                cursor: clickable ? "pointer" : "not-allowed",
              }}
            >
              <Image
                src="/assets/icons/main-marker.png"
                alt="map pin"
                width={48}
                height={48}
                priority
                style={{
                  imageRendering: "pixelated",
                  display: "block",
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
