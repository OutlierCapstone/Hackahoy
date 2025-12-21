// src/hooks/useChat.ts

"use client";

import { useState } from "react";
import { Message } from "@/types/chat";
import { askChatbot } from "@/services/chat.api";

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = { // 사용자가 보낸 메시지
            id: Date.now().toString(),
            role: "user",
            text,
        };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try { // 챗봇 서버에 질문을 보내고 답변을 받음
            const answer = await askChatbot(text);

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "bot",
                text: answer,
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (error){
            console.error("Error communicating with chatbot:", error);
            const errorMsg: Message = {
                id: (Date.now() + 2).toString(),
                role: "bot",
                text: "죄송합니다. 챗봇과의 통신 중 오류가 발생했습니다.",
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return { messages, isLoading, sendMessage };
};