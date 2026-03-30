import React from "react";
import styles from "./default-button.module.css";

interface ButtonProps {
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "danger";
    onClick?: () => void;
    children: React.ReactNode;
    disabled?: boolean;
}

export default function DefaultButton({
    type = "button",
    variant = "primary",
    onClick,
    children,
    disabled = false
}: Readonly<ButtonProps>): React.JSX.Element {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${styles.button} ${styles[variant]}`}
        >
            {children}
        </button>
    );
}