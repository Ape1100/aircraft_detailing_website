import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "@/components/aviation/RequestStatusBadge";
import { NNumberPlate } from "@/components/aviation/NNumberPlate";
import { MOCK_AIRCRAFT, MOCK_CLIENT, MOCK_INVOICES, MOCK_MEMBERSHIP, MOCK_REQUESTS } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ClientDashboard() {
  const openRequests = MOCK_REQUESTS.filter((r) => !["completed", "paid", "archived"].includes(r.status));
  const unpaidInvoices = MOCK_INVOICES.filter((i) => i.status !== "paid");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Welcome back, {MOCK_CLIENT.name.split(" ")[0]}</h1>
        <p className="text-sm text-steel">Here's what's happening across your aircraft.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Aircraft on file</CardDescription>
            <CardTitle className="text-3xl">{MOCK_AIRCRAFT.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Open requests</CardDescription>
            <CardTitle className="text-3xl">{openRequests.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Membership</CardDescription>
            <CardTitle className="text-xl capitalize">{MOCK_MEMBERSHIP.tier.replace("_", " ")}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Active requests</CardTitle>
            <Link to="/portal/requests" className="text-sm text-amberDark hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {openRequests.map((r) => {
              const aircraft = MOCK_AIRCRAFT.find((a) => a.id === r.aircraftId);
              return (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-ink/10 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{aircraft?.tailNumber}</p>
                    <p className="text-xs text-steel">{r.services.length} service(s) · {formatDate(r.createdAt)}</p>
                  </div>
                  <RequestStatusBadge status={r.status} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Outstanding invoices</CardTitle>
            <Link to="/portal/invoices" className="text-sm text-amberDark hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {unpaidInvoices.length === 0 ? (
              <p className="text-sm text-steel">You're all caught up — nothing outstanding.</p>
            ) : (
              unpaidInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border border-ink/10 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{formatCurrency(inv.amount)}</p>
                    <p className="text-xs text-steel capitalize">{inv.status.replace("_", " ")}</p>
                  </div>
                  <Button asChild size="sm" variant="amber">
                    <Link to="/portal/invoices">Pay</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Your aircraft</CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link to="/portal/requests/new">
              New request <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {MOCK_AIRCRAFT.map((a) => (
            <div key={a.id} className="flex items-center gap-4 rounded-lg border border-ink/10 p-4">
              <NNumberPlate tailNumber={a.tailNumber} size="sm" />
              <div>
                <p className="text-sm font-medium text-ink">{a.make} {a.model}</p>
                <p className="text-xs text-steel">{a.homeAirport}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
