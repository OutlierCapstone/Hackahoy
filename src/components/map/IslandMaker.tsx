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
        lineHeight: 0, // ✅ 이미지 아래 baseline 여백 방지
      }}
    >
      <Image
        src={island.iconImage} // ✅ /assets/icons/main-marker.png 로 통일된 값
        alt={island.name}
        width={48} // ✅ 홈과 동일하게 (필요 시 64로)
        height={48}
        priority
        style={{
          imageRendering: "pixelated", // ✅ 픽셀 느낌 유지
        }}
      />
    </button>
  );
}
