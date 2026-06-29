import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequestStatusBadge } from "@/components/aviation/RequestStatusBadge";
import { getSignedPhotoUrl, type AdminServiceRequest, updateServiceRequest } from "@/lib/supabase-client-hooks";
import { supabase } from "@/lib/supabase-client";
import { useSettings } from "@/lib/settings-store";
import { formatDate } from "@/lib/utils";

interface RequestDetailDialogProps {
  request: AdminServiceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function RequestDetailDialog({ request, open, onOpenChange, onUpdated }: RequestDetailDialogProps) {
  const { services } = useSettings();
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [estimateLow, setEstimateLow] = useState("");
  const [estimateHigh, setEstimateHigh] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!request) return;
    setEstimateLow(request.estimateLow != null ? String(request.estimateLow) : "");
    setEstimateHigh(request.estimateHigh != null ? String(request.estimateHigh) : "");
    setScheduledDate(request.scheduledDate ?? "");
    setError(null);
    setPhotoUrls([]);

    if (request.photoCount > 0) {
      supabase
        .from("request_photos")
        .select("url")
        .eq("request_id", request.id)
        .then(async ({ data }) => {
          const urls = await Promise.all((data ?? []).map((row) => getSignedPhotoUrl(row.url)));
          setPhotoUrls(urls);
        });
    }
  }, [request]);

  if (!request) return null;

  async function runUpdate(fields: Parameters<typeof updateServiceRequest>[1]) {
    setBusy(true);
    setError(null);
    try {
      await updateServiceRequest(request!.id, fields);
      onUpdated();
    } catch (err) {
      setError((err as Error).message || "Failed to update request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {request.aircraft.tailNumber} — {request.aircraft.make} {request.aircraft.model}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-steel">{request.clientName}</p>
            <RequestStatusBadge status={request.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-steel2">Services</p>
              <p className="text-ink">
                {request.services.map((s) => services.find((sc) => sc.code === s)?.name ?? s).join(", ")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-steel2">Location</p>
              <p className="text-ink">{request.airportLocation}{request.fboName ? ` — ${request.fboName}` : ""}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-steel2">Preferred date</p>
              <p className="text-ink">{request.preferredDate ? formatDate(request.preferredDate) : "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-steel2">Submitted</p>
              <p className="text-ink">{formatDate(request.createdAt)}</p>
            </div>
          </div>

          {request.notes && (
            <div>
              <p className="text-xs uppercase tracking-wide text-steel2">Notes</p>
              <p className="text-sm text-ink">{request.notes}</p>
            </div>
          )}

          {request.photoCount > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-steel2">Photos</p>
              {photoUrls.length === 0 ? (
                <p className="text-sm text-steel">Loading photos…</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {photoUrls.map((url, idx) => (
                    <img key={idx} src={url} alt="" className="aspect-square rounded-lg object-cover" />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="estimate-low">Estimate low ($)</Label>
              <Input
                id="estimate-low"
                type="number"
                value={estimateLow}
                onChange={(e) => setEstimateLow(e.target.value)}
                disabled={request.status !== "requested"}
              />
            </div>
            <div>
              <Label htmlFor="estimate-high">Estimate high ($)</Label>
              <Input
                id="estimate-high"
                type="number"
                value={estimateHigh}
                onChange={(e) => setEstimateHigh(e.target.value)}
                disabled={request.status !== "requested"}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            {request.status === "requested" && (
              <Button
                variant="amber"
                disabled={busy}
                onClick={() =>
                  runUpdate({
                    estimateLow: estimateLow ? Number(estimateLow) : null,
                    estimateHigh: estimateHigh ? Number(estimateHigh) : null,
                    status: "approved",
                  })
                }
              >
                Confirm estimate
              </Button>
            )}

            {request.status === "approved" && (
              <>
                <Input
                  type="date"
                  className="w-auto"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
                <Button
                  variant="amber"
                  disabled={busy || !scheduledDate}
                  onClick={() => runUpdate({ scheduledDate, status: "scheduled" })}
                >
                  Schedule
                </Button>
              </>
            )}

            {request.status === "scheduled" && (
              <Button variant="outline" disabled={busy} onClick={() => runUpdate({ status: "in_progress" })}>
                Mark in progress
              </Button>
            )}

            {(request.status === "scheduled" || request.status === "in_progress") && (
              <>
                <Button variant="amber" disabled={busy} onClick={() => runUpdate({ status: "completed" })}>
                  Mark completed
                </Button>
                <Button
                  variant="outline"
                  className="text-rust"
                  disabled={busy}
                  onClick={() => runUpdate({ status: "cancelled" })}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
