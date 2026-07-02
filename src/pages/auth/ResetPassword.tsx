import { Seo } from "@/components/Seo";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrandBackdrop } from "@/components/layout/BrandBackdrop";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useSettings } from "@/lib/settings-store";
import { useAuth } from "@/lib/auth-provider";
import { supabase } from "@/lib/supabase-client";

type LinkStatus = "checking" | "valid" | "invalid";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { businessSettings } = useSettings();
  const { session, updatePassword } = useAuth();
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("checking");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // supabase-js starts parsing access_token/refresh_token out of the URL
    // hash the moment the client is constructed (module load, ahead of
    // React mounting), so the PASSWORD_RECOVERY event can fire and be
    // missed before this listener attaches. getSession() below covers that
    // race by checking whether a session already landed; the session from
    // useAuth() (AuthProvider's own longer-lived listener) is a second
    // fallback in the other direction. If the link is expired, already
    // used, or was minted by a different Supabase project (mismatched
    // signing key), verification fails silently — no error event, nothing
    // ever fires — so the timeout is what turns that silence into a
    // visible "link is invalid" state instead of a page that hangs forever.
    let cancelled = false;

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setLinkStatus("valid");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) {
        setLinkStatus((prev) => (prev === "checking" ? "valid" : prev));
      }
    });

    const timer = setTimeout(() => {
      setLinkStatus((prev) => (prev === "checking" ? "invalid" : prev));
    }, 5000);

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (session) {
      setLinkStatus((prev) => (prev === "checking" ? "valid" : prev));
    }
  }, [session]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const password = (form.elements.namedItem("new-password") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirm-password") as HTMLInputElement).value;

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BrandBackdrop background={businessSettings.background} className="flex min-h-screen items-center justify-center px-6 py-16">
      <Seo path="/reset-password" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/">
            <BrandLogo />
          </Link>
          <CardTitle className="mt-4">Set a new password</CardTitle>
          <CardDescription>
            {linkStatus === "checking" && "Verifying your reset link..."}
            {linkStatus === "valid" && !done && "Choose a new password for your account."}
            {linkStatus === "invalid" && "This reset link no longer works."}
            {done && "Password updated — redirecting you to sign in."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkStatus === "checking" ? (
            <p className="text-sm text-steel">One moment...</p>
          ) : linkStatus === "invalid" ? (
            <div className="space-y-4">
              <p className="text-sm text-red-600">
                This link is invalid, expired, or was already used. Request a new one below.
              </p>
              <Link to="/forgot-password">
                <Button variant="amber" className="w-full">Request a new link</Button>
              </Link>
            </div>
          ) : done ? null : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input id="new-password" type="password" required minLength={8} placeholder="••••••••" />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input id="confirm-password" type="password" required minLength={8} placeholder="••••••••" />
              </div>
              <Button type="submit" variant="amber" className="w-full" disabled={submitting}>
                {submitting ? "Updating..." : "Update password"}
              </Button>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </form>
          )}
        </CardContent>
      </Card>
    </BrandBackdrop>
  );
}
