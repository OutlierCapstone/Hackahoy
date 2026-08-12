"use client";
export const dynamic = "force-dynamic";

import OAuthCallback from "@/components/common/OAuthCallback";

export default function GoogleCallback() {
  return <OAuthCallback provider="google" />;
}
