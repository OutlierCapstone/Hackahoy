"use client"

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Container from '@/components/layout/container'; 
import Table from '@/components/table/table';
import styles from './page.module.css'; 

// 커스텀 훅 import
import { useAuth } from '@/hooks/use/auth-check-hook';
import { useFormCheckedButton } from '@/hooks/form/checked-button-hook';
import { useLogout } from '@/hooks/use/logout-hook';
import { useIdRedirect } from '@/hooks/use/id-redirect-hook';

const TABLE_HEADERS = ['', '임무 (Task)', '상태 (Status)'];

function MissionContent() {
    const searchParams = useSearchParams();

    const { authorizedUser, isLoading } = useAuth();
    useIdRedirect(authorizedUser, isLoading);

    const { tableData } = useFormCheckedButton(authorizedUser);
    const { logout } = useLogout();

    return (
        <Container>
            <div className={styles.missionFrame}>
                <button onClick={logout} className={styles.logoutLink}>
                    로그아웃
                </button>
                <div className={styles.missionHeader}>
                    <h1>임무 목록 (Mission List)</h1>
                </div>
                <Table
                    headers={TABLE_HEADERS}
                    data={tableData} 
                />
            </div>
        </Container>
    );
}

export default function MissionListPage() {
    return (
        <Suspense fallback={<div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>페이지 로딩 중...</div>}>
            <MissionContent />
        </Suspense>
    );
}