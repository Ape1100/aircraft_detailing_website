import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrandBackdrop } from "@/components/layout/BrandBackdrop";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useSettings } from "@/lib/settings-store";
import { useAuth } from "@/lib/auth-provider";

export default function Signup() {
  const navigate = useNavigate();
  const { businessSettings } = useSettings();
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  return (
    <BrandBackdrop background={businessSettings.background} className="flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/">
            <BrandLogo />
          </Link>
          <CardTitle className="mt-4">Create your account</CardTitle>
          <CardDescription>
            Set up a profile to track aircraft, requests, invoices, and
            detailing reports over time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {needsConfirmation ? (
            <p className="text-sm text-steel">
              Almost there — we've sent a confirmation link to your email. Click it, then{" "}
              <Link to="/login" className="text-amberDark hover:underline">sign in</Link>.
            </p>
          ) : (
            <>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  const form = e.currentTarget as HTMLFormElement;
                  const name = (form.elements.namedItem("su-name") as HTMLInputElement).value;
                  const email = (form.elements.namedItem("su-email") as HTMLInputElement).value;
                  const company = (form.elements.namedItem("su-company") as HTMLInputElement).value;
                  const password = (form.elements.namedItem("su-password") as HTMLInputElement).value;
                  try {
                    const { needsEmailConfirmation } = await signUp(name, email, company, password);
                    if (needsEmailConfirmation) {
                      setNeedsConfirmation(true);
                    } else {
                      navigate("/portal/dashboard");
                    }
                  } catch (err) {
                    setError((err as Error).message);
                  }
                }}
              >
                <div>
                  <Label htmlFor="su-name">Full name</Label>
                  <Input id="su-name" required placeholder="Jordan Avery" />
                </div>
                <div>
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" required placeholder="jordan@example.com" />
                </div>
                <div>
                  <Label htmlFor="su-company">Company (optional)</Label>
                  <Input id="su-company" placeholder="Avery Aviation LLC" />
                </div>
                <div>
                  <Label htmlFor="su-password">Password</Label>
                  <Input id="su-password" type="password" required placeholder="••••••••" />
                </div>
                <Button type="submit" variant="amber" className="w-full">
                  Create Account
                </Button>
              </form>
              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
              <p className="mt-4 text-center text-sm text-steel">
                Already have an account? <Link to="/login" className="text-amberDark hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </BrandBackdrop>
  );
}
