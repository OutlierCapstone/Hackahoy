"use client"

import React, { useState, useCallback, useEffect } from 'react';
import Checkbox from '@/components/button/checkbox';
import { type TableRowData } from '@/components/table/table';
import { useSearchParams, useRouter } from 'next/navigation';

// 테이블에서 관리할 데이터 구조
export interface ListItem {
    id: number;
    value: string; // task
    isChecked: boolean; // 체크박스 상태
    [key: string]: any;
}

export const useFormCheckedButton = (defaultUserId: string | null) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [items, setItems] = useState<ListItem[]>([]);

    // 백엔드 API 호출 
    useEffect(() => {
        if (!defaultUserId) return; 

        let ignore = false;

        const fetchId = searchParams.get('id') || defaultUserId;

        fetch(`/api/missions?userId=${fetchId}`)
            .then(async (res) => {
                if (ignore) return;
                if (res.status === 404) {
                    alert("존재하지 않는 사용자입니다.");
                    // 강제로 내 아이디로 이동
                    router.replace(`/?id=${defaultUserId}`);
                    return null;
                }
                
                if (!res.ok) throw new Error("데이터 로드 실패");
                return res.json();
            })
            .then((data) => {
                if (!ignore && data) {
                    setItems(data);
                }
            })
            .catch((err) => {
                if (!ignore) console.error(err);
            });
        return () => {
            ignore = true;
        };
    }, [searchParams, defaultUserId, router]);

    // 특정 항목의 isChecked 상태 토글
    const toggleCheck = useCallback((itemId: number) => {
        setItems(prevItems => 
            prevItems.map(item => 
                item.id === itemId 
                    ? { ...item, isChecked: !item.isChecked } 
                    : item
            )
        );
    }, []);

    // ListItems -> TableData 형식으로 변환
    const tableData: TableRowData[] = items.map(item => {
        const valueStyle: React.CSSProperties = {
            textDecoration: item.isChecked ? 'line-through' : 'none',
            color: item.isChecked ? 'var(--color-gray)' : 'var(--color-default)'
        }

        // checkbox component 생성 후 onChange랑 toggle 연결
        const checkboxComponent = (
            <Checkbox
                id={`item-${item.id}`}
                checked={item.isChecked}
                onChange={() => toggleCheck(item.id)}
            />
        );

        // check에 따른 status 처리
        const status = item.isChecked ? '완료' : '진행중';

        // TableRowData 형식 객체 반환
        return {
            select: checkboxComponent, 
            Value: <span style={valueStyle}>{item.value}</span>, 
            Status: <span>{status}</span>,
        };
    });

    return { tableData, items };
};