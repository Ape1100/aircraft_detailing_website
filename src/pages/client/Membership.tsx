import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_MEMBERSHIP } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { startMembershipSubscription } from "@/lib/stripe-client";

const TIER_LABEL: Record<string, string> = {
  ramp_ready: "Ramp Ready",
  owner_care: "Owner Care",
  preservation: "Preservation",
  fleet_fbo: "Fleet / FBO",
};

export default function Membership() {
  const [notice, setNotice] = useState<string | null>(null);

  async function handleManage() {
    try {
      await startMembershipSubscription(MOCK_MEMBERSHIP.tier);
    } catch {
      setNotice("Subscription management isn't connected yet — see README for Stripe setup.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Membership</h1>
        <p className="text-sm text-steel">Your recurring care plan and billing.</p>
      </div>

      {notice && (
        <div className="rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amberDark">
          {notice}
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{TIER_LABEL[MOCK_MEMBERSHIP.tier]}</CardTitle>
            <CardDescription>Active since {formatDate(MOCK_MEMBERSHIP.startedAt)}</CardDescription>
          </div>
          <Badge variant="green">{MOCK_MEMBERSHIP.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="font-display text-3xl font-semibold text-ink">
            {MOCK_MEMBERSHIP.monthlyAmount ? `${formatCurrency(MOCK_MEMBERSHIP.monthlyAmount)}/mo` : "Custom pricing"}
          </p>
          <ul className="space-y-2 text-sm text-steel">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-navgreen" /> Monthly exterior wash</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-navgreen" /> Monthly interior refresh</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-navgreen" /> Quarterly belly cleaning</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-navgreen" /> Priority scheduling</li>
          </ul>
          <div className="flex gap-3">
            <Button variant="amber" onClick={handleManage}>Manage billing</Button>
            <Button variant="outline">Change plan</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
