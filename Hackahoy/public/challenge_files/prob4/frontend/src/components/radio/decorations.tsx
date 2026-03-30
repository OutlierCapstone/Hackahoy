import React from "react";
import styles from "./decorations.module.css";

// 상단 노브 (볼륨/채널 조절)
export function TopKnobs() {
    return (
        <div className={styles.knobsContainer}>
            <div className={styles.knobSmall}></div> {/* 볼륨 */}
            <div className={styles.knobBig}></div>   {/* 채널 */}
        </div>
    );
}

// 스피커 그릴
export function Speaker() {
    return (
        <div className={styles.speakerContainer}>
            <div className={styles.grid}></div>
        </div>
    );
}

// 모서리 나사
export function Screws() {
    return (
        <>
            <div className={`${styles.screw} ${styles.tl}`}>+</div>
            <div className={`${styles.screw} ${styles.tr}`}>+</div>
            <div className={`${styles.screw} ${styles.bl}`}>+</div>
            <div className={`${styles.screw} ${styles.br}`}>+</div>
        </>
    );
}