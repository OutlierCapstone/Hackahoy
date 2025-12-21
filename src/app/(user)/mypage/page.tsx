"use client";

import Image from "next/image";
import { useAuth } from "@/components/common/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./Mypage.module.css";

type UserShape = {
  userId?: string;
  nickname?: string;
  level?: number;
  oauthProvider?: string;
  email?: string;
};

export default function MyPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const safeUser = useMemo(() => (user as UserShape) ?? {}, [user]);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    if (!user) return;
    setNickname(safeUser.nickname ?? "PLAYER");
  }, [user, safeUser.nickname]);

  // 비로그인 → 홈(MapView)로 보내서 거기서 로그인 모달 사용
  useEffect(() => {
    if (user) return;
    router.replace("/");
  }, [user, router]);

  if (!user) {
    return <main className={styles.pageRoot} />;
  }

  const level = safeUser.level ?? 1;
  const provider = (safeUser.oauthProvider ?? "kakao").toUpperCase();
  const email = safeUser.email ?? "";

  const handleLogout = () => {
    logout(); // logout은 async가 아니므로 await 제거
    router.push("/");
  };

  const handleSave = () => {
    alert("데모: 닉네임 저장 (백엔드 연동 전)");
  };

  const handleUnsubscribe = () => {
    const ok = confirm("정말 탈퇴하시겠습니까? (데모)");
    if (!ok) return;
    alert("데모: 탈퇴 처리 후 로그아웃됩니다.");
    handleLogout();
  };

  return (
    <main className={styles.pageRoot}>
      {/* ❌ topBar 삭제: HOME/LOGOUT은 AppTopNav가 /mypage에서 자동 표시 */}

      {/* 중앙 카드 */}
      <div className={styles.card}>
        <div className={styles.innerRow}>
          {/* 왼쪽 */}
          <section className={styles.leftPanel}>
            <div className={styles.avatarWrapper}>
              <Image
                src="/assets/ships/ship-1.png"
                alt="ship"
                width={88}
                height={88}
              />
            </div>

            <p className={styles.shipName}>{nickname}</p>
            <p className={styles.levelText}>LEVEL : {level}</p>
          </section>

          <div className={styles.divider} />

          {/* 오른쪽 */}
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
                value={provider}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <p className={styles.fieldLabel}>ID</p>
              <input
                className={`${styles.input} ${styles.inputReadOnly}`}
                value={email}
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
                  height={80}
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
                  height={80}
                />
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
