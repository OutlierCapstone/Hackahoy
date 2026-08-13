"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import CreateSlotsLayer from "./CreateSlotsLayer";
import { useAuth } from "@/components/common/AuthContext";

import {
  loadStore,
  getOccupiedPinsWithFixed,
  STORE_KEY,
  type IslandsStore,
} from "@/lib/islandStore";
import { getIslands } from "@/lib/api/islands";
import type { Island } from "@/domain/types/Island";

export default function MapView() {
  const { user, authReady, loginModalOpen, closeLoginModal, loginAsGuest } = useAuth();
  const [guestPending, setGuestPending] = useState(false);

  const isLoggedIn = !!user;

  const [store, setStore] = useState<IslandsStore>({});
  const [islands, setIslands] = useState<Island[]>([]);
  const [loading, setLoading] = useState(true);

  // 현재 레벨에 따른 배 이미지 설정
  const currentLevel = user?.levelNum ?? 1;
  const shipImgSrc = useMemo(() => {
    const shipNumber = currentLevel > 0 ? currentLevel : 1;
    return `/assets/ships/ship-${shipNumber}.png`;
  }, [currentLevel]);

  // 세션이 살아 있는 동안 /islands 를 한 번만 부르기 위한 표시.
  // user 가 null → 값으로 바뀔 때 effect 가 다시 도는데, 섬 목록은 유저별로 다르지 않다.
  const islandsFetchedRef = useRef(false);

  // /islands 는 인증이 필요하다.
  //  - 로그인 전에는 부르지 않는다. 토큰이 없으면 무조건 401 이라 콘솔만 더럽힌다.
  //  - 로그인(게스트 포함) 직후에는 불러야 방금 만든 세션의 토큰으로 섬이 채워진다.
  useEffect(() => {
    // user 상태는 /auth/me 응답을 기다리므로, 새로고침 직후에는 아직 null 이다.
    // 저장된 토큰까지 같이 보면 재방문 때 섬이 늦게 뜨는 깜빡임이 없다.
    if (!authReady) return;
    const hasSession = Boolean(user);

    if (!hasSession) {
      islandsFetchedRef.current = false;
      setIslands([]);
      setLoading(false);
      return;
    }

    if (islandsFetchedRef.current) return;
    islandsFetchedRef.current = true;

    async function fetchIslands() {
      try {
        const data = await getIslands();
        setIslands(data);
      } catch (error) {
        // 실패했으면 표시를 되돌린다. 안 그러면 이 세션에서는 영영 재시도하지 않는다.
        islandsFetchedRef.current = false;
        console.error('❌ Failed to fetch islands:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchIslands();
  }, [authReady, user?.userId]);

  // 로컬 스토리지 동기화
  useEffect(() => {
    setStore(loadStore());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORE_KEY) setStore(loadStore());
    };
    const onLocalUpdate = () => setStore(loadStore());
    
    window.addEventListener("storage", onStorage);
    window.addEventListener("hackahoy:islands-updated", onLocalUpdate as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("hackahoy:islands-updated", onLocalUpdate as any);
    };
  }, []);

  const occupiedPins = useMemo(() => getOccupiedPinsWithFixed(store), [store]);

  // 비회원으로 시작하기. 이미 메인 화면이라 성공해도 페이지 이동은 하지 않는다.
  const handleGuestStart = async () => {
    if (guestPending) return;
    setGuestPending(true);
    try {
      const guest = await loginAsGuest();
      if (!guest) alert("비회원으로 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setGuestPending(false);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#1F6396",
        backgroundImage: "url('/assets/backgrounds/main-map.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "80% auto",
      }}
    >
      {loading && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          color: 'white', fontSize: '24px', fontWeight: 'bold', zIndex: 100,
        }}>
          🏝️ 섬을 불러오는 중...
        </div>
      )}

      {/* 중앙 배 */}
      <Image
        src={shipImgSrc}
        alt={`Level ${currentLevel} Ship`}
        width={240}
        height={220}
        style={{
          position: "absolute", left: "55%", top: "63%",
          transform: "translate(-50%, -50%)", zIndex: 5,
        }}
        priority
      />

      <CreateSlotsLayer 
        mode="play" 
        occupiedPins={occupiedPins}
        islands={islands}
      />

      {/* 로그인 */}
      {loginModalOpen && !isLoggedIn && (
        <div
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)",
            display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000,
          }}
          onClick={() => closeLoginModal()}
        >
          <div
            style={{
              width: 680, height: 560,
              backgroundImage: "url('/assets/backgrounds/main-login.png')",
              backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
              display: "flex", justifyContent: "flex-start", alignItems: "center",
              boxSizing: "border-box", padding: "40px 80px 40px", position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <p className="retro-title text-center" style={{ marginTop: 12, marginBottom: 4 }}>
                소셜로 시작하기
              </p>
              <p className="text-center" style={{ marginBottom: 24, color: "#f4b452", fontSize: 14 }}>
                테스트 중입니다
              </p>

              {/* 카카오 — 베타 기간 소셜 로그인 점검으로 비활성화 */}
              <button type="button" className="social-login-btn" disabled style={{ background: "none", border: "none", cursor: "not-allowed", opacity: 0.4, marginBottom: 16 }}>
                <Image src="/assets/ui/kakao.png" alt="카카오" width={400} height={90} />
              </button>

              {/* 네이버 — 베타 기간 소셜 로그인 점검으로 비활성화 */}
              <button type="button" className="social-login-btn" disabled style={{ background: "none", border: "none", cursor: "not-allowed", opacity: 0.4, marginBottom: 16 }}>
                <Image src="/assets/ui/naver.png" alt="네이버" width={400} height={90} />
              </button>

              {/* 구글 — 베타 기간 소셜 로그인 점검으로 비활성화 */}
              <button type="button" className="social-login-btn" disabled style={{ background: "none", border: "none", cursor: "not-allowed", opacity: 0.4 }}>
                <Image src="/assets/ui/google.png" alt="구글" width={400} height={90} />
              </button>

              {/* 비회원 — 소셜 버튼과 달리 이미지 자산이 없어 CSS 로만 그린다. */}
              <button
                type="button"
                onClick={handleGuestStart}
                disabled={guestPending}
                style={{
                  marginTop: 12,
                  width: 400,
                  padding: "10px 0",
                  background: "transparent",
                  border: "2px solid #7b3b0a",
                  borderRadius: 4,
                  color: "#f4b452",
                  fontSize: 18,
                  letterSpacing: "0.02em",
                  cursor: guestPending ? "wait" : "pointer",
                  opacity: guestPending ? 0.6 : 1,
                }}
              >
                {guestPending ? "세션을 만드는 중..." : "비회원으로 시작하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
