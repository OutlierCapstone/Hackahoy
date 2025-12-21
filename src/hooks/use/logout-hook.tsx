import { useRouter } from "next/navigation";

export function useLogout() {
  const router = useRouter();

  const logout = () => {
    // 1. 사용자 확인 
    if (!confirm("로그아웃 하시겠습니까?")) return;

    // 2. 저장된 세션 정보 삭제
    localStorage.removeItem("session_user");

    // 3. 로그인 페이지로 이동
    alert("로그아웃 되었습니다.");
    router.replace("/login");
  };

  return { logout };
}