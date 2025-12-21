import React from "react";
import styles from "./checkbox.module.css"

interface CheckboxProps {
    id: string;
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Checkbox({
    id, checked, onChange
}: Readonly<CheckboxProps>): React.JSX.Element {
    return (
        <input 
            type="checkbox"
            id = {id}
            checked = {checked}
            onChange = {onChange}
            className = {styles.checkbox}
        /> 
    );
}