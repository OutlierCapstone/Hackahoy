// app/page.tsx

"use client";

import ChatWindow from "@/components/ChatWindow";
import InputBox from "@/components/InputBox";
import { useChat } from "@/hooks/useChat";

export default function Page() {
  const { messages, isLoading, sendMessage } = useChat();

  return (
    <div className = "page">
      <ChatWindow messages={messages} /> 
      <InputBox onSend={sendMessage} loading={isLoading} /> 
    </div>
  );
}