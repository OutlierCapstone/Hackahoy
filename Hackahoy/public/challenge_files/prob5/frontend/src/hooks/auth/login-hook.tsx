import { useState } from "react";
import { useRouter } from "next/navigation";

export function useLogin() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pwd, setPwd] = useState("");

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pwd }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      localStorage.setItem("session_user", JSON.stringify(data.user));
      router.push(`/`);

    } catch (err) {
      alert("로그인 중 오류가 발생했습니다.");
    }
  };

  return { id, setId, pwd, setPwd, submitLogin };
}