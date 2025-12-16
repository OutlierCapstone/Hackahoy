"use client";

import { Message } from "@/types/chat";

type Props = {
  message: Message;
};

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        background: isUser ? "#d0f0ff" : "#ffd0f4",
        padding: "10px 15px",
        borderRadius: "15px",
        marginBottom: "10px",
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "70%",
      }}
    >
      {message.text}
    </div>
  );
}
