import React from "react";
import styles from "./button.module.css"

interface ButtonProps {
    type?: "button" | "submit" | "reset";
    onClick?: () => void;
    children: React.ReactNode;
    disabled?: boolean;
}

export default function Button({
    type = "button", onClick, children, disabled = false
}: Readonly<ButtonProps>): React.JSX.Element {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={styles.button}
        >
            {children}
        </button>
    );
}