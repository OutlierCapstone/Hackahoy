'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from '../admin.module.css';
import axios from 'axios';

interface Notification {
  id: number;
  message: string;
  createdAt: string; // ISO Date String
}

export default function AdminNotificationPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // 날짜를 26.02.05 12:33:00 형식으로 변환하는 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const y = String(date.getFullYear()).slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}.${m}.${d} ${h}:${min}:${s}`;
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          alert('관리자 권한이 필요합니다.');
          router.push('/auth/login');
          return;
        }

        const response = await axios.get('http://44.199.70.243:4000/admin/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(response.data);
      } catch (error) {
        console.error('알림 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [router]);

  return (
    <section className={styles.board}>
      <div className={styles.headRow}>
        <div className={styles.title}>Admin : 보안 알림 내역</div>
      </div>

      <div className={styles.table} style={{ minHeight: '400px' }}>
        {loading ? (
          <div className={styles.row}>데이터를 불러오는 중...</div>
        ) : notifications.length === 0 ? (
          <div className={styles.row}>차단된 내역이 없습니다.</div>
        ) : (
          notifications.map((notif) => {
            const fullDate = formatDate(notif.createdAt);
            const [datePart, timePart] = fullDate.split(' ');

            return (
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
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#888' }}>
                  {datePart}
                  <br />
                  {timePart}
                </div>
              </div>
            );
          })
        )}

        {/* 빈 줄 채우기 (최소 5줄 유지) */}
        {!loading && notifications.length < 5 &&
          Array.from({ length: 4 - notifications.length }).map((_, i) => (
            <div key={`empty-${i}`} className={styles.row}>
              &nbsp;
            </div>
          ))
        }
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