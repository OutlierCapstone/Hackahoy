// src/lib/api/admin.ts
import axios from "axios";

const API_URL = 'http://44.199.70.243:4000';

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
  const token = localStorage.getItem("accessToken");
  
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
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
}

export async function listUsers(q?: { keyword?: string }) {
  const response = await axios.get(`${API_URL}/admin/users`, {
    headers: getAuthHeader(),
    params: { q: q?.keyword }, 
  });
  return response.data; 
}

export async function setUserBanned(userId: string, banned: boolean) {
  const response = await axios.patch(
    `${API_URL}/admin/users/${userId}/ban`,
    { banned },
    { headers: getAuthHeader() }
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
    headers: getAuthHeader(),
    params: q, 
  });
  return response.data;
}