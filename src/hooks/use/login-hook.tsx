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

      // 성공 시 로컬스토리지 저장 및 이동
      localStorage.setItem("session_user", id); 
      router.push(`/?id=${id}`);

    } catch (err) {
      alert("로그인 중 오류가 발생했습니다.");
    }
  };

  return { id, setId, pwd, setPwd, submitLogin };
}