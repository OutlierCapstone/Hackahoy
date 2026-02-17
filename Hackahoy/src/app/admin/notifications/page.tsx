'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from '../admin.module.css'; // 기존 어드민 스타일 재활용

interface Notification {
  id: number;
  message: string;
  createdAt: string;
}

export default function AdminNotificationPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([
    // 예시 데이터 (실제로는 API에서 불러와야 함)
    {
      id: 1,
      message: 'User "가나다" has been automatically banned.',
      createdAt: '26.02.05 12:33:00',
    },
  ]);

  // 페이지 진입 시 관리자 권한 체크 (예시)
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('관리자 권한이 필요합니다.');
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <section className={styles.board}>
      <div className={styles.headRow}>
        <div className={styles.title}>Admin : 아미르님</div>
      </div>

      <div className={styles.table} style={{ minHeight: '300px' }}>
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={styles.row}
            style={{ justifyContent: 'space-between', padding: '10px 20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'red' }}>🚨</span>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {notif.message}
              </span>
            </div>
            <div
              style={{ textAlign: 'right', fontSize: '12px', color: '#888' }}
            >
              {notif.createdAt.split(' ')[0]}
              <br />
              {notif.createdAt.split(' ')[1]}
            </div>
          </div>
        ))}

        {/* 빈 줄 채우기 (디자인 유지용) */}
        {Array.from({ length: 5 - notifications.length }).map((_, i) => (
          <div key={`empty-${i}`} className={styles.row}>
            &nbsp;
          </div>
        ))}
      </div>

      <div className={styles.footer} style={{ justifyContent: 'center' }}>
        <div className={styles.pager}>
          <button className={`${styles.pagerIconBtn} ${styles.pagerLeft}`} />
          <button className={`${styles.pagerIconBtn} ${styles.pagerRight}`} />
        </div>

        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.back()}
          style={{
            position: 'absolute',
            right: '20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Image src="/assets/ui/back.png" alt="BACK" width={100} height={50} />
        </button>
      </div>
    </section>
  );
}
