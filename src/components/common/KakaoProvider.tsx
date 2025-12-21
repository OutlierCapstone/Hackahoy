// src/components/common/KakaoProvider.tsx
"use client";

import { ReactNode, useEffect } from "react";
import Script from "next/script";

type Props = {
  children: ReactNode;
};

export default function KakaoProvider({ children }: Props) {
  useEffect(() => {
    const w = window as any;
    if (w.Kakao && !w.Kakao.isInitialized()) {
      w.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
      // console.log("Kakao initialized");
    }
  }, []);

  return (
    <>
      {/* onLoad 없이 Script만 넣기 */}
      <Script
        src="https://developers.kakao.com/sdk/js/kakao.min.js"
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
