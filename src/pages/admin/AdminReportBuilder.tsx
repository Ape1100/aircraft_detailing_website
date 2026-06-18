import { useState } from "react";
import { Camera, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MOCK_AIRCRAFT } from "@/lib/mock-data";
import { useSettings } from "@/lib/settings-store";
import { REQUIRED_REPORT_DISCLAIMER, type ObservedIssueCategory } from "@/types";
import { cn } from "@/lib/utils";

const ISSUE_OPTIONS: { value: ObservedIssueCategory; label: string }[] = [
  { value: "paint_chips", label: "Paint Chips" },
  { value: "scratches", label: "Scratches" },
  { value: "corrosion_observation", label: "Corrosion Observation" },
  { value: "loose_missing_fastener", label: "Loose / Missing Fastener Observation" },
  { value: "fluid_staining", label: "Fluid Staining" },
  { value: "tire_wheel_observation", label: "Tire / Wheel Observation" },
  { value: "window_condition", label: "Window Condition" },
  { value: "seal_trim_condition", label: "Seal / Trim Condition" },
  { value: "interior_wear", label: "Interior Wear" },
  { value: "other", label: "Other" },
];

interface DraftIssue {
  id: string;
  category: ObservedIssueCategory;
  note: string;
}

export default function AdminReportBuilder() {
  const { services } = useSettings();
  const [aircraftId, setAircraftId] = useState(MOCK_AIRCRAFT[0]?.id ?? "");
  const [serviceDate, setServiceDate] = useState("");
  const [location, setLocation] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([""]);
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [issues, setIssues] = useState<DraftIssue[]>([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [saved, setSaved] = useState(false);

  function toggleService(code: string) {
    setSelectedServices((s) => (s.includes(code) ? s.filter((c) => c !== code) : [...s, code]));
  }
  function addIssue() {
    setIssues((i) => [...i, { id: crypto.randomUUID(), category: "other", note: "" }]);
  }
  function updateIssue(id: string, patch: Partial<DraftIssue>) {
    setIssues((i) => i.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function removeIssue(id: string) {
    setIssues((i) => i.filter((it) => it.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Detailing Report Builder</h1>
        <p className="text-sm text-steel">Document the visit and any observed conditions.</p>
      </div>

      {saved && (
        <div className="rounded-lg border border-navgreen/30 bg-navgreen/5 px-4 py-3 text-sm text-navgreen">
          Report saved to the aircraft's history (mock — not yet persisted to a backend).
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Visit details</CardTitle>
          <CardDescription>Required fields for every detailing report.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="rb-aircraft">Aircraft / tail number</Label>
              <Select value={aircraftId} onValueChange={setAircraftId}>
                <SelectTrigger id="rb-aircraft"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOCK_AIRCRAFT.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.tailNumber} — {a.make} {a.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rb-date">Service date</Label>
              <Input id="rb-date" type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="rb-location">Location</Label>
              <Input id="rb-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="KSAC — Sacramento Executive" />
            </div>
          </div>

          <div>
            <Label>Services performed</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  type="button"
                  key={s.code}
                  onClick={() => toggleService(s.code)}
                  className={cn(
                    "rounded-lg border px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
                    selectedServices.includes(s.code) ? "border-amber bg-amber/10 text-amberDark" : "border-ink/15 text-ink hover:border-ink/30"
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Products used</Label>
            <div className="space-y-2">
              {products.map((p, i) => (
                <Input
                  key={i}
                  value={p}
                  onChange={(e) => setProducts((arr) => arr.map((v, idx) => (idx === i ? e.target.value : v)))}
                  placeholder="e.g. Aircraft-safe exterior wash soap"
                />
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setProducts((p) => [...p, ""])}>
              <Plus className="h-4 w-4" /> Add product
            </Button>
          </div>

          <div>
            <Label htmlFor="rb-tech-notes">Technician notes</Label>
            <Textarea id="rb-tech-notes" value={technicianNotes} onChange={(e) => setTechnicianNotes(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observed issues</CardTitle>
          <CardDescription>
            Appearance-related observations only — not a maintenance finding or airworthiness call.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {issues.map((issue) => (
            <div key={issue.id} className="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 sm:flex-row sm:items-start">
              <div className="w-full sm:w-56">
                <Select value={issue.category} onValueChange={(v) => updateIssue(issue.id, { category: v as ObservedIssueCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ISSUE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={issue.note}
                onChange={(e) => updateIssue(issue.id, { note: e.target.value })}
                placeholder="Describe what was observed"
                className="flex-1"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeIssue(issue.id)}>
                <Trash2 className="h-4 w-4 text-rust" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addIssue}>
            <Plus className="h-4 w-4" /> Add observed issue
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Photos &amp; recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>Before / after photos</Label>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: photoCount }).map((_, i) => (
                <div key={i} className="flex h-20 w-20 items-center justify-center rounded-lg border border-ink/10 bg-paperDim text-steel2">
                  <Camera className="h-5 w-5" />
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setPhotoCount((c) => c + 1)}>
              <Camera className="h-4 w-4" /> Add photo (mock upload)
            </Button>
          </div>
          <div>
            <Label htmlFor="rb-recs">Recommendations</Label>
            <Textarea id="rb-recs" value={recommendations} onChange={(e) => setRecommendations(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-xs leading-relaxed text-steel2">{REQUIRED_REPORT_DISCLAIMER}</p>
          <p className="mt-2 text-[11px] text-steel2/80">
            This disclaimer is included on every detailing report and cannot be removed.
          </p>
        </CardContent>
      </Card>

      <Button variant="amber" size="lg" onClick={() => setSaved(true)}>
        Save Report
      </Button>
    </div>
  );
}
