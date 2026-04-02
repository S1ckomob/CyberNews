"use client";

import { SubscribeGate } from "@/components/subscribe-gate";

export function GatedPage({
  children,
  feature,
}: {
  children: React.ReactNode;
  feature: string;
}) {
  return (
    <SubscribeGate feature={feature}>
      {children}
    </SubscribeGate>
  );
}
