import { Badge } from "@/components/ui/badge";
import type { RequestStatus } from "@/types";

const CONFIG: Record<RequestStatus, { label: string; variant: "neutral" | "amber" | "green" | "ink" | "rust" }> = {
  requested: { label: "Requested", variant: "neutral" },
  quote_sent: { label: "Quote Sent", variant: "amber" },
  approved: { label: "Approved", variant: "amber" },
  scheduled: { label: "Scheduled", variant: "ink" },
  in_progress: { label: "In Progress", variant: "ink" },
  completed: { label: "Completed", variant: "green" },
  paid: { label: "Paid", variant: "green" },
  archived: { label: "Archived", variant: "neutral" },
  cancelled: { label: "Cancelled", variant: "rust" },
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const config = CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
