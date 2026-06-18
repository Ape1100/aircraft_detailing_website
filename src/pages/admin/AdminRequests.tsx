import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RequestStatusBadge } from "@/components/aviation/RequestStatusBadge";
import { MOCK_AIRCRAFT, MOCK_REQUESTS } from "@/lib/mock-data";
import { useSettings } from "@/lib/settings-store";
import { formatDate } from "@/lib/utils";
import type { RequestStatus } from "@/types";

const STATUS_OPTIONS: RequestStatus[] = [
  "requested",
  "quote_sent",
  "approved",
  "scheduled",
  "in_progress",
  "completed",
  "paid",
  "archived",
];

export default function AdminRequests() {
  const { services } = useSettings();
  const [statuses, setStatuses] = useState<Record<string, RequestStatus>>(
    Object.fromEntries(MOCK_REQUESTS.map((r) => [r.id, r.status]))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Service Requests</h1>
        <p className="text-sm text-steel">Update status as work moves through the pipeline.</p>
      </div>

      <Card>
        <CardContent className="divide-y divide-ink/10 p-0">
          {MOCK_REQUESTS.map((r) => {
            const aircraft = MOCK_AIRCRAFT.find((a) => a.id === r.aircraftId);
            const status = statuses[r.id];
            return (
              <div key={r.id} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-ink">{aircraft?.tailNumber} — {aircraft?.make} {aircraft?.model}</p>
                  <p className="text-sm text-steel">
                    {r.services.map((s) => services.find((sc) => sc.code === s)?.name ?? s).join(", ")}
                  </p>
                  <p className="text-xs text-steel2">{r.airportLocation} · Submitted {formatDate(r.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <RequestStatusBadge status={status} />
                  <Select
                    value={status}
                    onValueChange={(v) => setStatuses((s) => ({ ...s, [r.id]: v as RequestStatus }))}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
