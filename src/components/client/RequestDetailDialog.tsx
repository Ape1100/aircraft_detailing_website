import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RequestStatusBadge } from "@/components/aviation/RequestStatusBadge";
import { PhotoGallery } from "@/components/aviation/PhotoGallery";
import type { Aircraft, ServiceRequest } from "@/types";
import { useSettings } from "@/lib/settings-store";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ClientRequestDetailDialogProps {
  request: ServiceRequest | null;
  aircraft: Aircraft | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestDetailDialog({ request, aircraft, open, onOpenChange }: ClientRequestDetailDialogProps) {
  const { services } = useSettings();

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {aircraft ? `${aircraft.tailNumber} — ${aircraft.make} ${aircraft.model}` : "Service request"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-steel">Submitted {formatDate(request.createdAt)}</p>
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
              <p className="text-xs uppercase tracking-wide text-steel2">Scheduled date</p>
              <p className="text-ink">{request.scheduledDate ? formatDate(request.scheduledDate) : "—"}</p>
            </div>
          </div>

          {request.estimateLow != null && (
            <div>
              <p className="text-xs uppercase tracking-wide text-steel2">Estimate</p>
              <p className="text-ink">
                {formatCurrency(request.estimateLow)}–{formatCurrency(request.estimateHigh ?? request.estimateLow)}
              </p>
            </div>
          )}

          {request.notes && (
            <div>
              <p className="text-xs uppercase tracking-wide text-steel2">Your notes</p>
              <p className="text-sm text-ink">{request.notes}</p>
            </div>
          )}

          <PhotoGallery requestId={request.id} ownerId={request.clientId} initialCount={request.photoCount ?? 0} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
