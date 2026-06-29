import { useEffect, useState } from "react";
import { Camera, Download, FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  createDetailingReport,
  getSignedReportPhotoUrl,
  uploadReportPhoto,
  useAdminAircraft,
} from "@/lib/supabase-client-hooks";
import { supabase } from "@/lib/supabase-client";
import { useSettings } from "@/lib/settings-store";
import { generateConditionReportPdf, generateServiceReportPdf, type ReportPdfPhoto } from "@/lib/pdf-generator";
import { REQUIRED_REPORT_DISCLAIMER, type ObservedIssueCategory } from "@/types";
import { cn, formatDate } from "@/lib/utils";

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

interface PendingPhoto {
  id: string;
  file: File;
  kind: "before" | "after";
  previewUrl: string;
}

export default function AdminReportBuilder() {
  const { services, businessSettings } = useSettings();
  const { data: aircraft } = useAdminAircraft();
  const [aircraftId, setAircraftId] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [location, setLocation] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([""]);
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [issues, setIssues] = useState<DraftIssue[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<"service" | "condition" | null>(null);

  useEffect(() => {
    if (!aircraftId && aircraft[0]?.id) {
      setAircraftId(aircraft[0].id);
    }
  }, [aircraft, aircraftId]);

  const selectedAircraft = aircraft.find((a) => a.id === aircraftId);

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

  function addPendingPhoto(file: File, kind: "before" | "after") {
    setPendingPhotos((p) => [...p, { id: crypto.randomUUID(), file, kind, previewUrl: URL.createObjectURL(file) }]);
  }
  function removePendingPhoto(id: string) {
    setPendingPhotos((p) => p.filter((ph) => ph.id !== id));
  }

  async function handleSave() {
    if (!selectedAircraft) {
      setError("Select an aircraft first.");
      return;
    }
    if (!serviceDate || !location) {
      setError("Service date and location are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const reportId = await createDetailingReport({
        aircraftId: selectedAircraft.id,
        clientId: selectedAircraft.ownerId,
        serviceDate,
        location,
        servicesPerformed: selectedServices,
        productsUsed: products.filter((p) => p.trim().length > 0),
        technicianNotes: technicianNotes || null,
        recommendations: recommendations || null,
        observedIssues: issues.map((i) => ({ category: i.category, note: i.note })),
      });

      for (const photo of pendingPhotos) {
        await uploadReportPhoto(selectedAircraft.ownerId, reportId, photo.file, photo.kind);
      }

      setSavedReportId(reportId);
    } catch (err) {
      setError((err as Error).message || "Failed to save report. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function loadSignedPhotos(reportId: string): Promise<ReportPdfPhoto[]> {
    const { data } = await supabase.from("report_photos").select("url, kind").eq("report_id", reportId);
    const photos = await Promise.all(
      (data ?? []).map(async (row) => ({
        signedUrl: await getSignedReportPhotoUrl(row.url),
        kind: row.kind as ReportPdfPhoto["kind"],
      }))
    );
    return photos;
  }

  async function handleDownloadServiceReport() {
    if (!savedReportId || !selectedAircraft) return;
    setGeneratingPdf("service");
    try {
      const photos = await loadSignedPhotos(savedReportId);
      await generateServiceReportPdf({
        businessSettings,
        aircraftLabel: `${selectedAircraft.tailNumber} — ${selectedAircraft.make} ${selectedAircraft.model}`,
        clientName: selectedAircraft.ownerName,
        serviceDate: formatDate(serviceDate),
        location,
        servicesPerformed: selectedServices.map((s) => services.find((sc) => sc.code === s)?.name ?? s),
        productsUsed: products.filter((p) => p.trim().length > 0),
        technicianNotes: technicianNotes || null,
        recommendations: recommendations || null,
        observedIssues: issues.map((i) => ({ category: i.category, note: i.note })),
        photos,
        disclaimer: REQUIRED_REPORT_DISCLAIMER,
      });
    } catch (err) {
      setError((err as Error).message || "Failed to generate PDF.");
    } finally {
      setGeneratingPdf(null);
    }
  }

  async function handlePrintConditionReport() {
    if (!savedReportId || !selectedAircraft) return;
    setGeneratingPdf("condition");
    try {
      const photos = await loadSignedPhotos(savedReportId);
      await generateConditionReportPdf({
        businessSettings,
        aircraftLabel: `${selectedAircraft.tailNumber} — ${selectedAircraft.make} ${selectedAircraft.model}`,
        clientName: selectedAircraft.ownerName,
        serviceDate: formatDate(serviceDate),
        location,
        servicesPerformed: [],
        productsUsed: [],
        technicianNotes: null,
        recommendations: null,
        observedIssues: issues.map((i) => ({ category: i.category, note: i.note })),
        photos,
        disclaimer: REQUIRED_REPORT_DISCLAIMER,
      });
    } catch (err) {
      setError((err as Error).message || "Failed to generate PDF.");
    } finally {
      setGeneratingPdf(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Detailing Report Builder</h1>
        <p className="text-sm text-steel">Document the visit and any observed conditions.</p>
      </div>

      {savedReportId && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-navgreen/30 bg-navgreen/5 px-4 py-3 text-sm text-navgreen">
          <span>Report saved to the aircraft's history.</span>
          <Button
            size="sm"
            variant="outline"
            disabled={generatingPdf === "service"}
            onClick={handleDownloadServiceReport}
          >
            <Download className="h-4 w-4" /> {generatingPdf === "service" ? "Generating…" : "Download PDF"}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

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
                  {aircraft.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.tailNumber} — {a.make} {a.model} ({a.ownerName})</SelectItem>
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
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Observed issues</CardTitle>
            <CardDescription>
              Appearance-related observations only — not a maintenance finding or airworthiness call.
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!savedReportId || generatingPdf === "condition"}
            onClick={handlePrintConditionReport}
            title={savedReportId ? "Print Condition Report" : "Save the report first"}
          >
            <FileText className="h-4 w-4" /> {generatingPdf === "condition" ? "Generating…" : "Print Condition Report"}
          </Button>
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
              {pendingPhotos.map((p) => (
                <div key={p.id} className="relative h-20 w-20">
                  <img src={p.previewUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />
                  <span className="absolute bottom-0 left-0 rounded-tr-lg rounded-bl-lg bg-ink/70 px-1.5 py-0.5 text-[10px] capitalize text-paper">
                    {p.kind}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePendingPhoto(p.id)}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-rust p-0.5 text-paper"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink hover:border-ink/30">
                <Camera className="h-4 w-4" /> Add before photo
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => Array.from(e.target.files ?? []).forEach((f) => addPendingPhoto(f, "before"))}
                />
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink hover:border-ink/30">
                <Camera className="h-4 w-4" /> Add after photo
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => Array.from(e.target.files ?? []).forEach((f) => addPendingPhoto(f, "after"))}
                />
              </label>
            </div>
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

      <Button variant="amber" size="lg" disabled={saving || !!savedReportId} onClick={handleSave}>
        {saving ? "Saving…" : savedReportId ? "Saved" : "Save Report"}
      </Button>
    </div>
  );
}
