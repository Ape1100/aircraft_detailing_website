import { useMemo, useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/lib/settings-store";
import { MOCK_ADMIN_CLIENTS, MOCK_REQUESTS } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CustomQuoteLineItem } from "@/types";

function isHolidayActive(startDate?: string, endDate?: string): boolean {
  if (!startDate || !endDate) return false;
  const t = Date.now();
  return t >= new Date(startDate).getTime() && t <= new Date(endDate).getTime();
}

export default function AdminCustomQuote() {
  const { services, discountRules, customQuotes, addCustomQuote, updateCustomQuoteStatus } = useSettings();
  const [clientId, setClientId] = useState(MOCK_ADMIN_CLIENTS[0]?.id ?? "");
  const [requestId, setRequestId] = useState<string>("none");
  const [lineItems, setLineItems] = useState<CustomQuoteLineItem[]>([]);
  const [selectedDiscountIds, setSelectedDiscountIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  const client = MOCK_ADMIN_CLIENTS.find((c) => c.id === clientId);
  const clientRequests = MOCK_REQUESTS.filter((r) => r.clientId === clientId);

  function prefillFromRequest() {
    const request = MOCK_REQUESTS.find((r) => r.id === requestId);
    if (!request) return;
    const items: CustomQuoteLineItem[] = request.services.map((code) => {
      const service = services.find((s) => s.code === code);
      return {
        id: crypto.randomUUID(),
        label: service?.name ?? code,
        amount: service?.startingPrice ?? 0,
      };
    });
    setLineItems(items);
  }

  function addLineItem() {
    setLineItems((items) => [...items, { id: crypto.randomUUID(), label: "", amount: 0 }]);
  }
  function updateLineItem(id: string, patch: Partial<CustomQuoteLineItem>) {
    setLineItems((items) => items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function removeLineItem(id: string) {
    setLineItems((items) => items.filter((i) => i.id !== id));
  }

  function autoSuggestDiscounts() {
    const eligible = discountRules.filter((rule) => {
      if (!rule.active) return false;
      if (rule.scope === "holiday") return isHolidayActive(rule.startDate, rule.endDate);
      if (rule.scope === "package_deal") return !!rule.minServicesForBundle && lineItems.length >= rule.minServicesForBundle;
      if (rule.scope === "repeat_customer")
        return !!rule.minCompletedServices && (client?.completedServiceCount ?? 0) >= rule.minCompletedServices;
      return false;
    });
    setSelectedDiscountIds(eligible.map((r) => r.id));
  }

  function toggleDiscount(id: string) {
    setSelectedDiscountIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  const subtotal = useMemo(() => lineItems.reduce((sum, i) => sum + (i.amount || 0), 0), [lineItems]);

  const { discountTotal, total } = useMemo(() => {
    let running = subtotal;
    let discTotal = 0;
    for (const id of selectedDiscountIds) {
      const rule = discountRules.find((r) => r.id === id);
      if (!rule) continue;
      const amount = rule.valueType === "percentage" ? running * (rule.value / 100) : rule.value;
      discTotal += amount;
      running -= amount;
    }
    return { discountTotal: Math.round(discTotal), total: Math.round(running) };
  }, [subtotal, selectedDiscountIds, discountRules]);

  function saveQuote() {
    if (!client) return;
    addCustomQuote({
      clientId: client.id,
      clientName: client.name,
      requestId: requestId !== "none" ? requestId : undefined,
      lineItems,
      appliedDiscountIds: selectedDiscountIds,
      notes,
      subtotal,
      discountTotal,
      total,
      status: "draft",
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
    setLineItems([]);
    setSelectedDiscountIds([]);
    setNotes("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Custom Quote Builder</h1>
        <p className="text-sm text-steel">
          Build a one-off quote for a specific customer, with full control over line items and
          discounts — useful for negotiated pricing, fleet deals, or anything outside the standard
          estimate.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer &amp; line items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cq-client">Client</Label>
              <Select value={clientId} onValueChange={(v) => { setClientId(v); setRequestId("none"); }}>
                <SelectTrigger id="cq-client"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOCK_ADMIN_CLIENTS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} — {c.company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {client && (
                <p className="mt-1.5 text-xs text-steel2">{client.completedServiceCount} completed service(s) on file</p>
              )}
            </div>
            <div>
              <Label htmlFor="cq-request">Prefill from a request (optional)</Label>
              <div className="flex gap-2">
                <Select value={requestId} onValueChange={setRequestId}>
                  <SelectTrigger id="cq-request"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {clientRequests.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{formatDate(r.createdAt)} — {r.services.length} service(s)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={prefillFromRequest} disabled={requestId === "none"}>
                  Prefill
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {lineItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <Input
                  value={item.label}
                  onChange={(e) => updateLineItem(item.id, { label: e.target.value })}
                  placeholder="Line item description"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateLineItem(item.id, { amount: Number(e.target.value) || 0 })}
                  className="w-32"
                />
                <Button variant="ghost" size="icon" onClick={() => removeLineItem(item.id)} aria-label="Remove line item">
                  <Trash2 className="h-4 w-4 text-rust" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              Add line item
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Discounts</CardTitle>
            <CardDescription>Toggle any discount to apply it to this quote.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={autoSuggestDiscounts}>
            <Sparkles className="h-4 w-4" /> Auto-suggest eligible
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {discountRules.map((rule) => (
            <button
              type="button"
              key={rule.id}
              onClick={() => toggleDiscount(rule.id)}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                selectedDiscountIds.includes(rule.id) ? "border-amber bg-amber/10" : "border-ink/10"
              }`}
            >
              <span className="text-sm font-medium text-ink">{rule.label}</span>
              <span className="flex items-center gap-2">
                {!rule.active && <Badge variant="neutral">Inactive</Badge>}
                <span className="text-sm text-steel">
                  {rule.valueType === "percentage" ? `${rule.value}%` : formatCurrency(rule.value)}
                </span>
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-steel">Subtotal</span>
            <span className="font-mono text-ink">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-steel">Discounts</span>
            <span className="font-mono text-rust">-{formatCurrency(discountTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-3 font-display text-lg font-semibold">
            <span className="text-ink">Total</span>
            <span className="text-ink">{formatCurrency(total)}</span>
          </div>
          <div>
            <Label htmlFor="cq-notes">Notes for this quote (optional)</Label>
            <Textarea id="cq-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {savedNotice && <p className="text-sm text-navgreen">Quote saved.</p>}
          <Button variant="amber" size="lg" onClick={saveQuote} disabled={!client || lineItems.length === 0}>
            Save Quote
          </Button>
        </CardContent>
      </Card>

      {customQuotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent custom quotes</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-ink/10 p-0">
            {customQuotes.map((q) => (
              <div key={q.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{q.clientName} — {formatCurrency(q.total)}</p>
                  <p className="text-xs text-steel2">{formatDate(q.createdAt)} · {q.lineItems.length} line item(s)</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={q.status === "accepted" ? "green" : q.status === "sent" ? "amber" : "neutral"}>
                    {q.status}
                  </Badge>
                  {q.status === "draft" && (
                    <Button size="sm" variant="outline" onClick={() => updateCustomQuoteStatus(q.id, "sent")}>
                      Mark sent
                    </Button>
                  )}
                  {q.status === "sent" && (
                    <Button size="sm" variant="outline" onClick={() => updateCustomQuoteStatus(q.id, "accepted")}>
                      Mark accepted
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
