import { useEffect, useState } from "react";

export interface SessionUser {
  id: string;
  name?: string;
  role: string;
}

export function useAuth() {
  const [authorizedUser, setAuthorizedUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedUser = localStorage.getItem("session_user");

      // 로그인 정보가 없으면 튕겨내기
      if (!storedUser) {
        window.location.href = "/login";
        return;
      }

      // 로그인 정보가 있으면 파싱 시도
      const parsedUser: SessionUser = JSON.parse(storedUser);
      setAuthorizedUser(parsedUser);

    } catch (error) {
      // JSON 파싱 에러가 나더라도 강제로 복구
      const rawUser = localStorage.getItem("session_user");
      if (rawUser) {
        setAuthorizedUser({ id: rawUser, role: "신입" });
      } else {
        window.location.href = "/login";
        return;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { authorizedUser, isLoading };
}