import React from "react";
import styles from "@/components/radio/entity.module.css";
import Antenna from "./antenna";
import { TopKnobs, Screws } from "./decorations";

interface EntityProps {
    children: React.ReactNode;
}

export default function Entity({
    children
}: Readonly<EntityProps>): React.JSX.Element {
    return (
        <div className={styles.radioBody}>
            <Antenna />
            <TopKnobs />
            <Screws />
            <div className={styles.sideBtnTop}></div>
            <div className={styles.sideBtnBottom}></div>
            {children}
        </div>
    );
}