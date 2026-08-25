"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import CreateSlotsLayer from "./CreateSlotsLayer";
import HackahoyLogo from "./HackahoyLogo";
import TutorialLauncher from "@/components/common/TutorialLauncher";
import { useAuth } from "@/components/common/AuthContext";
import styles from "./MapView.module.css";

import {
  loadStore,
  getOccupiedPinsWithFixed,
  STORE_KEY,
  type IslandsStore,
} from "@/lib/islandStore";
import { getIslands } from "@/lib/api/islands";
import type { Island } from "@/domain/types/Island";

export default function MapView() {
  const { user, authReady, loginModalOpen, openLoginModal, closeLoginModal, loginAsGuest } = useAuth();
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
    <div className={styles.viewport}>
      {loading && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          color: 'white', fontSize: '24px', fontWeight: 'bold', zIndex: 100,
        }}>
          🏝️ 섬을 불러오는 중...
        </div>
      )}

      {/* 지도 씬(배경 + 배 + 마커).
          로그인 전에는 랜딩처럼 배경을 살짝 블러 처리하고(그 위에 타이틀을 얹는다),
          로그인 후에는 블러를 풀어 선명한 실제 플레이 화면이 된다. */}
      <div className={`${styles.mapScene} ${!isLoggedIn ? styles.mapSceneBlurred : ""}`}>
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
      </div>

      {/* 로그인 전 랜딩 히어로 — 화면 중앙에 타이틀 + [게임 설명] + [로그인] */}
      {!isLoggedIn && (
        <main className={styles.hero}>
          <HackahoyLogo />

          <div className={styles.heroActions}>
            <button
              type="button"
              className={`pixel-btn ${styles.heroButton}`}
              onClick={() =>
                window.dispatchEvent(new Event("hackahoy:open-tutorial"))
              }
            >
              게임 설명
            </button>
            <button
              type="button"
              className={`pixel-btn ${styles.heroButton}`}
              onClick={() => openLoginModal()}
            >
              로그인
            </button>
          </div>
        </main>
      )}

      {/* 사용법 안내 + 우측 하단 도움말(?) 버튼.
          자동 노출은 하지 않는다(enabled=false). 랜딩의 '게임 설명' 버튼이나
          '?' 버튼을 눌렀을 때만 열린다. */}
      <TutorialLauncher enabled={false} />

      {/* 로그인 */}
      {loginModalOpen && !isLoggedIn && (
        <div
          className={styles.loginDim}
          onClick={() => closeLoginModal()}
        >
          <div
            className={styles.loginPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="social-login-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.loginClose}
              onClick={() => closeLoginModal()}
              aria-label="로그인 창 닫기"
            >
              ×
            </button>

            <div className={styles.loginContent}>
              <h2 id="social-login-title" className={styles.loginTitle}>
                소셜로 시작하기
              </h2>
              <p className={styles.loginNotice}>소셜 로그인은 점검 중입니다</p>

              {/* 베타 기간에는 소셜 로그인이 비활성화되어 있으나, 버튼 형태는 실제 UI와 동일하게 유지한다. */}
              <button type="button" className={`${styles.socialButton} ${styles.kakaoButton}`} disabled>
                <span className={`${styles.providerMark} ${styles.kakaoMark}`} aria-hidden />
                <span>카카오로 시작하기</span>
                <span className={styles.statusBadge}>점검 중</span>
              </button>

              <button type="button" className={`${styles.socialButton} ${styles.naverButton}`} disabled>
                <span className={`${styles.providerMark} ${styles.naverMark}`} aria-hidden>N</span>
                <span>네이버로 시작하기</span>
                <span className={styles.statusBadge}>점검 중</span>
              </button>

              <button type="button" className={`${styles.socialButton} ${styles.googleButton}`} disabled>
                <span className={`${styles.providerMark} ${styles.googleMark}`} aria-hidden>G</span>
                <span>Google로 시작하기</span>
                <span className={styles.statusBadge}>점검 중</span>
              </button>

              <div className={styles.loginDivider} aria-hidden>
                <span />
                <strong>또는</strong>
                <span />
              </div>

              <button
                type="button"
                onClick={handleGuestStart}
                disabled={guestPending}
                className={`pixel-btn ${styles.guestButton}`}
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
