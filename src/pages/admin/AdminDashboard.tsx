import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RequestStatusBadge } from "@/components/aviation/RequestStatusBadge";
import { MOCK_ADMIN_CLIENTS, MOCK_AIRCRAFT, MOCK_REQUESTS } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default function AdminDashboard() {
  const openRequests = MOCK_REQUESTS.filter((r) => !["completed", "paid", "archived"].includes(r.status));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Operations Dashboard</h1>
        <p className="text-sm text-steel">An overview of clients, requests, and scheduling.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-4">
        <Card>
          <CardHeader><CardDescription>Clients</CardDescription><CardTitle className="text-3xl">{MOCK_ADMIN_CLIENTS.length}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader><CardDescription>Aircraft on file</CardDescription><CardTitle className="text-3xl">{MOCK_AIRCRAFT.length}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader><CardDescription>Open requests</CardDescription><CardTitle className="text-3xl">{openRequests.length}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader><CardDescription>Quotes pending</CardDescription><CardTitle className="text-3xl">{MOCK_REQUESTS.filter((r) => r.status === "quote_sent").length}</CardTitle></CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent requests</CardTitle></CardHeader>
        <CardContent className="divide-y divide-ink/10 p-0">
          {MOCK_REQUESTS.map((r) => {
            const aircraft = MOCK_AIRCRAFT.find((a) => a.id === r.aircraftId);
            return (
              <div key={r.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-ink">{aircraft?.tailNumber} — {aircraft?.make} {aircraft?.model}</p>
                  <p className="text-xs text-steel2">{formatDate(r.createdAt)}</p>
                </div>
                <RequestStatusBadge status={r.status} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
