// src/components/map/MapView.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import IslandMarker from "./IslandMaker";
import { islands } from "../../domain/islands";
import { useAuth } from "@/components/common/AuthContext";
import DevAdminLoginButton from "@/components/dev/DevAdminLoginButton";

export default function MapView() {
  // ✅ openLoginModal 추가: 다른 페이지에서 "/"로 넘어온 경우 자동으로 모달 열기 위해 필요
  const { login, user, loginModalOpen, closeLoginModal, openLoginModal } =
    useAuth();

  const isLoggedIn = !!user;

  // Kakao / Naver SDK 준비 여부
  const [kakaoReady, setKakaoReady] = useState(false);
  const [naverReady, setNaverReady] = useState(false);

  // 네이버 로그인 인스턴스 저장용
  const naverLoginRef = useRef<any>(null);

  /**
   * ✅ (추가) 다른 페이지에서 LOGIN 클릭 → "/"로 이동한 뒤
   * sessionStorage 플래그를 보고 자동으로 로그인 모달을 열어줌
   *
   * AppTopNav/TopNav 쪽에서 아래처럼 처리한다고 가정:
   * - 홈이 아닌 페이지에서 LOGIN 클릭 시:
   *   sessionStorage.setItem("open_login_modal_once", "1");
   *   router.push("/");
   *
   * 그러면 MapView가 마운트되고 여기서 플래그를 감지해 openLoginModal() 호출
   */
  useEffect(() => {
    if (isLoggedIn) return;

    try {
      const flag = sessionStorage.getItem("open_login_modal_once");
      if (flag === "1") {
        sessionStorage.removeItem("open_login_modal_once");
        openLoginModal?.();
      }
    } catch (e) {
      // sessionStorage 접근 불가 환경 대비(거의 없음)
      console.error(e);
    }
  }, [isLoggedIn, openLoginModal]);

  /* ------------------------------------
   *  Kakao SDK 로드 & init
   * ----------------------------------*/
  useEffect(() => {
    if (typeof window === "undefined") return;

    const w = window as any;
    if (w.Kakao) {
      if (!w.Kakao.isInitialized()) {
        w.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
      }
      setKakaoReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://developers.kakao.com/sdk/js/kakao.min.js";
    script.async = true;

    script.onload = () => {
      const w2 = window as any;
      if (w2.Kakao && !w2.Kakao.isInitialized()) {
        w2.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
      }
      setKakaoReady(true);
    };

    script.onerror = () => {
      console.error("Kakao SDK script load error");
      setKakaoReady(false);
    };

    document.head.appendChild(script);
  }, []);

  /* ------------------------------------
   *  Naver SDK 인스턴스 생성 (전역 SDK 사용)
   * ----------------------------------*/
  useEffect(() => {
    if (typeof window === "undefined") return;

    const w = window as any;
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!;
    const callbackUrl =
      process.env.NEXT_PUBLIC_NAVER_CALLBACK_URL ||
      `${window.location.origin}/auth/naver/callback`;

    if (!w.naver || !w.naver.LoginWithNaverId) {
      console.error("[NAVER] global SDK not loaded on window");
      setNaverReady(false);
      return;
    }

    const naverLogin = new w.naver.LoginWithNaverId({
      clientId,
      callbackUrl,
      isPopup: true,
    });

    naverLogin.init();
    naverLoginRef.current = naverLogin;
    setNaverReady(true);
  }, []);

  /* ------------------------------------
   *  Naver 콜백 팝업에서 postMessage 수신
   * ----------------------------------*/
  useEffect(() => {
    function handleMessage(ev: MessageEvent) {
      if (!ev.data || typeof ev.data !== "object") return;
      if ((ev.data as any).type !== "naver-login-success") return;

      const profile = (ev.data as any).profile;

      const fakeUser = {
        userId: profile.id,
        nickname: profile.nickname ?? "네이버유저",
        level: 1,
        role: "USER" as const,
        oauthProvider: "naver" as const,
        email: profile.email ?? "unknown@naver.com",
      };

      const fakeToken = "dev-jwt-token-naver";
      login(fakeToken, fakeUser);
      // login() 내부에서 모달 자동 닫힘
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [login]);

  /* ------------------------------------
   *  Kakao 로그인
   * ----------------------------------*/
  async function handleKakaoLogin() {
    if (!kakaoReady) {
      alert(
        "카카오 SDK가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    const w = window as any;
    const Kakao = w.Kakao;

    if (!Kakao) {
      alert(
        "카카오 SDK가 로드되지 않았습니다. 새로고침 후 다시 시도해 주세요."
      );
      return;
    }

    if (!Kakao.Auth || typeof Kakao.Auth.login !== "function") {
      alert("카카오 로그인 기능을 사용할 수 없습니다.");
      return;
    }

    Kakao.Auth.login({
      scope: "profile_nickname account_email",
      success: async (authObj: any) => {
        try {
          const accessToken = authObj.access_token;
          console.log("Kakao accessToken:", accessToken);

          Kakao.API.request({
            url: "/v2/user/me",
            success: (res: any) => {
              const nickname = res.properties?.nickname;
              const email = res.kakao_account?.email;

              const fakeUser = {
                userId: "u_dev",
                nickname: nickname ?? "예빈",
                level: 1,
                role: "USER" as const,
                oauthProvider: "kakao" as const,
                email: email ?? "unknown@kakao.com",
              };

              const fakeToken = "dev-jwt-token-kakao";
              login(fakeToken, fakeUser);
              // login() 내부에서 모달 자동 닫힘
            },
            fail: (error: any) => {
              console.error("Kakao user info error:", error);
              alert("사용자 정보 조회 실패");
            },
          });
        } catch (e) {
          console.error(e);
          alert("로그인 중 오류가 발생했습니다.");
        }
      },
      fail(err: any) {
        console.error(err);
        alert("카카오 로그인 실패 또는 취소");
      },
    });
  }

  /* ------------------------------------
   *  Naver 로그인 (팝업 + 콜백 페이지 방식)
   * ----------------------------------*/
  async function handleNaverLogin() {
    if (!naverReady || !naverLoginRef.current) {
      alert("네이버 SDK가 아직 준비되지 않았습니다.");
      return;
    }
    naverLoginRef.current.authorize();
  }

  /* ------------------------------------
   *  Google 로그인 (OAuth implicit + id_token)
   * ----------------------------------*/
  function handleGoogleLogin() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
    const redirectUri =
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
      `${window.location.origin}/auth/google/callback`;

    const scope = encodeURIComponent("openid profile email");
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();

    sessionStorage.setItem("google_oauth_state", state);
    sessionStorage.setItem("google_oauth_nonce", nonce);

    const authUrl =
      "https://accounts.google.com/o/oauth2/v2/auth" +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token%20id_token` +
      `&scope=${scope}` +
      `&include_granted_scopes=true` +
      `&state=${encodeURIComponent(state)}` +
      `&nonce=${encodeURIComponent(nonce)}`;

    window.location.href = authUrl;
  }

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
      {/* 중앙 배 */}
      <Image
        src="/assets/ships/ship-1.png"
        alt="Ship"
        width={240}
        height={220}
        style={{
          position: "absolute",
          left: "55%",
          top: "63%",
          transform: "translate(-50%, -50%)",
        }}
        priority
      />

      {/* 섬 마커들 */}
      {islands.map((island) => (
        <IslandMarker key={island.id} island={island} />
      ))}

      {/* ✅ 로그인 모달: TopNav의 LOGIN 클릭 → AuthContext.openLoginModal() → 여기서 열림 */}
      {loginModalOpen && !isLoggedIn && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
          onClick={() => closeLoginModal()}
        >
          {/* 보드 배경 */}
          <div
            style={{
              width: 680,
              height: 560,
              backgroundImage: "url('/assets/backgrounds/main-login.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              boxSizing: "border-box",
              padding: "40px 80px 40px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 안쪽 콘텐츠 래퍼 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
              }}
            >
              <p
                className="retro-title text-center"
                style={{ marginTop: 20, marginBottom: 40 }}
              >
                소셜로 시작하기
              </p>

              {/* 카카오 */}
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  marginBottom: 16,
                }}
                onClick={handleKakaoLogin}
              >
                <Image
                  src="/assets/ui/kakao.png"
                  alt="카카오로 시작하기"
                  width={400}
                  height={90}
                />
              </button>

              {/* 네이버 */}
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  marginBottom: 16,
                }}
                onClick={handleNaverLogin}
              >
                <Image
                  src="/assets/ui/naver.png"
                  alt="네이버로 시작하기"
                  width={400}
                  height={90}
                />
              </button>

              {/* 구글 */}
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
                onClick={handleGoogleLogin}
              >
                <Image
                  src="/assets/ui/google.png"
                  alt="구글로 시작하기"
                  width={400}
                  height={90}
                />
              </button>

              {/* DEV 전용 ADMIN 로그인 버튼 (모달 안) */}
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  zIndex: 2100,
                }}
              >
                <DevAdminLoginButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
