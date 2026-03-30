"use client"

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/layout/container';
import Table from '@/components/table/table';
import Button from '@/components/button/button';
import styles from './page.module.css';

import { useAuth } from '@/hooks/auth/auth-check-hook';
import { useLogout } from '@/hooks/auth/logout-hook';
import { useCargoTable } from '@/hooks/cargo/cargo-table-hook';

const TABLE_HEADERS = ['ID', '화물명', '수량', '소유자 권한', '현재 위치', '관리']

function CargoContent() {
    const router = useRouter();
    const { authorizedUser, isLoading } = useAuth();
    const { logout } = useLogout();

    const { tableData } = useCargoTable('main', authorizedUser);

    if (isLoading || !authorizedUser) {
        return <div className={styles.loading}>해적선 탑승 명부 확인 중...</div>;
    }

    return (
        <Container>
            <div className={styles.cargosFrame}>
                <div className={styles.roleDisplay}>
                    접속자 권한: {authorizedUser?.role || '알 수 없음'}
                </div>

                <button onClick={logout} className={styles.logoutLink}>
                    로그아웃
                </button>

                <div className={styles.cargosHeader}>
                    <h1>화물 선적 현황</h1>
                </div>

                <div className={styles.wideRows}>
                    <Table
                        headers={TABLE_HEADERS}
                        data={tableData}
                    />
                </div>

                <div className={styles.footerNav}>
                    <Button onClick={() => router.push('/storage')}>
                        창고로 이동
                    </Button>
                </div>
            </div>
        </Container>
    );
}

export default function CargoListPage() {
    return (
        <Suspense fallback={<div className={styles.loading}>로딩 중...</div>}>
            <CargoContent />
        </Suspense>
    );
}