import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RequestStatusBadge } from "@/components/aviation/RequestStatusBadge";
import { RequestDetailDialog } from "@/components/client/RequestDetailDialog";
import { useClientAircraft, useClientRequests } from "@/lib/supabase-client-hooks";
import { useSettings } from "@/lib/settings-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ServiceRequest } from "@/types";

export default function ServiceRequests() {
  const { services } = useSettings();
  const { data: aircraft } = useClientAircraft();
  const { data: requests } = useClientRequests();
  const [selected, setSelected] = useState<ServiceRequest | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Service Requests</h1>
          <p className="text-sm text-steel">Track every request from submission through payment.</p>
        </div>
        <Button asChild variant="amber">
          <Link to="/portal/requests/new">
            <Plus className="h-4 w-4" /> New Request
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="divide-y divide-ink/10 p-0">
          {requests.map((r) => {
            const aircraftItem = aircraft.find((a) => a.id === r.aircraftId);
            return (
              <button
                type="button"
                key={r.id}
                onClick={() => setSelected(r)}
                className="flex w-full flex-col gap-3 px-6 py-5 text-left transition-colors hover:bg-paperDim sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink">{aircraftItem?.tailNumber} — {aircraftItem?.make} {aircraftItem?.model}</p>
                  <p className="text-sm text-steel">
                    {r.services.map((s) => services.find((sc) => sc.code === s)?.name ?? s).join(", ")}
                  </p>
                  <p className="text-xs text-steel2">Submitted {formatDate(r.createdAt)}</p>
                </div>
                <div className="flex items-center gap-4">
                  {r.estimateLow && (
                    <p className="text-sm text-steel">
                      {formatCurrency(r.estimateLow)}–{formatCurrency(r.estimateHigh ?? r.estimateLow)}
                    </p>
                  )}
                  <RequestStatusBadge status={r.status} />
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <RequestDetailDialog
        request={selected}
        aircraft={selected ? aircraft.find((a) => a.id === selected.aircraftId) ?? null : null}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
