import React from "react";
import styles from "./screen.module.css";

interface ScreenProps {
    children: React.ReactNode;
}

export default function Screen({
    children
}: Readonly<ScreenProps>): React.JSX.Element {
    return (
        <div className={styles.screenContainer}>
            <div className={styles.contentContainer}>
                {children}
            </div>
            <div className={styles.scanlines}></div>
        </div>
    );
}