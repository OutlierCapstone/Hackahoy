// src/lib/api/islands.ts
import axios from 'axios';

const API_URL = 'http://localhost:4000';

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getIslands() {
  const response = await fetch(`${API_URL}/islands`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch islands');
  }

  return response.json();
}

export async function getIslandProblem(islandId: number) {
  const response = await fetch(`${API_URL}/islands/${islandId}/problem`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch island problems');
  }

  return response.json();
}

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
    {
      headers: getAuthHeader(),
    },
  );
  return response.data;
};
