import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrandBackdrop } from "@/components/layout/BrandBackdrop";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useSettings } from "@/lib/settings-store";

export default function Signup() {
  const navigate = useNavigate();
  const { businessSettings } = useSettings();

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
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/portal/dashboard");
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
          <p className="mt-4 text-center text-sm text-steel">
            Already have an account? <Link to="/login" className="text-amberDark hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </BrandBackdrop>
  );
}
