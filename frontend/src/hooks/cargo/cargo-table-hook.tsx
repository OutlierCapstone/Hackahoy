import React, { useState, useEffect } from 'react';
import { TableRowData } from '@/components/table/table';
import Button from '@/components/button/button';
import Textbox from '@/components/button/textbox';
import styles from '@/app/page.module.css';

const ROLE_WEIGHT: Record<string, number> = {
    '신입': 1,
    '보급관': 2,
    '선장': 3
};

export function useCargoTable(mode: 'main' | 'storage', authorizedUser?: any) {
    const [cargos, setCargos] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<string>(authorizedUser?.role || "");
    const [isLoading, setIsLoading] = useState(true);

    const [editTargetId, setEditTargetId] = useState<string | null>(null);
    const [newDestInput, setNewDestInput] = useState<string>("");

    // 1. 데이터 불러오기
    const fetchCargos = async () => {
        setIsLoading(true);
        try {
            if (mode === 'main') {
                const res = await fetch('/api/cargos', { cache: 'no-store' });
                if (res.ok) setCargos(await res.json());
                if (authorizedUser) setUserRole(authorizedUser.role);
            } else {
                const res = await fetch('/api/storage', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setCargos(data.cargos);
                    setUserRole(data.user.role);
                }
            }
        } catch (error) {
            console.error("데이터 로드 실패", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (mode === 'storage' || authorizedUser) {
            fetchCargos();
        }
    }, [mode, authorizedUser]);

    // 2. 이벤트 핸들러
    const handleEditClick = (cargo: any) => {
        const currentRole = userRole || authorizedUser?.role;
        const myWeight = ROLE_WEIGHT[currentRole] || 0;
        const cargoWeight = ROLE_WEIGHT[cargo.ownerRole] || 99;

        if (myWeight < cargoWeight) {
            alert("권한이 부족합니다. (상위 권한 화물은 수정 불가)");
            return;
        }
        setEditTargetId(cargo.id);
        setNewDestInput("");
    };

    const handleSave = async (cargoId: string) => {
        const finalDest = newDestInput.trim();
        if (!finalDest) {
            alert("이동할 위치를 입력해주세요!");
            return;
        }

        try {
            const res = await fetch('/api/cargos/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cargo_id: cargoId, destination: finalDest }),
            });

            if (res.ok) {
                alert("배송지 변경이 완료되었습니다.");
                setEditTargetId(null);
                if (mode === 'storage') window.location.reload();
                else fetchCargos();
            } else {
                alert("오류가 발생했습니다.");
            }
        } catch (error) {
            alert("서버와 통신 중 오류가 발생했습니다.");
        }
    };

    // 3. 테이블 데이터 매핑
    const tableData: TableRowData[] = cargos.map((cargo) => {
        const isEditing = editTargetId === cargo.id;
        const myWeight = ROLE_WEIGHT[userRole] || 0;
        const cargoWeight = ROLE_WEIGHT[cargo.ownerRole] || 99;
        const canEdit = myWeight >= cargoWeight;

        let nameContent = cargo.name;
        let actionContent;

        // 창고 모드이면서 플래그 아이템일 경우
        if (mode === 'storage' && cargo.isFlag) {
            nameContent = "hackahoy{Hijacked_The_Captain_Booty}";
            actionContent = <span style={{ color: '#d84315', fontWeight: 'bold' }}>탈취 성공</span>;
        } else {
            // 일반 아이템 처리
            if (isEditing) {
                actionContent = (
                    <div className={styles.actionButtonWrapper}>
                        <Button onClick={() => handleSave(cargo.id)}>확인</Button>
                        <Button onClick={() => setEditTargetId(null)}>취소</Button>
                    </div>
                );
            } else {
                actionContent = (
                    <div className={styles.actionButtonWrapper}>
                        <Button onClick={() => handleEditClick(cargo)}>수정</Button>
                    </div>
                );
            }
        }

        return {
            id: <span className={styles.cargoId}>{cargo.id}</span>,
            name: <span className={`${styles.cargoName} ${styles.nowrapText}`}>{nameContent}</span>,
            quantity: <span className={styles.nowrapText}>{cargo.quantity} 개</span>,
            owner: (
                <span className={`${styles.ownerBadge} ${canEdit ? styles.ownerMe : styles.ownerOther} ${styles.nowrapText}`}>
                    {cargo.ownerRole}
                </span>
            ),
            dest: isEditing ? (
                <div className={styles.inputWrapper}>
                    <Textbox
                        id={`dest-${cargo.id}`}
                        value={newDestInput}
                        onChange={(e) => setNewDestInput(e.target.value)}
                        placeholder="이동할 위치"
                    />
                </div>
            ) : (
                <span className={`${styles.destText} ${styles.nowrapText}`}>{cargo.destination}</span>
            ),
            action: actionContent
        };
    });

    return { tableData, userRole, isLoading };
}