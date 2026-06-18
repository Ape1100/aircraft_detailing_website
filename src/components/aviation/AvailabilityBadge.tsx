import { Badge } from "@/components/ui/badge";
import type { AvailabilityStatus } from "@/types";

const CONFIG: Record<AvailabilityStatus, { label: string; variant: "green" | "amber" | "neutral" | "outline" }> = {
  available: { label: "Available", variant: "green" },
  limited: { label: "Limited availability", variant: "amber" },
  coming_soon: { label: "Coming soon", variant: "neutral" },
  referral_only: { label: "Referral / coordination only", variant: "outline" },
};

export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const config = CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function availabilityNote(status: AvailabilityStatus): string | null {
  if (status === "available") return null;
  return "Available by evaluation, referral, or future rollout.";
}
