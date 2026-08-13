// src/lib/api/admin.ts
import axios from "axios";
import { API_BASE_URL } from "./config";

const API_URL = API_BASE_URL;

export type AdminProblemCreatePayload = {
  title: string;
  description: string;
  flag: string;
  serverUrl: string;
  backgroundKey: string;
};

export type AdminUser = {
  id: string;
  nickname: string;
  email: string;
  banned: boolean;
  role?: string; 
};

export type AdminLog = {
  id: string;
  at: string;
  userId: string;
  action: "LOGIN" | "LOGOUT" | "VIEW_CHALLENGE" | "SUBMIT_FLAG" | "BAN_USER";
  target?: string;
  ip?: string;
};

export async function createProblem(payload: any) {
  const response = await axios.post(
    `${API_URL}/admin/problems`, 
    {
      islandId: Number(payload.islandId),
      title: payload.title,
      description: payload.description,
      hint: payload.hint,
      correctFlag: payload.flag, 
      serverUrl: payload.serverUrl,
    },
    { withCredentials: true }
  );
  return response.data;
}

export async function listUsers(q?: { keyword?: string }) {
  const response = await axios.get(`${API_URL}/admin/users`, {
    withCredentials: true,
    params: { q: q?.keyword }, 
  });
  return response.data; 
}

export async function setUserBanned(userId: string, banned: boolean) {
  const response = await axios.patch(
    `${API_URL}/admin/users/${userId}/ban`,
    { banned },
    { withCredentials: true }
  );
  return response.data;
}

export async function listLogs(q?: {
  keyword?: string;
  action?: AdminLog["action"] | "ALL";
  from?: string;
  to?: string;
}) {
  const response = await axios.get(`${API_URL}/admin/logs`, {
    withCredentials: true,
    params: q, 
  });
  return response.data;
}
