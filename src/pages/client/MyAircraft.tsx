import { useState } from "react";
import { Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NNumberPlate } from "@/components/aviation/NNumberPlate";
import { useAuth } from "@/lib/auth-provider";
import { addAircraft, useClientAircraft } from "@/lib/supabase-client-hooks";
import { CATEGORY_OPTIONS } from "@/pages/wizard/wizard-data";
import type { AircraftCategory } from "@/types";

export default function MyAircraft() {
  const { session } = useAuth();
  const { data: aircraft, refetch } = useClientAircraft();
  const [open, setOpen] = useState(false);
  const [tailNumber, setTailNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [category, setCategory] = useState<AircraftCategory>("piston_single");
  const [year, setYear] = useState("");
  const [homeAirport, setHomeAirport] = useState("");
  const [hangared, setHangared] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTailNumber("");
    setMake("");
    setModel("");
    setCategory("piston_single");
    setYear("");
    setHomeAirport("");
    setHangared(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) {
      setError("You must be signed in to add an aircraft.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addAircraft(
        session.user.id,
        tailNumber,
        make,
        model,
        category,
        year ? Number(year) : null,
        homeAirport,
        hangared
      );
      refetch();
      setOpen(false);
      resetForm();
    } catch (err) {
      setError((err as Error).message || "Failed to add aircraft. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">My Aircraft</h1>
        <p className="text-sm text-steel">A persistent profile for every aircraft you've registered with us.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {aircraft.map((a) => (
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

        <button type="button" onClick={() => setOpen(true)} className="text-left">
          <Card className="flex h-full flex-col items-center justify-center gap-3 border-dashed py-10 text-center text-steel transition-colors hover:border-amber hover:text-amberDark">
            <Plane className="h-6 w-6" />
            <p className="text-sm">Add another aircraft to your account</p>
          </Card>
        </button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add an aircraft</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="tail-number">Tail number</Label>
              <Input
                id="tail-number"
                required
                value={tailNumber}
                onChange={(e) => setTailNumber(e.target.value)}
                placeholder="N12345"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="make">Make</Label>
                <Input id="make" required value={make} onChange={(e) => setMake(e.target.value)} placeholder="Cessna" />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input id="model" required value={model} onChange={(e) => setModel(e.target.value)} placeholder="172" />
              </div>
            </div>
            <div>
              <Label htmlFor="category-select">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as AircraftCategory)}>
                <SelectTrigger id="category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="year">Year (optional)</Label>
                <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2015" />
              </div>
              <div>
                <Label htmlFor="home-airport">Home airport</Label>
                <Input
                  id="home-airport"
                  required
                  value={homeAirport}
                  onChange={(e) => setHomeAirport(e.target.value)}
                  placeholder="KSAC"
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={hangared}
                onChange={(e) => setHangared(e.target.checked)}
                className="h-4 w-4 rounded border-ink/30"
              />
              <span className="text-sm text-ink">Hangared</span>
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" variant="amber" className="w-full" disabled={submitting}>
              {submitting ? "Adding…" : "Add aircraft"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
