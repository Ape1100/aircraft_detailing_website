import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-provider";
import { createServiceRequest, useClientAircraft } from "@/lib/supabase-client-hooks";
import { useSettings } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

export default function NewServiceRequest() {
  const navigate = useNavigate();
  const { services } = useSettings();
  const { session } = useAuth();
  const { data: aircraft } = useClientAircraft();
  const [aircraftId, setAircraftId] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [preferredDate, setPreferredDate] = useState<string>("");
  const [airportLocation, setAirportLocation] = useState("");
  const [fboName, setFboName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!aircraftId && aircraft[0]?.id) {
      setAircraftId(aircraft[0].id);
    }
  }, [aircraft, aircraftId]);

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
            onSubmit={async (e) => {
              e.preventDefault();
              if (!session?.user?.id) {
                setError("You must be signed in to submit a request.");
                return;
              }
              setError(null);
              setSubmitting(true);
              try {
                await createServiceRequest(
                  session.user.id,
                  aircraftId,
                  selectedServices,
                  preferredDate || null,
                  airportLocation,
                  fboName || null,
                  notes || null
                );
                setSubmitted(true);
              } catch (err) {
                setError((err as Error).message || "Failed to submit request. Please try again.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div>
              <Label htmlFor="aircraft-select">Aircraft</Label>
              {aircraft.length === 0 ? (
                <p className="mt-1 text-sm text-steel">
                  You don't have any aircraft on file yet.{" "}
                  <Link to="/portal/aircraft" className="text-amberDark hover:underline">
                    Add one first
                  </Link>{" "}
                  before requesting service.
                </p>
              ) : (
                <Select value={aircraftId} onValueChange={setAircraftId}>
                  <SelectTrigger id="aircraft-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aircraft.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.tailNumber} — {a.make} {a.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
              <Input
                id="date-input"
                type="date"
                className="max-w-xs"
                value={preferredDate}
                onChange={(event) => setPreferredDate(event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="airport-input">Airport / location</Label>
              <Input
                id="airport-input"
                required
                value={airportLocation}
                onChange={(event) => setAirportLocation(event.target.value)}
                placeholder="KSAC — Sacramento Executive"
              />
            </div>

            <div>
              <Label htmlFor="fbo-input">FBO name (optional)</Label>
              <Input
                id="fbo-input"
                value={fboName}
                onChange={(event) => setFboName(event.target.value)}
                placeholder="Sacramento Jet Center"
              />
            </div>

            <div>
              <Label htmlFor="notes-input">Notes</Label>
              <Textarea
                id="notes-input"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Anything we should know?"
              />
            </div>

            <Button
              type="submit"
              variant="amber"
              disabled={submitting || selectedServices.length === 0 || !aircraftId || !airportLocation}
            >
              {submitting ? "Submitting…" : "Submit Request"}
            </Button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
