// src/apis/chat.api.ts

import type { ChatRequest, ChatResponse } from "@/types/chat";

// 기본값은 빈 문자열 = 같은 오리진의 상대 경로.
// 페이지가 5003 에서 서빙되므로 /api/chat 은 5003 으로 나가고,
// nginx 가 이 요청을 수집한 뒤 3003(Next.js) -> rewrite -> 4003 으로 넘긴다.
// 절대 주소를 박으면 nginx 를 우회해 로그가 유실되므로 비워 두는 게 정상이다.
const CHATBOT_SERVER_URL = process.env.NEXT_PUBLIC_CHATBOT_SERVER_URL || "";

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
