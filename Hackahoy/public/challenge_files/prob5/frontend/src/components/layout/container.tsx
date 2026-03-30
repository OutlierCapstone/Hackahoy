import React from 'react';
import styles from './container.module.css'

interface ContainerProps {
    children: React.ReactNode;
}

export default function Container({
    children,
}: Readonly<ContainerProps>) {
    return (
        <div className={styles.outer}>
            <div className={styles.inner}>
                {children}
            </div>
        </div>
    );
}