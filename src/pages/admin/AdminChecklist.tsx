import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { NNumberPlate } from "@/components/aviation/NNumberPlate";
import { useAuth } from "@/lib/auth-provider";
import { supabase } from "@/lib/supabase-client";
import { camelizeKeys } from "@/lib/supabase-mappers";
import { useRequestChecklist, toggleChecklistItem, type ChecklistItem } from "@/lib/supabase-client-hooks";
import { useSettings } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

interface RequestHeader {
  id: string;
  services: string[];
  aircraft: { tailNumber: string; make: string; model: string };
  clientName: string;
}

export default function AdminChecklist() {
  const { requestId } = useParams<{ requestId: string }>();
  const { session } = useAuth();
  const { services: catalog } = useSettings();
  const [request, setRequest] = useState<RequestHeader | null>(null);
  const [headerLoading, setHeaderLoading] = useState(true);

  useEffect(() => {
    if (!requestId) return;
    supabase
      .from("service_requests")
      .select("id, aircraft(tail_number,make,model), profiles(name), service_items(service_code)")
      .eq("id", requestId)
      .single()
      .then(({ data }) => {
        if (!data) {
          setHeaderLoading(false);
          return;
        }
        const row = camelizeKeys<any>(data);
        setRequest({
          id: row.id,
          services: row.serviceItems?.map((i: any) => i.serviceCode) ?? [],
          aircraft: row.aircraft,
          clientName: row.profiles?.name ?? "Unknown client",
        });
        setHeaderLoading(false);
      });
  }, [requestId]);

  const { items, setItems, loading, error } = useRequestChecklist(
    request?.id ?? null,
    request?.services ?? [],
    catalog
  );

  async function handleToggle(item: ChecklistItem) {
    if (!session?.user?.id) return;
    const nextCompleted = !item.completed;

    // Optimistic update first — this is used standing next to an
    // aircraft on a phone, not at a desk, so the tap needs to feel
    // instant rather than waiting on a round trip.
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, completed: nextCompleted } : i))
    );

    try {
      await toggleChecklistItem(item.id, nextCompleted, session.user.id);
    } catch {
      // Revert on failure.
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, completed: item.completed } : i))
      );
    }
  }

  const completedCount = items.filter((i) => i.completed).length;

  return (
    <div className="space-y-6">
      <Link to="/admin/requests" className="inline-flex items-center gap-1.5 text-sm text-steel hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to requests
      </Link>

      {headerLoading ? (
        <p className="text-sm text-steel">Loading…</p>
      ) : !request ? (
        <p className="text-sm text-rust">Request not found.</p>
      ) : (
        <>
          <div>
            <div className="flex items-center gap-3">
              <NNumberPlate tailNumber={request.aircraft.tailNumber} />
              <div>
                <h1 className="font-display text-2xl font-semibold text-ink">
                  {request.aircraft.make} {request.aircraft.model}
                </h1>
                <p className="text-sm text-steel">{request.clientName}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-semibold text-ink">
              {completedCount} of {items.length} complete
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Card>
            <CardContent className="divide-y divide-ink/10 p-0">
              {loading ? (
                <p className="px-6 py-4 text-sm text-steel">Loading checklist…</p>
              ) : items.length === 0 ? (
                <p className="px-6 py-4 text-sm text-steel">No checklist items for this request.</p>
              ) : (
                items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleToggle(item)}
                    className="flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-paperDim active:bg-paperDim"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        item.completed ? "border-navgreen bg-navgreen text-paper" : "border-ink/20"
                      )}
                    >
                      {item.completed && <Check className="h-5 w-5" />}
                    </span>
                    <span
                      className={cn(
                        "text-base",
                        item.completed ? "text-steel line-through" : "text-ink"
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
