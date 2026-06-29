import { useEffect, useState } from "react";
import { Camera, Download, FileText, Mail, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  confirmDetailingReport,
  createDetailingReport,
  getSignedReportPhotoUrl,
  uploadReportPhoto,
  useAdminAircraft,
  type ReportServicePrice,
} from "@/lib/supabase-client-hooks";
import { supabase } from "@/lib/supabase-client";
import { useSettings } from "@/lib/settings-store";
import { calculateServiceBasePrice } from "@/lib/pricing-engine";
import {
  generateConditionReportPdf,
  generateServiceReportPdf,
  getServiceReportPdfBase64,
  type ReportPdfPhoto,
} from "@/lib/pdf-generator";
import { REQUIRED_REPORT_DISCLAIMER, type ObservedIssueCategory } from "@/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

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

const PRICE_STEP = 5;

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
  const { services, businessSettings, pricingConfig } = useSettings();
  const { data: aircraft } = useAdminAircraft();
  const [aircraftId, setAircraftId] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [location, setLocation] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<string[]>([""]);
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [issues, setIssues] = useState<DraftIssue[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<"service" | "condition" | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!aircraftId && aircraft[0]?.id) {
      setAircraftId(aircraft[0].id);
    }
  }, [aircraft, aircraftId]);

  const selectedAircraft = aircraft.find((a) => a.id === aircraftId);

  // Per-service prices are category-dependent (see calculateServiceBasePrice),
  // so switching aircraft mid-draft refreshes the basis for whatever's
  // currently selected — any manual adjustment is intentionally reset along
  // with it, since there's no way to know whether a prior dollar
  // adjustment still makes sense for a different aircraft's multipliers.
  useEffect(() => {
    if (!selectedAircraft || selectedServices.length === 0) return;
    setServicePrices((prev) => {
      const next = { ...prev };
      for (const code of selectedServices) {
        const service = services.find((s) => s.code === code);
        if (service) {
          next[code] = Math.round(calculateServiceBasePrice(service, selectedAircraft.category, pricingConfig));
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aircraftId]);

  const total = selectedServices.reduce((sum, code) => sum + (servicePrices[code] ?? 0), 0);

  function toggleService(code: string) {
    setSelectedServices((s) => {
      if (s.includes(code)) {
        setServicePrices((p) => {
          const next = { ...p };
          delete next[code];
          return next;
        });
        return s.filter((c) => c !== code);
      }
      if (selectedAircraft) {
        const service = services.find((sv) => sv.code === code);
        const base = service ? calculateServiceBasePrice(service, selectedAircraft.category, pricingConfig) : 0;
        setServicePrices((p) => ({ ...p, [code]: Math.round(base) }));
      }
      return [...s, code];
    });
  }

  function adjustPrice(code: string, delta: number) {
    setServicePrices((p) => ({ ...p, [code]: Math.max(0, (p[code] ?? 0) + delta) }));
  }

  function setPriceDirect(code: string, value: number) {
    setServicePrices((p) => ({ ...p, [code]: Math.max(0, Number.isFinite(value) ? value : 0) }));
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

  function buildServicePrices(): ReportServicePrice[] {
    return selectedServices.map((code) => {
      const service = services.find((s) => s.code === code);
      const basePrice = selectedAircraft && service
        ? Math.round(calculateServiceBasePrice(service, selectedAircraft.category, pricingConfig))
        : 0;
      return {
        code,
        name: service?.name ?? code,
        basePrice,
        finalPrice: servicePrices[code] ?? basePrice,
      };
    });
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
        servicePrices: buildServicePrices(),
        total,
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

  function pdfPayload(photos: ReportPdfPhoto[]) {
    if (!selectedAircraft) return null;
    return {
      businessSettings,
      aircraftLabel: `${selectedAircraft.tailNumber} — ${selectedAircraft.make} ${selectedAircraft.model}`,
      clientName: selectedAircraft.ownerName,
      serviceDate: formatDate(serviceDate),
      location,
      servicePrices: buildServicePrices().map((sp) => ({ name: sp.name, finalPrice: sp.finalPrice })),
      total,
      productsUsed: products.filter((p) => p.trim().length > 0),
      technicianNotes: technicianNotes || null,
      recommendations: recommendations || null,
      observedIssues: issues.map((i) => ({ category: i.category, note: i.note })),
      photos,
      disclaimer: REQUIRED_REPORT_DISCLAIMER,
    };
  }

  async function handleDownloadServiceReport() {
    if (!savedReportId || !selectedAircraft) return;
    setGeneratingPdf("service");
    try {
      const photos = await loadSignedPhotos(savedReportId);
      const payload = pdfPayload(photos);
      if (payload) await generateServiceReportPdf(payload);
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
      const payload = pdfPayload(photos);
      if (payload) await generateConditionReportPdf(payload);
    } catch (err) {
      setError((err as Error).message || "Failed to generate PDF.");
    } finally {
      setGeneratingPdf(null);
    }
  }

  async function handleConfirmAndSend() {
    if (!savedReportId || !selectedAircraft) return;
    if (!selectedAircraft.ownerEmail) {
      setError("This client has no email on file — can't send the report.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const photos = await loadSignedPhotos(savedReportId);
      const payload = pdfPayload(photos);
      if (!payload) throw new Error("Could not build the report.");
      const { base64, filename } = await getServiceReportPdfBase64(payload);

      const res = await fetch("/.netlify/functions/send-report-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedAircraft.ownerEmail,
          clientName: selectedAircraft.ownerName,
          businessName: businessSettings.companyName,
          total,
          filename,
          pdfBase64: base64,
        }),
      });

      if (!res.ok) {
        const { error: serverError } = await res.json().catch(() => ({ error: "Failed to send report email." }));
        throw new Error(serverError);
      }

      await confirmDetailingReport(savedReportId);
      setConfirmed(true);
    } catch (err) {
      setError((err as Error).message || "Failed to confirm and send the report.");
    } finally {
      setSending(false);
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
          <span>{confirmed ? "Report confirmed and emailed to the client." : "Report saved to the aircraft's history."}</span>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={generatingPdf === "service"} onClick={handleDownloadServiceReport}>
              <Download className="h-4 w-4" /> {generatingPdf === "service" ? "Generating…" : "Download PDF"}
            </Button>
            <Button size="sm" variant="amber" disabled={sending || confirmed} onClick={handleConfirmAndSend}>
              <Mail className="h-4 w-4" /> {sending ? "Sending…" : confirmed ? "Sent" : "Confirm & Send to Client"}
            </Button>
          </div>
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
              {services.map((s) => {
                const selected = selectedServices.includes(s.code);
                return (
                  <div
                    key={s.code}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors",
                      selected ? "border-amber bg-amber/10 text-amberDark" : "border-ink/15 text-ink"
                    )}
                  >
                    <button type="button" onClick={() => toggleService(s.code)} className="flex-1 text-left">
                      {s.name}
                    </button>
                    {selected && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => adjustPrice(s.code, -PRICE_STEP)}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-ink/15 text-xs text-ink hover:border-ink/30"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={servicePrices[s.code] ?? 0}
                          onChange={(e) => setPriceDirect(s.code, Number(e.target.value))}
                          className="h-6 w-16 rounded-md border border-ink/15 px-1 text-center text-xs text-ink"
                        />
                        <button
                          type="button"
                          onClick={() => adjustPrice(s.code, PRICE_STEP)}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-ink/15 text-xs text-ink hover:border-ink/30"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
        <CardContent className="flex items-center justify-between pt-6">
          <p className="font-display text-lg font-semibold text-ink">Total</p>
          <p className="font-display text-2xl font-semibold text-ink">{formatCurrency(total)}</p>
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
