import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "@/components/aviation/RequestStatusBadge";
import { RequestDetailDialog } from "@/components/admin/RequestDetailDialog";
import { useAdminRequests, type AdminServiceRequest } from "@/lib/supabase-client-hooks";
import { useSettings } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminCalendar() {
  const { services } = useSettings();
  const { data: requests, refetch } = useAdminRequests();
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AdminServiceRequest | null>(null);

  const scheduledByDay = useMemo(() => {
    const map = new Map<string, AdminServiceRequest[]>();
    for (const r of requests) {
      if (!r.scheduledDate) continue;
      const key = r.scheduledDate;
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return map;
  }, [requests]);

  const days = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leadingBlanks = firstDay.getDay();

    const cells: { date: Date | null }[] = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push({ date: null });
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push({ date: new Date(year, month, d) });
    return cells;
  }, [monthCursor]);

  const jobsForSelectedDay = selectedDay ? scheduledByDay.get(selectedDay) ?? [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Service Calendar</h1>
          <p className="text-sm text-steel">Scheduled jobs by day.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="w-36 text-center text-sm font-medium text-ink">
            {monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-steel2">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-2">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((cell, idx) => {
              if (!cell.date) return <div key={idx} />;
              const key = toDateKey(cell.date);
              const jobs = scheduledByDay.get(key) ?? [];
              const isSelected = selectedDay === key;
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedDay(key)}
                  className={cn(
                    "flex h-20 flex-col items-start gap-1 rounded-lg border p-2 text-left transition-colors",
                    isSelected ? "border-amber bg-amber/10" : "border-ink/10 hover:border-ink/30"
                  )}
                >
                  <span className="text-sm font-medium text-ink">{cell.date.getDate()}</span>
                  {jobs.length > 0 && (
                    <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-paper">
                      {jobs.length} job{jobs.length > 1 ? "s" : ""}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDay && (
        <Card>
          <CardContent className="divide-y divide-ink/10 p-0">
            <div className="px-6 py-4">
              <p className="font-medium text-ink">
                Jobs on {new Date(selectedDay + "T00:00:00").toLocaleDateString("en-US", { dateStyle: "long" })}
              </p>
            </div>
            {jobsForSelectedDay.length === 0 ? (
              <p className="px-6 py-4 text-sm text-steel">No jobs scheduled this day.</p>
            ) : (
              jobsForSelectedDay.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setSelectedRequest(r)}
                  className="flex w-full flex-col gap-2 px-6 py-4 text-left transition-colors hover:bg-paperDim sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {r.aircraft.tailNumber} — {r.aircraft.make} {r.aircraft.model}
                    </p>
                    <p className="text-xs text-steel2">
                      {r.clientName} ·{" "}
                      {r.services.map((s) => services.find((sc) => sc.code === s)?.name ?? s).join(", ")}
                    </p>
                  </div>
                  <RequestStatusBadge status={r.status} />
                </button>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <RequestDetailDialog
        request={selectedRequest}
        open={selectedRequest !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(null);
        }}
        onUpdated={() => {
          refetch();
          setSelectedRequest(null);
        }}
      />
    </div>
  );
}
