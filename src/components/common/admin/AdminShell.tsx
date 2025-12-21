"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";

export default function AdminShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace("/");
    else if (user.role !== "ADMIN") router.replace("/");
  }, [user, router]);

  if (!user || user.role !== "ADMIN") return null;
  return <>{children}</>;
}
