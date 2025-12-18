// components/InputBox.tsx

"use client";

import { useState } from "react";
import styles from "@/components/InputBox.module.css";

type Props = {
  onSend: (text: string) => void;
};

export default function InputBox({ onSend }: Props) {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
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
    <div className = {styles.container}>
      <input className={styles.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요"
      />
      <button className={styles.button} onClick={send}>SEND</button>
    </div>
  );
}
