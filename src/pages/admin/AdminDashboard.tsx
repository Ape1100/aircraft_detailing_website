import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "@/components/aviation/RequestStatusBadge";
import { RequestDetailDialog } from "@/components/admin/RequestDetailDialog";
import { useAdminClients, useAdminRequests, type AdminServiceRequest } from "@/lib/supabase-client-hooks";
import { useSettings } from "@/lib/settings-store";
import { formatDate } from "@/lib/utils";

export default function AdminDashboard() {
  const { onboarding, dismissSetupTour } = useSettings();
  const { data: clients } = useAdminClients();
  const { data: requests, refetch } = useAdminRequests();
  const [selected, setSelected] = useState<AdminServiceRequest | null>(null);
  const aircraftOnFile = clients.reduce((sum, c) => sum + c.aircraftCount, 0);
  const openRequests = requests.filter((r) => !["completed", "paid", "archived", "cancelled"].includes(r.status));
  const showTourBanner = !onboarding.setupCompleted && !onboarding.tourDismissed;

  return (
    <div className="space-y-8">
      {showTourBanner && (
        <div className="flex flex-col gap-4 rounded-xl border border-amber/30 bg-amber/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amberDark" />
            <div>
              <p className="font-display text-base font-semibold text-ink">Take a 2-minute setup tour</p>
              <p className="mt-0.5 text-sm text-steel">
                Personalize your business name, contact info, logo, and site background so the app feels like yours.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="amber" size="sm">
              <Link to="/admin/setup">Start setup</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={dismissSetupTour} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Operations Dashboard</h1>
        <p className="text-sm text-steel">An overview of clients, requests, and scheduling.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-4">
        <Card>
          <CardHeader><CardDescription>Clients</CardDescription><CardTitle className="text-3xl">{clients.length}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader><CardDescription>Aircraft on file</CardDescription><CardTitle className="text-3xl">{aircraftOnFile}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader><CardDescription>Open requests</CardDescription><CardTitle className="text-3xl">{openRequests.length}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader><CardDescription>Quotes pending</CardDescription><CardTitle className="text-3xl">{requests.filter((r) => r.status === "quote_sent").length}</CardTitle></CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent requests</CardTitle></CardHeader>
        <CardContent className="divide-y divide-ink/10 p-0">
          {requests.length === 0 ? (
            <p className="px-6 py-4 text-sm text-steel">No service requests yet.</p>
          ) : (
            requests.slice(0, 8).map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => setSelected(r)}
                className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-paperDim"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {r.aircraft.tailNumber} — {r.aircraft.make} {r.aircraft.model}
                  </p>
                  <p className="text-xs text-steel2">{formatDate(r.createdAt)}</p>
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
