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
};

export type AdminLog = {
  id: string;
  at: string; // ISO
  userId: string;
  action: "LOGIN" | "LOGOUT" | "VIEW_CHALLENGE" | "SUBMIT_FLAG" | "BAN_USER";
  target?: string;
  ip?: string;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let mockUsers: AdminUser[] = [
  { id: "u_1001", nickname: "PLAYER1", email: "p1@test.com", banned: false },
  { id: "u_1002", nickname: "PLAYER2", email: "p2@test.com", banned: true },
  {
    id: "u_1003",
    nickname: "ADMINLIKE",
    email: "admin@test.com",
    banned: false,
  },
];

let mockLogs: AdminLog[] = [
  {
    id: "l_1",
    at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    userId: "u_1001",
    action: "LOGIN",
    ip: "127.0.0.1",
  },
  {
    id: "l_2",
    at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    userId: "u_1001",
    action: "VIEW_CHALLENGE",
    target: "101",
  },
  {
    id: "l_3",
    at: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    userId: "u_1002",
    action: "SUBMIT_FLAG",
    target: "103",
  },
];

export async function createProblem(payload: AdminProblemCreatePayload) {
  await wait(300);
  // 실제 백엔드 붙이면 여기서 fetch로 교체
  return {
    id: `p_${Math.floor(Math.random() * 100000)}`,
    ...payload,
    createdAt: new Date().toISOString(),
  };
}

export async function listUsers(q?: { keyword?: string }) {
  await wait(200);
  const kw = (q?.keyword ?? "").trim().toLowerCase();
  if (!kw) return [...mockUsers];

  return mockUsers.filter((u) => {
    return (
      u.id.toLowerCase().includes(kw) ||
      u.nickname.toLowerCase().includes(kw) ||
      u.email.toLowerCase().includes(kw)
    );
  });
}

export async function setUserBanned(userId: string, banned: boolean) {
  await wait(200);
  mockUsers = mockUsers.map((u) => (u.id === userId ? { ...u, banned } : u));

  mockLogs = [
    {
      id: `l_${Date.now()}`,
      at: new Date().toISOString(),
      userId: "admin",
      action: "BAN_USER",
      target: `${userId}:${banned ? "BAN" : "UNBAN"}`,
    },
    ...mockLogs,
  ];

  const updated = mockUsers.find((u) => u.id === userId);
  if (!updated) throw new Error("User not found");
  return updated;
}

export async function listLogs(q?: {
  keyword?: string;
  action?: AdminLog["action"] | "ALL";
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}) {
  await wait(200);

  let rows = [...mockLogs];

  const kw = (q?.keyword ?? "").trim().toLowerCase();
  if (kw) {
    rows = rows.filter((l) => {
      const blob = `${l.userId} ${l.action} ${l.target ?? ""} ${
        l.ip ?? ""
      }`.toLowerCase();
      return blob.includes(kw);
    });
  }

  const action = q?.action ?? "ALL";
  if (action !== "ALL") rows = rows.filter((l) => l.action === action);

  const from = q?.from ? new Date(`${q.from}T00:00:00`) : null;
  const to = q?.to ? new Date(`${q.to}T23:59:59`) : null;
  if (from) rows = rows.filter((l) => new Date(l.at) >= from);
  if (to) rows = rows.filter((l) => new Date(l.at) <= to);

  return rows;
}
