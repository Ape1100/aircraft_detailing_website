import { Seo } from "@/components/Seo";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrandBackdrop } from "@/components/layout/BrandBackdrop";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useSettings } from "@/lib/settings-store";
import { useAuth } from "@/lib/auth-provider";

export default function ForgotPassword() {
  const { businessSettings } = useSettings();
  const { sendPasswordReset } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <BrandBackdrop background={businessSettings.background} className="flex min-h-screen items-center justify-center px-6 py-16">
      <Seo path="/forgot-password" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/">
            <BrandLogo />
          </Link>
          <CardTitle className="mt-4">Reset your password</CardTitle>
          <CardDescription>
            Enter your account email and we'll send you a link to set a new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-steel">
              If an account exists for that email, a reset link is on its way. Click it to
              choose a new password, then{" "}
              <Link to="/login" className="text-amberDark hover:underline">sign in</Link>.
            </p>
          ) : (
            <>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement;
                  const email = (form.elements.namedItem("fp-email") as HTMLInputElement).value;
                  setSubmitting(true);
                  try {
                    await sendPasswordReset(email);
                  } catch {
                    // Deliberately swallowed: always show the same generic
                    // confirmation regardless of outcome so this form can't
                    // be used to enumerate which emails have accounts.
                  } finally {
                    setSubmitting(false);
                    setSent(true);
                  }
                }}
              >
                <div>
                  <Label htmlFor="fp-email">Email</Label>
                  <Input id="fp-email" type="email" required placeholder="dana@whitfieldaviation.com" />
                </div>
                <Button type="submit" variant="amber" className="w-full" disabled={submitting}>
                  {submitting ? "Sending..." : "Send reset link"}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-steel">
                Remembered it? <Link to="/login" className="text-amberDark hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </BrandBackdrop>
  );
}
