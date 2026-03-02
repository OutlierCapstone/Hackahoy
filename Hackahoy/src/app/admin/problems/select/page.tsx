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
  
  const isAdmin = user?.isAdmin === true;

  const [pinCounts, setPinCounts] = useState<{ [key: number]: number }>({
    1: 0, 2: 0, 3: 0
  });

  useEffect(() => {
    if (!isAdmin) return;

    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get("http://localhost:4000/admin/problems", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
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
        position: "relative", width: "100vw", height: "100vh", overflow: "hidden",
        backgroundImage: "url('/assets/backgrounds/main-map.png')",
        backgroundRepeat: "no-repeat", backgroundPosition: "center",
        backgroundSize: "80% auto", backgroundColor: "#1F6396",
      }}
    >
      <div style={{
        position: "absolute", left: 24, top: 24, zIndex: 50, padding: "10px 14px",
        borderRadius: 12, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 14,
      }}>
        문제를 생성할 핀을 선택하세요. (현재 서버 기반)
      </div>

      {PIN_SLOTS.map((pin) => {
        const count = pinCounts[pin.id] || 0;
        
        // 1번과 2번 핑은 이미 문제가 배정되어 있으므로 선택 불가능하게 수정
        const selectable = pin.id !== 1 && pin.id !== 2 && count < 3;

        return (
          <button
            key={pin.id}
            type="button"
            onClick={() => {
              if (selectable) {
                router.push(`/admin/problems/new?pin=${pin.id}`);
              }
            }}
            disabled={!selectable}
            style={{
              position: "absolute", left: pin.left, top: pin.top,
              transform: "translate(-50%, -50%)", background: "none",
              border: "none", padding: 0,
              cursor: selectable ? "pointer" : "not-allowed",
              opacity: selectable ? 1 : 0.35, // 비활성 시 회색으로 보임
            }}
            title={selectable ? `현재 문제 수: ${count}개` : "이 핑은 선택할 수 없습니다."}
          >
            <Image
              src="/assets/icons/main-marker.png"
              alt="pin" width={48} height={48} priority
              style={{ imageRendering: "pixelated", display: "block" }}
            />
            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              <span style={{ 
                color: 'white', 
                fontWeight: 'bold', 
                fontSize: '12px',
                textShadow: '1px 1px 2px black'
              }}>
                 {pin.id}번 ({count}/3)
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}