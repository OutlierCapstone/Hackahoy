import React, { ReactNode } from 'react';
import styels from './table.module.css';

export interface TableRowData {
    [key: string]: ReactNode;
}

interface TableProps {
    caption?: string; // 테이블 제목
    headers: string[]; // 열 이름
    data: TableRowData[]; // 테이블 데이터
}

export default function Table({
    caption, headers, data
}: Readonly<TableProps>): React.JSX.Element {
    const isEmpty = data.length === 0;
    const dataKeys = data.length > 0 ? Object.keys(data[0]) : [];

    return (
        <table className={styels.table}>
            {caption && (
                <caption className={styels.caption}> {caption} </caption>
            )}
            <thead className={styels.header}>
                <tr>
                    {headers.map((header, index) => (
                        <th
                            key={index}
                            scope="col"
                        >
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody className={styels.body}>
                {isEmpty ? (
                    <tr>
                        <td colSpan={headers.length} style={{ textAlign: 'center' }}>
                            데이터가 없습니다.
                        </td>
                    </tr>
                ) : (
                    data.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                        >
                            {
                                dataKeys.map((key, colIndex) => (
                                    <td key={colIndex}>
                                        {row[key]}
                                    </td>
                                ))
                            }
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    )
}