import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RequestStatusBadge } from "@/components/aviation/RequestStatusBadge";
import { RequestDetailDialog } from "@/components/admin/RequestDetailDialog";
import { useAdminRequests, type AdminServiceRequest } from "@/lib/supabase-client-hooks";
import { useSettings } from "@/lib/settings-store";
import { formatDate } from "@/lib/utils";

export default function AdminRequests() {
  const { services } = useSettings();
  const { data: requests, refetch } = useAdminRequests();
  const [selected, setSelected] = useState<AdminServiceRequest | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Service Requests</h1>
        <p className="text-sm text-steel">Click a request to review, confirm an estimate, schedule, or update its status.</p>
      </div>

      <Card>
        <CardContent className="divide-y divide-ink/10 p-0">
          {requests.length === 0 ? (
            <p className="px-6 py-4 text-sm text-steel">No service requests yet.</p>
          ) : (
            requests.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => setSelected(r)}
                className="flex w-full flex-col gap-3 px-6 py-5 text-left transition-colors hover:bg-paperDim sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink">
                    {r.aircraft.tailNumber} — {r.aircraft.make} {r.aircraft.model}
                  </p>
                  <p className="text-sm text-steel">
                    {r.services.map((s) => services.find((sc) => sc.code === s)?.name ?? s).join(", ")}
                  </p>
                  <p className="text-xs text-steel2">
                    {r.clientName} · {r.airportLocation} · Submitted {formatDate(r.createdAt)}
                  </p>
                </div>
                <RequestStatusBadge status={r.status} />
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <RequestDetailDialog
        request={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onUpdated={() => {
          refetch();
          setSelected(null);
        }}
      />
    </div>
  );
}
