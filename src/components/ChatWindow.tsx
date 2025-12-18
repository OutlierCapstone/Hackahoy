// components/ChatWindow.tsx

"use client";

import { Message } from "@/types/chat";
import styles from "@/components/ChatWindow.module.css";
import { useEffect, useRef } from "react";
import pirateImage from "@/assets/images/pirate.png";

type Props = {
  messages: Message[];
};


export default function ChatWindow({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

  return (
    <div className={styles.container}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`${styles.row} ${
            msg.role === "user" ? styles.user : styles.bot
          }`}
        >
          {msg.role === "bot" && (
            <img src={pirateImage.src}
              className={styles.pirateImage}
            />
          )}
          <div className={styles.bubble}>{msg.text}</div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}