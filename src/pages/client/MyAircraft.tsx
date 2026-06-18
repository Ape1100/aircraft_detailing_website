import { Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NNumberPlate } from "@/components/aviation/NNumberPlate";
import { MOCK_AIRCRAFT } from "@/lib/mock-data";

export default function MyAircraft() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">My Aircraft</h1>
        <p className="text-sm text-steel">A persistent profile for every aircraft you've registered with us.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {MOCK_AIRCRAFT.map((a) => (
          <Card key={a.id}>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle>{a.make} {a.model}</CardTitle>
                <CardDescription>{a.homeAirport}</CardDescription>
              </div>
              <Badge variant="outline">{a.hangared ? "Hangared" : "Ramp"}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <NNumberPlate tailNumber={a.tailNumber} />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-steel2">Category</p>
                  <p className="text-ink capitalize">{a.category.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-steel2">Year</p>
                  <p className="text-ink">{a.year ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="flex flex-col items-center justify-center gap-3 border-dashed py-10 text-center text-steel">
          <Plane className="h-6 w-6 text-steel2" />
          <p className="text-sm">Add another aircraft to your account</p>
        </Card>
      </div>
    </div>
  );
}
