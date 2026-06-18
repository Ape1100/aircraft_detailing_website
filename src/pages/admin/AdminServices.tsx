import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AvailabilityBadge } from "@/components/aviation/AvailabilityBadge";
import { useSettings } from "@/lib/settings-store";
import { formatCurrency } from "@/lib/utils";
import type { AvailabilityStatus, ServiceDefinition } from "@/types";

const AVAILABILITY_OPTIONS: AvailabilityStatus[] = ["available", "limited", "coming_soon", "referral_only"];

type DraftService = Omit<ServiceDefinition, "code"> & { code?: string };

const BLANK_DRAFT: DraftService = {
  name: "",
  description: "",
  category: "launch",
  startingPrice: 0,
  availability: "available",
  unit: "flat",
};

export default function AdminServices() {
  const { services, addService, updateService, removeService } = useSettings();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftService>(BLANK_DRAFT);

  function startAdd() {
    setDraft(BLANK_DRAFT);
    setOpen(true);
  }

  function startEdit(service: ServiceDefinition) {
    setDraft(service);
    setOpen(true);
  }

  function save() {
    const quoteRequired = draft.startingPrice === null;
    const payload: DraftService = { ...draft, unit: quoteRequired ? "quote" : "flat" };
    if (draft.code) {
      updateService(draft.code, payload);
    } else {
      addService(payload);
    }
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Services &amp; Pricing</h1>
          <p className="text-sm text-steel">
            Edit names, descriptions, fees, and availability — changes apply instantly across the
            site, the estimate wizard, and the pricing engine.
          </p>
        </div>
        <Button variant="amber" onClick={startAdd}>
          <Plus className="h-4 w-4" /> Add Service
        </Button>
      </div>

      <Card>
        <CardContent className="divide-y divide-ink/10 p-0">
          {services.map((s) => (
            <div key={s.code} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink">{s.name}</p>
                  <AvailabilityBadge status={s.availability} />
                </div>
                <p className="mt-0.5 text-xs text-steel2">{s.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="w-32 shrink-0 text-right text-sm text-steel">
                  {s.startingPrice !== null ? formatCurrency(s.startingPrice) : "Quote required"}
                </p>
                <Button variant="ghost" size="icon" onClick={() => startEdit(s)} aria-label="Edit service">
                  <Pencil className="h-4 w-4 text-steel" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (window.confirm(`Remove "${s.name}" from the catalog?`)) removeService(s.code);
                  }}
                  aria-label="Delete service"
                >
                  <Trash2 className="h-4 w-4 text-rust" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.code ? "Edit service" : "Add a new service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="svc-name">Name</Label>
              <Input id="svc-name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="svc-desc">Description</Label>
              <Textarea
                id="svc-desc"
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="svc-category">Category</Label>
                <Select value={draft.category} onValueChange={(v) => setDraft((d) => ({ ...d, category: v as "launch" | "advanced" }))}>
                  <SelectTrigger id="svc-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="launch">Launch (core)</SelectItem>
                    <SelectItem value="advanced">Advanced / limited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="svc-availability">Availability</Label>
                <Select
                  value={draft.availability}
                  onValueChange={(v) => setDraft((d) => ({ ...d, availability: v as AvailabilityStatus }))}
                >
                  <SelectTrigger id="svc-availability"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="capitalize">{opt.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="svc-price">Starting price (leave blank for "quote required")</Label>
              <Input
                id="svc-price"
                type="number"
                min={0}
                value={draft.startingPrice ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, startingPrice: e.target.value === "" ? null : Number(e.target.value) }))
                }
                placeholder="299"
              />
            </div>
            <Button variant="amber" className="w-full" onClick={save} disabled={!draft.name.trim()}>
              {draft.code ? "Save changes" : "Add service"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
