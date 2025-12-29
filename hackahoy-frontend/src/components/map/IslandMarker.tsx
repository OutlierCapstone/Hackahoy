"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import type { Island } from "@/domain/types/Island";

export default function IslandMarker({ island }: { island: Island }) {
  const router = useRouter();
  const { user } = useAuth();

  const handleClick = () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    router.push(`/island/${island.id}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Go to ${island.name}`}
      style={{
        position: "absolute",
        left: `${island.mapX}%`,
        top: `${island.mapY}%`,
        transform: "translate(-50%, -50%)",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        lineHeight: 0,
      }}
    >
      <Image
        src={island.iconImage}
        alt={island.name}
        width={48}
        height={48}
        priority
        style={{
          imageRendering: "pixelated",
        }}
      />
    </button>
  );
}
