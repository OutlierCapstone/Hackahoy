// app/page.tsx

"use client";

import { useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import InputBox from "@/components/InputBox";
import { Message } from "@/types/chat";

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);

  return (
    <div>
      {/* 1. ChatWindow에 messages prop 전달 */}
      <ChatWindow messages={messages} /> 
      {/* 2. InputBox에 onSend prop 전달 */}
      <InputBox
        onSend={(text) => {
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: "user", text },
          ]);
        }}
      />
    </div>
  );
}