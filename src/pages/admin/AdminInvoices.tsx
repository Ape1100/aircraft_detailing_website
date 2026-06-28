import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PayabilityBadge } from "@/components/aviation/PayabilityBadge";
import { MOCK_INVOICES } from "@/lib/mock-data";
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
        <Button variant="amber">New Invoice</Button>
      </div>

      <Card>
        <CardContent className="divide-y divide-ink/10 p-0">
          {MOCK_INVOICES.map((inv, idx) => (
            <div key={inv.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-xs font-mono text-steel2">
                  {businessSettings.invoice.invoicePrefix}-{String(1000 + idx)}
                </p>
                <p className="text-sm font-medium text-ink">{formatCurrency(inv.amount)}</p>
                <p className="text-xs text-steel2">Issued {formatDate(inv.issuedAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status.replace("_", " ")}</Badge>
                <PayabilityBadge payable />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-steel2">
        Tax rate: {businessSettings.invoice.taxRatePercent}% · Deposit required: {businessSettings.invoice.depositPercent}% ·
        Terms: net {businessSettings.invoice.paymentTermsDays} days · Late fee: {businessSettings.invoice.lateFeePercent}%
      </p>
    </div>
  );
}
