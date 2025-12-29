// src/lib/api/admin.ts
import axios from "axios";

const API_URL = "http://localhost:4000";

// 토큰 가져오기
const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken");
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

// 1. 문제 생성 (실제 DB 저장)
export async function createProblem(payload: any) {
  const token = localStorage.getItem("accessToken");

  const response = await axios.post(
    `${API_URL}/admin/problems`,
    {
      islandId: Number(payload.islandId),
      title: payload.title,
      description: payload.description,
      hint: payload.hint,
      correctFlag: payload.flag, // 프론트 input의 flag를 correctFlag로 보냄
      serverUrl: payload.serverUrl,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
}

// 2. 유저 목록 조회 (실제 DB 유저들)
export async function listUsers(q?: { keyword?: string }) {
  const response = await axios.get(`${API_URL}/admin/users`, {
    headers: getAuthHeader(),
    params: { q: q?.keyword }, // 백엔드에서 검색어를 처리하도록 전달
  });
  return response.data; // 백엔드는 AdminUser[] 형태를 반환해야 함
}

// 3. 유저 차단 상태 변경
export async function setUserBanned(userId: string, banned: boolean) {
  const response = await axios.patch(
    `${API_URL}/admin/users/${userId}/ban`,
    { banned },
    { headers: getAuthHeader() }
  );
  return response.data;
}

// 4. 로그 목록 조회
export async function listLogs(q?: {
  keyword?: string;
  action?: AdminLog["action"] | "ALL";
  from?: string;
  to?: string;
}) {
  const response = await axios.get(`${API_URL}/admin/logs`, {
    headers: getAuthHeader(),
    params: q, // keyword, action, from, to를 쿼리 파라미터로 전송
  });
  return response.data;
}
