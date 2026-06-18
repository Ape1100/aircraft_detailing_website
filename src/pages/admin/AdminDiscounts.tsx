import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSettings } from "@/lib/settings-store";
import type { DiscountRule, DiscountScope, DiscountValueType } from "@/types";

const SCOPE_LABEL: Record<DiscountScope, string> = {
  holiday: "Holiday / seasonal",
  repeat_customer: "Repeat customer",
  package_deal: "Multi-service bundle",
  manual: "Manual (custom quotes only)",
};

type Draft = Omit<DiscountRule, "id"> & { id?: string };

const BLANK: Draft = {
  label: "",
  scope: "manual",
  valueType: "percentage",
  value: 10,
  active: true,
};

export default function AdminDiscounts() {
  const { discountRules, addDiscountRule, updateDiscountRule, removeDiscountRule } = useSettings();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(BLANK);

  function startAdd() {
    setDraft(BLANK);
    setOpen(true);
  }
  function startEdit(rule: DiscountRule) {
    setDraft(rule);
    setOpen(true);
  }
  function save() {
    if (draft.id) {
      updateDiscountRule(draft.id, draft);
    } else {
      addDiscountRule(draft);
    }
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Discounts</h1>
          <p className="text-sm text-steel">
            Holiday promotions, repeat-customer rewards, and bundle discounts. Holiday, repeat
            customer, and bundle rules apply automatically when their conditions are met; manual
            rules can be applied by hand when building a custom quote.
          </p>
        </div>
        <Button variant="amber" onClick={startAdd}>
          <Plus className="h-4 w-4" /> Add Discount
        </Button>
      </div>

      <Card>
        <CardContent className="divide-y divide-ink/10 p-0">
          {discountRules.map((rule) => (
            <div key={rule.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink">{rule.label}</p>
                  <Badge variant={rule.active ? "green" : "neutral"}>{rule.active ? "Active" : "Inactive"}</Badge>
                  <Badge variant="outline">{SCOPE_LABEL[rule.scope]}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-steel2">
                  {rule.valueType === "percentage" ? `${rule.value}% off` : `$${rule.value} off`}
                  {rule.scope === "holiday" && rule.startDate && rule.endDate && ` · ${rule.startDate} to ${rule.endDate}`}
                  {rule.scope === "package_deal" && rule.minServicesForBundle && ` · ${rule.minServicesForBundle}+ services`}
                  {rule.scope === "repeat_customer" && rule.minCompletedServices && ` · ${rule.minCompletedServices}+ past services`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => updateDiscountRule(rule.id, { active: !rule.active })}>
                  {rule.active ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => startEdit(rule)} aria-label="Edit discount">
                  <Pencil className="h-4 w-4 text-steel" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (window.confirm(`Remove "${rule.label}"?`)) removeDiscountRule(rule.id);
                  }}
                  aria-label="Delete discount"
                >
                  <Trash2 className="h-4 w-4 text-rust" />
                </Button>
              </div>
            </div>
          ))}
          {discountRules.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-steel">No discount rules yet.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit discount" : "Add a discount rule"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="disc-label">Label</Label>
              <Input id="disc-label" value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="disc-scope">When it applies</Label>
                <Select value={draft.scope} onValueChange={(v) => setDraft((d) => ({ ...d, scope: v as DiscountScope }))}>
                  <SelectTrigger id="disc-scope"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SCOPE_LABEL) as DiscountScope[]).map((scope) => (
                      <SelectItem key={scope} value={scope}>{SCOPE_LABEL[scope]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="disc-type">Discount type</Label>
                <Select value={draft.valueType} onValueChange={(v) => setDraft((d) => ({ ...d, valueType: v as DiscountValueType }))}>
                  <SelectTrigger id="disc-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage off</SelectItem>
                    <SelectItem value="flat">Flat dollar amount off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="disc-value">{draft.valueType === "percentage" ? "Percent off" : "Dollar amount off"}</Label>
              <Input
                id="disc-value"
                type="number"
                min={0}
                value={draft.value}
                onChange={(e) => setDraft((d) => ({ ...d, value: Number(e.target.value) || 0 }))}
              />
            </div>

            {draft.scope === "holiday" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="disc-start">Start date</Label>
                  <Input
                    id="disc-start"
                    type="date"
                    value={draft.startDate ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="disc-end">End date</Label>
                  <Input
                    id="disc-end"
                    type="date"
                    value={draft.endDate ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {draft.scope === "package_deal" && (
              <div>
                <Label htmlFor="disc-bundle">Applies when this many services are selected</Label>
                <Input
                  id="disc-bundle"
                  type="number"
                  min={2}
                  value={draft.minServicesForBundle ?? 3}
                  onChange={(e) => setDraft((d) => ({ ...d, minServicesForBundle: Number(e.target.value) || 2 }))}
                />
              </div>
            )}

            {draft.scope === "repeat_customer" && (
              <div>
                <Label htmlFor="disc-repeat">Applies once a client has this many completed services</Label>
                <Input
                  id="disc-repeat"
                  type="number"
                  min={1}
                  value={draft.minCompletedServices ?? 3}
                  onChange={(e) => setDraft((d) => ({ ...d, minCompletedServices: Number(e.target.value) || 1 }))}
                />
              </div>
            )}

            <div>
              <Label htmlFor="disc-notes">Internal notes (optional)</Label>
              <Textarea id="disc-notes" value={draft.notes ?? ""} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} />
            </div>

            <Button variant="amber" className="w-full" onClick={save} disabled={!draft.label.trim()}>
              {draft.id ? "Save changes" : "Add discount"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
