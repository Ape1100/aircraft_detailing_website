import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ClientDetailDialog } from "@/components/admin/ClientDetailDialog";
import { useAdminClients, type AdminClient } from "@/lib/supabase-client-hooks";

export default function AdminClients() {
  const { data: clients } = useAdminClients();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminClient | null>(null);

  const filtered = clients.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Clients</h1>
        <p className="text-sm text-steel">Every client in the system. Click a client to view their full profile.</p>
      </div>

      <Input
        placeholder="Search clients..."
        className="max-w-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Card>
        <CardContent className="divide-y divide-ink/10 p-0">
          {filtered.length === 0 ? (
            <p className="px-6 py-4 text-sm text-steel">No clients found.</p>
          ) : (
            filtered.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setSelected(c)}
                className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-paperDim"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{c.name}</p>
                  <p className="text-xs text-steel">{c.company ?? c.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xs text-steel2">{c.aircraftCount} aircraft</p>
                  <Badge variant="green">active</Badge>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <ClientDetailDialog
        client={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
