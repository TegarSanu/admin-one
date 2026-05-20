"use client";

import MemberStorefront from "@/components/marketplace/MemberStorefront";

export default function PublicMarketplacePage() {
  return <MemberStorefront apiBase="/api/marketplace" />;
}
