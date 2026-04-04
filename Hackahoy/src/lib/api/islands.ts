// src/lib/api/islands.ts
import axios from 'axios';

const API_URL = 'http://44.199.70.243:4000';

const getAuthHeader = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getIslands() {
  const response = await fetch(`${API_URL}/islands`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch islands');
  return response.json();
}

/** * 🚨 수정 포인트: 
 * 1. 이름을 getIslandProblems (복수형)로 변경
 * 2. 백엔드 엔드포인트를 우리가 만든 /problem/user-list 로 변경
 * 3. 인증 헤더 추가 (로그인한 유저만 풀어야 하니까요!)
 */
export const getIslandProblems = async (islandId: number) => {
  const response = await axios.get(`${API_URL}/problem/user-list`, {
    params: { islandId }, // ?islandId=2 형태로 전달됨
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getProblem = async (problemId: number) => {
  const response = await axios.get(`${API_URL}/problem/${problemId}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const submitFlag = async (problemId: number, flag: string) => {
  const response = await axios.post(
    `${API_URL}/problem/${problemId}/submit`,
    { flag },
    { headers: getAuthHeader() },
  );
  return response.data;
};