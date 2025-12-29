"use client";

import Image from "next/image";
import { useAuth } from "@/components/common/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./Mypage.module.css";
import axios from "axios";

const API_BASE = "http://52.78.240.6:4000";

export default function MyPage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();

  const [nickname, setNickname] = useState("");

  useEffect(() => {
    if (!user) return;
    setNickname(user.nickname ?? "PLAYER");
  }, [user]);

  useEffect(() => {
    if (user) return;
    router.replace("/");
  }, [user, router]);

  if (!user) return <main className={styles.pageRoot} />;

  const level = user.levelNum ?? 1;

  const shipImgSrc = useMemo(() => {
    const shipNumber = level > 0 ? level : 1;
    return `/assets/ships/ship-${shipNumber}.png`;
  }, [level]);

  const displayProvider = user.provider?.toUpperCase() ?? "UNKNOWN";
  const displayId = user.providerId ?? "Unknown ID";

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return alert("로그인이 필요합니다.");

      await axios.post(
        `${API_BASE}/auth/update-nickname`,
        { nickname },
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
      if (!token) return;

      await axios.post(
        `${API_BASE}/auth/unsubscribe`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("탈퇴 처리가 완료되었습니다. 이용해 주셔서 감사합니다.");
      handleLogout();
    } catch (error) {
      console.error("탈퇴 처리 실패:", error);
      alert("탈퇴 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <main className={styles.pageRoot}>
      <div className={styles.card}>
        <div className={styles.innerRow}>
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
