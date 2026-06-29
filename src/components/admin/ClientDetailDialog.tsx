import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RequestStatusBadge } from "@/components/aviation/RequestStatusBadge";
import { NNumberPlate } from "@/components/aviation/NNumberPlate";
import { useAdminClientDetail, type AdminClient } from "@/lib/supabase-client-hooks";
import { useSettings } from "@/lib/settings-store";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ClientDetailDialogProps {
  client: AdminClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDetailDialog({ client, open, onOpenChange }: ClientDetailDialogProps) {
  const { services } = useSettings();
  const { aircraft, requests, loading } = useAdminClientDetail(client?.id ?? null);

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{client.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-steel2">Contact information</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-steel2">Email</p>
                <p className="text-ink">{client.email}</p>
              </div>
              <div>
                <p className="text-xs text-steel2">Phone</p>
                <p className="text-ink">{client.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-steel2">Company</p>
                <p className="text-ink">{client.company || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-steel2">Aircraft on file</p>
                <p className="text-ink">{client.aircraftCount}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-steel">Loading…</p>
          ) : (
            <>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-steel2">Aircraft</p>
                {aircraft.length === 0 ? (
                  <p className="text-sm text-steel">No aircraft on file.</p>
                ) : (
                  <div className="space-y-2">
                    {aircraft.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-lg border border-ink/10 px-3.5 py-2.5">
                        <div className="flex items-center gap-3">
                          <NNumberPlate tailNumber={a.tailNumber} />
                          <p className="text-sm text-ink">{a.make} {a.model}</p>
                        </div>
                        <Badge variant="outline">{a.hangared ? "Hangared" : "Ramp"}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-steel2">
                  Services (had, scheduled, or pending)
                </p>
                {requests.length === 0 ? (
                  <p className="text-sm text-steel">No service requests yet.</p>
                ) : (
                  <div className="divide-y divide-ink/10 rounded-lg border border-ink/10">
                    {requests.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                        <div>
                          <p className="text-sm text-ink">
                            {r.aircraft.tailNumber} —{" "}
                            {r.services.map((s) => services.find((sc) => sc.code === s)?.name ?? s).join(", ")}
                          </p>
                          <p className="text-xs text-steel2">
                            {r.scheduledDate
                              ? `Scheduled ${formatDate(r.scheduledDate)}`
                              : `Submitted ${formatDate(r.createdAt)}`}
                            {r.estimateLow != null && r.estimateHigh != null
                              ? ` · ${formatCurrency(r.estimateLow)}–${formatCurrency(r.estimateHigh)}`
                              : ""}
                          </p>
                        </div>
                        <RequestStatusBadge status={r.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
