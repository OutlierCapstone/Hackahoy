import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const [authorizedUser, setAuthorizedUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. 로컬 스토리지 확인
    const storedUser = localStorage.getItem("session_user");

    if (!storedUser) {
      // 2. 로그인 안 했으면 튕겨내기
      router.replace("/login");
    } else {
      // 3. 로그인 했으면 유저 ID 저장
      setAuthorizedUser(storedUser);
      setIsLoading(false);
    }
  }, [router]);

  return { authorizedUser, isLoading };
}