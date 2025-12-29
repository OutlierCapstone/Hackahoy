"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";
import axios from "axios";

const PIN_SLOTS = [
  { id: 1, left: "20%", top: "56%" },
  { id: 2, left: "50%", top: "42%" },
  { id: 3, left: "82%", top: "56%" },
];

export default function AdminSelectPinPage() {
  const router = useRouter();
  const { user } = useAuth() as any;

  // 1. 권한 체크 수정 (isAdmin 사용)
  const isAdmin = user?.isAdmin === true;

  const [pinCounts, setPinCounts] = useState<{ [key: number]: number }>({
    1: 0,
    2: 0,
    3: 0,
  });

  // 2. 서버에서 각 핀에 문제가 몇 개 있는지 가져오기
  useEffect(() => {
    if (!isAdmin) return;

    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get("http://localhost:4000/admin/problems", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // [{ islandId: 2, ... }, { islandId: 2, ... }] 형태를 숫자로 변환
        const counts = { 1: 0, 2: 0, 3: 0 };
        res.data.forEach((p: any) => {
          if (counts[p.islandId] !== undefined) counts[p.islandId]++;
        });
        setPinCounts(counts);
      } catch (err) {
        console.error("핀 데이터 로드 실패", err);
      }
    };

    fetchCounts();
  }, [isAdmin]);

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
        문제를 생성할 핀을 선택하세요. (현재 서버 기반)
      </div>

      {PIN_SLOTS.map((pin) => {
        //3. 선택 가능 조건: 1번이 아니고, 해당 핀에 서버 데이터가 3개 미만일 때
        const count = pinCounts[pin.id] || 0;
        const selectable = pin.id !== 1 && count < 3;

        return (
          <button
            key={pin.id}
            type="button"
            onClick={() => {
              if (selectable) {
                // 4. 이 경로로 이동해야 new/page.tsx가 정상 작동합니다.
                router.push(`/admin/problems/new?pin=${pin.id}`);
              }
            }}
            disabled={!selectable}
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
            title={`현재 문제 수: ${count}개`}
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
