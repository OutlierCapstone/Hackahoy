// src/hooks/use-id-redirect.ts
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useIdRedirect(authorizedUser: string | null, isLoading: boolean) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. 아직 로딩 중이거나 로그인을 안 했으면 아무것도 안 함
    if (isLoading || !authorizedUser) return;

    // 2. 현재 URL에 'id' 파라미터가 있는지 확인
    const currentParamId = searchParams.get('id');

    // 3. 없으면 내 ID를 붙여서 주소 변경 (히스토리 안 남기게 replace 사용)
    if (!currentParamId) {
        router.replace(`/?id=${authorizedUser}`);
    }
  }, [authorizedUser, isLoading, router, searchParams]);
}