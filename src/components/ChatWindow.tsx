// components/ChatWindow.tsx

"use client";

import { Message } from "@/types/chat";
import styles from "@/components/ChatWindow.module.css";
import { useEffect, useRef } from "react";
import pirateImage from "@/assets/images/pirate.png";

type Props = {
  messages: Message[];
  loading?: boolean;
};


export default function ChatWindow({ messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages, loading]);

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

      {loading && (
        <div className={`${styles.row} ${styles.bot}`}>
          <img src={pirateImage.src} className={styles.pirateImage} />
          <div className={`${styles.bubble} ${styles.typingBubble}`}>
            <span className={styles.dot}>•</span>
            <span className={styles.dot}>•</span>
            <span className={styles.dot}>•</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}