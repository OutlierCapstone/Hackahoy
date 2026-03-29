// src/apis/chat.api.ts

import type { ChatRequest, ChatResponse } from "@/types/chat";

const CHATBOT_SERVER_URL = process.env.NEXT_PUBLIC_CHATBOT_SERVER_URL || "http://localhost:5003";

/* FastAPI(챗봇 서버)의 /api/chat 엔드포인트에 요청을 보내는 함수 */
export async function askChatbot(question: string): Promise<string> {
  const body: ChatRequest = { question };

  const res = await fetch(`${CHATBOT_SERVER_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // 에러 처리: 상태코드 확인
    const text = await res.text();
    throw new Error(`Chatbot server error: ${res.status} ${text}`);
  }

  const data: ChatResponse = await res.json();
  return data.answer;
}
