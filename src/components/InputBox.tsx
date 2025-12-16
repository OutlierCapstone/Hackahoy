"use client";

import { useState } from "react";

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
    <div style={{ display: "flex", gap: "10px", padding: "10px" }}>
      <input
        type="text"
        style={{ flex: 1, padding: "10px" }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요"
      />
      <button onClick={send}>
        SEND
      </button>
    </div>
  );
}
