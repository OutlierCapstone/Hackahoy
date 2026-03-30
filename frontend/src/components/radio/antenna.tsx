import React from "react";
import styles from "./antenna.module.css";

export default function Antenna() {
    return (
        <div className={styles.antennaWrapper}>
            <div className={styles.antennaPole}></div>
            <div className={styles.antennaBase}></div>
        </div>
    );
}