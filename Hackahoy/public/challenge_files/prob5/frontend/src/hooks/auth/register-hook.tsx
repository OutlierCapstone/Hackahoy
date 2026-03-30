import { useState } from "react";
import { useRouter } from "next/navigation";

export function useRegister() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pwd, setPwd] = useState("");

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pwd }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "회원가입 실패");
      }

      alert("회원가입이 완료되었습니다.");
      router.push("/login"); 

    } catch (err: any) {
      alert(err.message);
    }
  };

  return { id, setId, pwd, setPwd, submitRegister};
}