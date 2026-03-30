import React from "react";
import styles from "./textbox.module.css"

interface TextboxProps {
    id: string;
    type?: "text" | "password";
    value: string;
    placeholder?: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Textbox({
    id, type = "text", value, placeholder, onChange
}: Readonly<TextboxProps>): React.JSX.Element {
    return (
        <div className={styles.inputWrapper}>
            <input 
                type={type}
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete="off"
                className={styles.inputField}
            /> 
        </div>
    );
}