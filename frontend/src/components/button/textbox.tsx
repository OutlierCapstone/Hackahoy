import React from "react";
import styles from "./textbox.module.css";

interface TextBoxProps {
    mode?: "input" | "output";
    value?: string;
    placeholder?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    readOnly?: boolean;
    children?: React.ReactNode;
}

export default function TextBox({
    mode = "input",
    value,
    placeholder,
    onChange,
    readOnly = false,
    children
}: Readonly<TextBoxProps>): React.JSX.Element {
    if (mode === "output") {
        return (
            <div className={styles.outputArea}>
                {children || value}
            </div>
        );
    }

    return (
        <div className={styles.inputWrapper}>
            <input
                type="text"
                className={styles.input}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                readOnly={readOnly}
                autoComplete="off"
            />
        </div>
    );
}