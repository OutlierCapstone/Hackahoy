'use client';

import Image from 'next/image';
import { useAuth } from '@/components/common/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import styles from './Mypage.module.css';
import axios from 'axios';
import { API_BASE_URL } from "@/lib/api/config";

type UserShape = {
  id?: string;
  nickname?: string;
  levelNum?: number;
  provider?: string;
  providerId?: string;
};

export default function MyPage() {
  const router = useRouter();
  const { user, logout, authReady, refreshUser } = useAuth();

  const safeUser = useMemo(() => (user as any) ?? {}, [user]);

  const [nickname, setNickname] = useState('');
  const [nicknameFeedback, setNicknameFeedback] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);
  const level = safeUser.levelNum ?? 1;

  const shipImgSrc = useMemo(() => {
    const shipNumber = level > 0 ? level : 1;
    return `/assets/ships/ship-${shipNumber}.png`;
  }, [level]);

  useEffect(() => {
    if (!user) return;
    setNickname(safeUser.nickname ?? 'PLAYER');
  }, [user, safeUser.nickname]);

  // authReady 를 기다린다. 세션 복구가 끝나기 전의 user=null 은 "비로그인" 이 아니라
  // "아직 모름" 이라, 이걸 안 보면 새로고침·직접 진입이 매번 홈으로 튕긴다.
  useEffect(() => {
    if (!authReady || user) return;
    router.replace('/');
  }, [authReady, user, router]);

  if (!user) {
    return <main className={styles.pageRoot} />;
  }

  const provider = (safeUser.oauthProvider ?? 'kakao').toUpperCase();
  const email = safeUser.email ?? '';
  const displayProvider = (safeUser.provider ?? 'KAKAO').toUpperCase();
  const displayId = safeUser.providerId ?? 'Unknown ID';

  const handleSave = async () => {
    const normalizedNickname = nickname.trim();
    if (!normalizedNickname) {
      setNicknameFeedback({
        type: 'error',
        message: '닉네임을 입력해 주세요.',
      });
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/auth/update-nickname`,
        { nickname: normalizedNickname },
        { withCredentials: true },
      );
      setNickname(normalizedNickname);
      await refreshUser();
      setNicknameFeedback({
        type: 'success',
        message: '닉네임이 변경되었습니다.',
      });
    } catch (error) {
      console.error('닉네임 수정 실패:', error);
      setNicknameFeedback({
        type: 'error',
        message: '닉네임을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      });
    }
  };

  const handleUnsubscribe = async () => {
    const ok = confirm(
      '정말 탈퇴하시겠습니까? 모든 풀이 기록이 삭제되며 복구할 수 없습니다.',
    );
    if (!ok) return;

    try {
      await axios.post(
        `${API_BASE_URL}/auth/unsubscribe`,
        {},
        { withCredentials: true },
      );

      alert('탈퇴 처리가 완료되었습니다. 이용해 주셔서 감사합니다.');

      await logout();
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
              className={`pixel-btn ${styles.challengeButton}`}
              onClick={() => router.push('/challengelist')}
            >
              CHALLENGE LIST
            </button>
          </section>

          <div className={styles.divider} />

          {/* 오른쪽 패널 */}
          <section className={styles.rightPanel}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="nickname">
                NICKNAME
              </label>
              <input
                id="nickname"
                className={styles.input}
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setNicknameFeedback(null);
                }}
                maxLength={20}
                required
                aria-describedby="nickname-feedback"
              />
              <p
                id="nickname-feedback"
                className={
                  nicknameFeedback?.type === 'error'
                    ? styles.fieldError
                    : styles.fieldSuccess
                }
                role={nicknameFeedback?.type === 'error' ? 'alert' : 'status'}
                aria-live="polite"
              >
                {nicknameFeedback?.message ?? '1~20자로 입력해 주세요.'}
              </p>
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
                className="pixel-btn pixel-btn--danger"
                onClick={handleUnsubscribe}
              >
                회원 탈퇴
              </button>

              <button
                type="button"
                className="pixel-btn"
                onClick={handleSave}
                disabled={!nickname.trim()}
                aria-label="닉네임 저장"
              >
                SAVE
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
