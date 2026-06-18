import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MOCK_AIRCRAFT } from "@/lib/mock-data";
import { useSettings } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

export default function NewServiceRequest() {
  const navigate = useNavigate();
  const { services } = useSettings();
  const [aircraftId, setAircraftId] = useState(MOCK_AIRCRAFT[0]?.id ?? "");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function toggleService(code: string) {
    setSelectedServices((s) => (s.includes(code) ? s.filter((c) => c !== code) : [...s, code]));
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <CheckCircle2 className="h-10 w-10 text-navgreen" />
        <h1 className="font-display text-xl font-semibold text-ink">Request submitted</h1>
        <p className="max-w-sm text-sm text-steel">
          We'll review your request and send a quote shortly. You can track
          its status under Service Requests.
        </p>
        <Button variant="amber" onClick={() => navigate("/portal/requests")}>
          View Service Requests
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">New Service Request</h1>
        <p className="text-sm text-steel">Tell us which aircraft and which services you need.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request details</CardTitle>
          <CardDescription>You can add notes or change services later if needed.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <div>
              <Label htmlFor="aircraft-select">Aircraft</Label>
              <Select value={aircraftId} onValueChange={setAircraftId}>
                <SelectTrigger id="aircraft-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_AIRCRAFT.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.tailNumber} — {a.make} {a.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Services</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {services.map((s) => (
                  <button
                    type="button"
                    key={s.code}
                    onClick={() => toggleService(s.code)}
                    className={cn(
                      "rounded-lg border px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
                      selectedServices.includes(s.code)
                        ? "border-amber bg-amber/10 text-amberDark"
                        : "border-ink/15 text-ink hover:border-ink/30"
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="date-input">Preferred date</Label>
              <Input id="date-input" type="date" className="max-w-xs" />
            </div>

            <div>
              <Label htmlFor="notes-input">Notes</Label>
              <Textarea id="notes-input" placeholder="Anything we should know?" />
            </div>

            <Button type="submit" variant="amber" disabled={selectedServices.length === 0}>
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
