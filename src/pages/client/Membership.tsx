import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClientMembership } from "@/lib/supabase-client-hooks";
import { formatCurrency, formatDate } from "@/lib/utils";
import { openMembershipBillingPortal } from "@/lib/stripe-client";

const TIER_LABEL: Record<string, string> = {
  ramp_ready: "Ramp Ready",
  owner_care: "Owner Care",
  preservation: "Preservation",
  fleet_fbo: "Fleet / FBO",
};

export default function Membership() {
  const [notice, setNotice] = useState<string | null>(null);
  const { membership } = useClientMembership();

  async function handleManage() {
    if (!membership) {
      setNotice("No membership found yet. Create one from the admin portal or request a plan.");
      return;
    }

    try {
      // Opens Stripe's Billing Portal for the existing subscription.
      // Deliberately NOT startMembershipSubscription here — that creates a
      // brand new Checkout subscription session, which would start a
      // second parallel subscription (double billing) instead of managing
      // the one this client already has.
      await openMembershipBillingPortal();
    } catch (err) {
      setNotice((err as Error).message || "Failed to open billing portal. Please try again.");
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
            <CardTitle>{membership ? TIER_LABEL[membership.tier] : "No active membership"}</CardTitle>
            <CardDescription>
              {membership ? `Active since ${formatDate(membership.startedAt)}` : "No membership has been activated yet."}
            </CardDescription>
          </div>
          <Badge variant={membership?.status === "active" ? "green" : "amber"}>
            {membership?.status ?? "none"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="font-display text-3xl font-semibold text-ink">
            {membership?.monthlyAmount ? `${formatCurrency(membership.monthlyAmount)} / mo` : "Custom pricing"}
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
