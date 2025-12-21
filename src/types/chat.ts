// src/types/chat.ts

export type Message = {
  id: string;
  role: "user" | "bot";
  text: string;
};

export type ChatRequest = {
  question: string;
};

export type ChatResponse = {
  answer: string;
};