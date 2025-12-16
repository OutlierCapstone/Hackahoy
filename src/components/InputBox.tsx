"use client";

import { useState } from "react";

type Props = {
  onSend: (text: string) => void;
};

export default function InputBox({ onSend }: Props) {
  const [text, setText] = useState("");

  return (
    <div style={{ display: "flex", gap: "10px", padding: "10px" }}>
      <input
        style={{ flex: 1, padding: "10px" }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="메시지를 입력하세요"
      />
      <button
        onClick={() => {
          onSend(text);
          setText("");
        }}
      >
        SEND
      </button>
    </div>
  );
}
