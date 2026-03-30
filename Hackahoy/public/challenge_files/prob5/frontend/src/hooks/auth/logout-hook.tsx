import { useRouter } from "next/navigation";

export function useLogout() {
  const router = useRouter();

  const logout = () => {
    if (!confirm("로그아웃 하시겠습니까?")) return;

    localStorage.removeItem("session_user");

    alert("로그아웃 되었습니다.");
    router.replace("/login");
  };

  return { logout };
}