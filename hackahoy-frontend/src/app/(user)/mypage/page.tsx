"use client";

import Image from "next/image";
import { useAuth } from "@/components/common/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./Mypage.module.css";
import axios from "axios";

type UserShape = {
  // AuthContext.user 쪽 구조 + 안전 fallback 포함
  userId?: string;         // JWT payload에서 확인된 값
  id?: string;             // 혹시 서버가 id로 주는 경우 대비
  nickname?: string;
  levelNum?: number;

  provider?: string;       // JWT payload에서 확인된 값 (naver/google/kakao)
  oauthProvider?: string;  // 기존 타입에 있던 값 대비
  email?: string;

  providerId?: string;     // (지금은 없음) 나중에 백엔드에서 내려주면 표시됨
};

export default function MyPage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth(); // ✅ refreshUser까지 가져오기

  // user 객체 안전 캐스팅
  const safeUser = useMemo<UserShape>(() => (user as any) ?? {}, [user]);

  const [nickname, setNickname] = useState("");

  const level = safeUser.levelNum ?? 1;

  const shipImgSrc = useMemo(() => {
    const shipNumber = level > 0 ? level : 1;
    return `/assets/ships/ship-${shipNumber}.png`;
  }, [level]);

  useEffect(() => {
    if (!user) return;
    setNickname(safeUser.nickname ?? "PLAYER");
  }, [user, safeUser.nickname]);

  // 비로그인 → 홈(MapView)
  useEffect(() => {
    if (user) return;
    router.replace("/");
  }, [user, router]);

  if (!user) {
    return <main className={styles.pageRoot} />;
  }

  // ✅ 실제 payload 기준으로 provider / id 표시
  const displayProvider = (
    safeUser.provider ??
    safeUser.oauthProvider ??
    "KAKAO"
  ).toUpperCase();

  const displayId =
    safeUser.providerId ?? // (있으면 우선)
    safeUser.email ??      // 이메일이 있으면 이메일
    safeUser.userId ??
    safeUser.userid ??     // ✅ 지금 JWT에 있는 값
    safeUser.id ??         // 혹시 id로 내려오는 경우
    "Unknown ID";

  const.toggleLogout = () => {
    logout();
    router.push("/");
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return alert("로그인이 필요합니다.");

      await axios.post(
        "http://52.78.240.6:4000/auth/update-nickname",
        { nickname },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ 저장 후 사용자 정보 재조회
      await refreshUser();

      alert("닉네임이 성공적으로 변경되었습니다!");
    } catch (error) {
      console.error("닉네임 수정 실패:", error);
      alert("닉네임 수정 중 오류가 발생했습니다.");
    }
  };

  const handleUnsubscribe = async () => {
    const ok = confirm(
      "정말 탈퇴하시겠습니까? 모든 풀이 기록이 삭제되며 복구할 수 없습니다."
    );
    if (!ok) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return alert("로그인이 필요합니다.");

      await axios.post(
        "http://52.78.240.6:4000/auth/unsubscribe",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("탈퇴 처리가 완료되었습니다. 이용해 주셔서 감사합니다.");
      toggleLogout();
    } catch (error) {
      console.error("탈퇴 처리 실패:", error);
      alert("탈퇴 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <main className={styles.pageRoot}>
      <div className={styles.card}>
        <div className={styles.innerRow}>
          {/* 왼쪽 패널 */}
          <section className={styles.leftPanel}>
            <div className={styles.avatarWrapper}>
              <Image
                src={shipImgSrc}
                alt="ship"
                width={88}
                height={88}
                priority
              />
            </div>
            <p className={styles.shipName}>{nickname}</p>
            <p className={styles.levelText}>LEVEL : {level}</p>
          </section>

          <div className={styles.divider} />

          {/* 오른쪽 패널 */}
          <section className={styles.rightPanel}>
            <div className={styles.field}>
              <p className={styles.fieldLabel}>NICKNAME</p>
              <input
                className={styles.input}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <p className={styles.fieldLabel}>SOCIAL LOGIN</p>
              <input
                className={`${styles.input} ${styles.inputReadOnly}`}
                value={displayProvider}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <p className={styles.fieldLabel}>ID</p>
              <input
                className={`${styles.input} ${styles.inputReadOnly}`}
                value={displayId}
                readOnly
              />
            </div>

            <div className={styles.buttonsRow}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={handleUnsubscribe}
              >
                <Image
                  src="/assets/ui/unsubscribe.png"
                  alt="UNSUBSCRIBE"
                  width={188}
                  height={60}
                />
              </button>

              <button
                type="button"
                className={styles.iconButton}
                onClick={handleSave}
              >
                <Image
                  src="/assets/ui/save.png"
                  alt="SAVE"
                  width={96}
                  height={60}
                />
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
