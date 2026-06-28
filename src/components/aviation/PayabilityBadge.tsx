import { Clock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** The one piece of UI that must never be ambiguous: is this number safe
 * to charge a card for, or could it still change? Every place a price is
 * shown to a customer or admin should render one of these two states —
 * deliberately a different badge color AND icon, not just text, since a
 * mislabeled price is exactly the kind of thing a quick glance should
 * catch. See create-checkout-session.ts for the policy this enforces. */
export function PayabilityBadge({ payable }: { payable: boolean }) {
  if (payable) {
    return (
      <Badge variant="green">
        <ShieldCheck className="h-3.5 w-3.5" />
        Finalized — Ready to Pay
      </Badge>
    );
  }
  return (
    <Badge variant="amber">
      <Clock className="h-3.5 w-3.5" />
      Pending Verification
    </Badge>
  );
}
