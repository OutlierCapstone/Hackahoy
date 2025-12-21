// Container.tsx (app/layout.tsx가 아닌 일반 컴포넌트일 경우)

import React from 'react';
import styles from './container.module.css'

interface ContainerProps {
    children: React.ReactNode;
}

export default function Container({ 
    children,
}: Readonly<ContainerProps>) {
    return (
        <div className = {styles.outer}>
            <div className = {styles.inner}>
              {children}
            </div>
        </div>
    );
}