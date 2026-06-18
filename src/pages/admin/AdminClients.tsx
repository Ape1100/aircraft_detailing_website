import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MOCK_ADMIN_CLIENTS } from "@/lib/mock-data";

export default function AdminClients() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Clients</h1>
        <p className="text-sm text-steel">Every client and lead in the system.</p>
      </div>

      <Input placeholder="Search clients..." className="max-w-sm" />

      <Card>
        <CardContent className="divide-y divide-ink/10 p-0">
          {MOCK_ADMIN_CLIENTS.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-ink">{c.name}</p>
                <p className="text-xs text-steel">{c.company}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-xs text-steel2">{c.aircraftCount} aircraft</p>
                <Badge variant={c.status === "active" ? "green" : "neutral"}>{c.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
