"use client"

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/layout/container';
import Table from '@/components/table/table';
import Button from '@/components/button/button';
import styles from '@/app/page.module.css';

import { useAuth } from '@/hooks/auth/auth-check-hook';
import { useCargoTable } from '@/hooks/cargo/cargo-table-hook';

const TABLE_HEADERS = ['ID', '화물명', '수량', '소유자 권한', '현재 위치', '관리'];

function StorageContent() {
    const router = useRouter();
    const { authorizedUser, isLoading: isAuthLoading } = useAuth();
    const { tableData, userRole, isLoading } = useCargoTable('storage', authorizedUser);
    if (isAuthLoading || isLoading) {
        return <div className={styles.loading}>창고 문을 여는 중...</div>;
    }

    return (
        <Container>
            <div className={`${styles.cargosFrame} ${styles.storageFrame}`}>
                <div className={styles.cargosHeader}>
                    <h1>창고 물품 현황</h1>
                </div>

                <div className={styles.wideRows}>
                    <Table
                        headers={TABLE_HEADERS}
                        data={tableData}
                    />
                </div>

                <div className={styles.footerNav}>
                    <Button onClick={() => router.push('/')}>
                        돌아가기
                    </Button>
                </div>
            </div>
        </Container>
    );
}

export default function StoragePage() {
    return (
        <Suspense fallback={<div className={styles.loading}>로딩 중...</div>}>
            <StorageContent />
        </Suspense>
    );
}