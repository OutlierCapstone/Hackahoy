// src/lib/api/islands.ts
import axios from "axios";

const API_URL = "http://localhost:4000";

// 로컬 스토리지에서 토큰 가져오기
const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken"); // 저장된 토큰 키 확인
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getIslands() {
  const response = await fetch(`${API_URL}/islands`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch islands");
  }

  return response.json();
}

export async function getIslandProblems(islandId: number) {
  const response = await fetch(`${API_URL}/islands/${islandId}/problems`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch island problems");
  }

  return response.json();
}

export const getProblem = async (problemId: number) => {
  const response = await axios.get(`${API_URL}/problems/${problemId}`, {
    headers: getAuthHeader(), // 헤더에 토큰 추가
  });
  return response.data;
};

// 2. 정답 제출하기
export const submitFlag = async (problemId: number, flag: string) => {
  const response = await axios.post(
    `${API_URL}/problems/${problemId}/submit`,
    { flag },
    {
      headers: getAuthHeader(),
    }
  );
  return response.data;
};
