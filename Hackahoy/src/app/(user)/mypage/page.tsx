'use client';

import Image from 'next/image';
import { useAuth } from '@/components/common/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import styles from './Mypage.module.css';
import axios from 'axios';

type UserShape = {
  id?: string;
  nickname?: string;
  levelNum?: number;
  provider?: string;
  providerId?: string;
};

export default function MyPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const safeUser = useMemo(() => (user as any) ?? {}, [user]);

  const [nickname, setNickname] = useState('');
  const level = safeUser.levelNum ?? 1;

  const shipImgSrc = useMemo(() => {
    const shipNumber = level > 0 ? level : 1;
    return `/assets/ships/ship-${shipNumber}.png`;
  }, [level]);

  useEffect(() => {
    if (!user) return;
    setNickname(safeUser.nickname ?? 'PLAYER');
  }, [user, safeUser.nickname]);

  useEffect(() => {
    if (user) return;
    router.replace('/');
  }, [user, router]);

  if (!user) {
    return <main className={styles.pageRoot} />;
  }

  const provider = (safeUser.oauthProvider ?? 'kakao').toUpperCase();
  const email = safeUser.email ?? '';
  const displayProvider = (safeUser.provider ?? 'KAKAO').toUpperCase();
  const displayId = safeUser.providerId ?? 'Unknown ID';

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return alert('로그인이 필요합니다.');

      await axios.post(
        'http://44.199.70.243:4000/auth/update-nickname',
        { nickname: nickname },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      alert('닉네임이 성공적으로 변경되었습니다! 새로고침 시 반영됩니다.');
    } catch (error) {
      console.error('닉네임 수정 실패:', error);
      alert('닉네임 수정 중 오류가 발생했습니다.');
    }
  };

  const handleUnsubscribe = async () => {
    const ok = confirm(
      '정말 탈퇴하시겠습니까? 모든 풀이 기록이 삭제되며 복구할 수 없습니다.',
    );
    if (!ok) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      await axios.post(
        'http://44.199.70.243:4000/auth/unsubscribe',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      alert('탈퇴 처리가 완료되었습니다. 이용해 주셔서 감사합니다.');

      handleLogout();
    } catch (error) {
      console.error('탈퇴 처리 실패:', error);
      alert('탈퇴 처리 중 오류가 발생했습니다.');
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
            {/* 추가된 챌린지 리스트 버튼 */}
            <button
              type="button"
              className={styles.challengeButton}
              onClick={() => router.push('/challengelist')} // 챌린지 페이지 경로에 맞게 수정하세요
            >
              <Image
                src="/assets/ui/challengelist.png"
                alt="CHALLENGE LIST"
                width={180} // 이미지 크기에 맞춰 조절
                height={60}
              />
            </button>
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