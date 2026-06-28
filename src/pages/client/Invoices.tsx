import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PayabilityBadge } from "@/components/aviation/PayabilityBadge";
import { useClientInvoices } from "@/lib/supabase-client-hooks";
import { useSettings } from "@/lib/settings-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { startInvoiceCheckout } from "@/lib/stripe-client";

const STATUS_VARIANT = {
  unpaid: "rust",
  deposit_paid: "amber",
  paid: "green",
  overdue: "rust",
} as const;

export default function Invoices() {
  const [notice, setNotice] = useState<string | null>(null);
  const { businessSettings } = useSettings();
  const { data: invoices } = useClientInvoices();

  async function handlePay(invoiceId: string) {
    try {
      await startInvoiceCheckout(invoiceId);
    } catch {
      setNotice("Online payment isn't connected yet — see README for Stripe setup.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Invoices</h1>
        <p className="text-sm text-steel">Review and pay invoices for completed or scheduled work.</p>
      </div>

      {notice && (
        <div className="rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amberDark">
          {notice}
        </div>
      )}

      <Card>
        <CardContent className="divide-y divide-ink/10 p-0">
          {invoices.map((inv, idx) => (
            <div key={inv.id} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-mono text-steel2">
                  {businessSettings.invoice.invoicePrefix}-{String(1000 + idx)}
                </p>
                <p className="font-medium text-ink">{formatCurrency(inv.amount)}</p>
                <p className="text-xs text-steel2">
                  Issued {formatDate(inv.issuedAt)}{inv.dueAt ? ` · Due ${formatDate(inv.dueAt)}` : ""}
                </p>
                {inv.depositAmount && (
                  <p className="text-xs text-steel2">Deposit paid: {formatCurrency(inv.depositAmount)}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status.replace("_", " ")}</Badge>
                <PayabilityBadge payable />
                {inv.status !== "paid" && (
                  <Button size="sm" variant="amber" onClick={() => handlePay(inv.id)}>
                    Pay now
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-steel2">{businessSettings.invoice.footerNote}</p>
    </div>
  );
}
