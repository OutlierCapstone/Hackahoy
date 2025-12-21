// src/components/dev/DevAdminLoginButton.tsx
"use client";

import { useAuth } from "@/components/common/AuthContext";

export default function DevAdminLoginButton() {
  const { devLoginAsAdmin, user } = useAuth();

  if (user?.role === "ADMIN") {
    return <span>ADMIN 로그인됨</span>;
  }

  return <button onClick={devLoginAsAdmin}>DEV: Login as ADMIN</button>;
}
