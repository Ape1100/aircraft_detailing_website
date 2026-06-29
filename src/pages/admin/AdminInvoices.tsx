import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PayabilityBadge } from "@/components/aviation/PayabilityBadge";
import { addInvoice, useAdminClients, useAdminInvoices } from "@/lib/supabase-client-hooks";
import { useSettings } from "@/lib/settings-store";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_VARIANT = {
  unpaid: "rust",
  deposit_paid: "amber",
  paid: "green",
  overdue: "rust",
} as const;

export default function AdminInvoices() {
  const { businessSettings } = useSettings();
  const { data: invoices, refetch } = useAdminInvoices();
  const { data: clients } = useAdminClients();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setClientId("");
    setAmount("");
    setDepositAmount("");
    setDueAt("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !amount) {
      setError("Client and amount are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addInvoice(
        clientId,
        Number(amount),
        depositAmount ? Number(depositAmount) : null,
        dueAt ? new Date(dueAt).toISOString() : null,
        null
      );
      refetch();
      setOpen(false);
      resetForm();
    } catch (err) {
      setError((err as Error).message || "Failed to create invoice. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Invoices</h1>
          <p className="text-sm text-steel">
            All client invoices and payment status. Tax rate, deposit %, and payment terms are
            configured in Admin &gt; Settings.
          </p>
        </div>
        <Button variant="amber" onClick={() => setOpen(true)}>New Invoice</Button>
      </div>

      <Card>
        <CardContent className="divide-y divide-ink/10 p-0">
          {invoices.length === 0 ? (
            <p className="px-6 py-4 text-sm text-steel">No invoices yet.</p>
          ) : (
            invoices.map((inv, idx) => (
              <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-xs font-mono text-steel2">
                    {businessSettings.invoice.invoicePrefix}-{String(1000 + idx)}
                  </p>
                  <p className="text-sm font-medium text-ink">{formatCurrency(inv.amount)}</p>
                  <p className="text-xs text-steel2">
                    {inv.clientName} · Issued {formatDate(inv.issuedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status.replace("_", " ")}</Badge>
                  <PayabilityBadge payable />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-steel2">
        Tax rate: {businessSettings.invoice.taxRatePercent}% · Deposit required: {businessSettings.invoice.depositPercent}% ·
        Terms: net {businessSettings.invoice.paymentTermsDays} days · Late fee: {businessSettings.invoice.lateFeePercent}%
      </p>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New invoice</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="invoice-client">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="invoice-client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="invoice-amount">Amount ($)</Label>
                <Input
                  id="invoice-amount"
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="612.00"
                />
              </div>
              <div>
                <Label htmlFor="invoice-deposit">Deposit (optional)</Label>
                <Input
                  id="invoice-deposit"
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="invoice-due">Due date (optional)</Label>
              <Input id="invoice-due" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" variant="amber" className="w-full" disabled={submitting}>
              {submitting ? "Creating…" : "Create invoice"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
