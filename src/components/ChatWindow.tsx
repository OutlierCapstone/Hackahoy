"use client";

import { Message } from "@/types/chat";
import Bubble from "@/components/Bubble";

type Props = {
  messages: Message[];
};

export default function ChatWindow({ messages }: Props) {
  return (
    <div
      style={{
        height: "500px",
        overflowY: "auto",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        background: "#ffe0f0",
      }}
    >
      {messages.map((m) => (
        <Bubble key={m.id} message={m} />
      ))}
    </div>
  );
}
