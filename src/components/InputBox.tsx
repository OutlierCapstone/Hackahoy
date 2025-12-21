// components/InputBox.tsx

"use client";

import { useState } from "react";
import styles from "@/components/InputBox.module.css";

type Props = {
  onSend: (text: string) => void;
  loading?: boolean;
};

export default function InputBox({ onSend, loading }: Props) {
  const [text, setText] = useState("");

  const send = async () => {
    if (!text.trim()) return;
    if (loading) return;

    const currentText = text;
    setText("");
    onSend(currentText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter") {
      e.preventDefault();
      send();
      console.log("Enter key pressed :", text);
    }
  };

  return (
    <div className={styles.container}>
      <input className={styles.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요"
        disabled={loading}
      />
      <button className={styles.button}
        onClick={send}
        disabled={loading}>
        {loading? "WAIT": "SEND"}
      </button>
    </div>
  );
}
