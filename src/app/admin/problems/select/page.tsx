// src/app/admin/problems/select/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import {
  loadStore,
  getFullPinsWithFixed,
  type PinId,
  type IslandsStore,
} from "@/lib/islandStore";

const PIN_SLOTS: { id: PinId; left: string; top: string }[] = [
  { id: 1, left: "20%", top: "56%" },
  { id: 2, left: "50%", top: "42%" },
  { id: 3, left: "82%", top: "56%" },
];

export default function AdminSelectPinPage() {
  const router = useRouter();
  const { user } = useAuth() as any;
  const isAdmin = user?.role === "ADMIN";

  const [store, setStore] = useState<IslandsStore>({});

  useEffect(() => {
    if (!isAdmin) return;

    const reload = () => setStore(loadStore());
    reload();

    const onUpdate = () => reload();
    window.addEventListener("hackahoy:islands-updated", onUpdate);
    return () =>
      window.removeEventListener("hackahoy:islands-updated", onUpdate);
  }, [isAdmin]);

  const fullPins = useMemo(() => getFullPinsWithFixed(store), [store]);

  if (!isAdmin) return null;

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundImage: "url('/assets/backgrounds/main-map.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "80% auto",
        backgroundColor: "#1F6396",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 24,
          zIndex: 50,
          padding: "10px 14px",
          borderRadius: 12,
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          fontSize: 14,
        }}
      >
        문제를 생성할 핀을 선택하세요. (핀당 최대 3개)
      </div>

      {PIN_SLOTS.map((pin) => {
        const selectable = !fullPins.has(pin.id) && pin.id !== 1; // 1번 고정

        return (
          <button
            key={pin.id}
            type="button"
            onClick={() => {
              if (!selectable) return;
              router.push(`/admin/problems/new?pin=${pin.id}`);
            }}
            disabled={!selectable}
            title={
              pin.id === 1
                ? "1번 핀은 고정(생성 불가)"
                : selectable
                ? "이 핀에 문제 추가 생성"
                : "이 핀은 3개가 꽉 찼습니다."
            }
            style={{
              position: "absolute",
              left: pin.left,
              top: pin.top,
              transform: "translate(-50%, -50%)",
              background: "none",
              border: "none",
              padding: 0,
              cursor: selectable ? "pointer" : "not-allowed",
              opacity: selectable ? 1 : 0.35,
            }}
          >
            <Image
              src="/assets/icons/main-marker.png"
              alt="pin"
              width={48}
              height={48}
              priority
              style={{ imageRendering: "pixelated", display: "block" }}
            />
          </button>
        );
      })}
    </div>
  );
}
