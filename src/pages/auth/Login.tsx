import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrandBackdrop } from "@/components/layout/BrandBackdrop";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useSettings } from "@/lib/settings-store";
import { useAuth } from "@/lib/auth-provider";

export default function Login() {
  const navigate = useNavigate();
  const { businessSettings } = useSettings();
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isAdminTab, setIsAdminTab] = useState(false);

  return (
    <BrandBackdrop background={businessSettings.background} className="flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/">
            <BrandLogo />
          </Link>
          <CardTitle className="mt-4">Sign in</CardTitle>
          <CardDescription>
            Sign in with your account. The "Admin" tab is just a shortcut —
            access is determined by your account's role, not which tab you use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="client">
            <TabsList className="w-full">
              <TabsTrigger value="client" className="flex-1">Client</TabsTrigger>
              <TabsTrigger value="admin" className="flex-1">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="client">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  const form = e.currentTarget as HTMLFormElement;
                  const email = (form.elements.namedItem("login-email") as HTMLInputElement).value;
                  const password = (form.elements.namedItem("login-password") as HTMLInputElement).value;
                  try {
                    const profile = await signIn(email, password);
                    if (profile?.role === "admin") {
                      navigate("/admin/dashboard");
                    } else {
                      navigate("/portal/dashboard");
                    }
                  } catch (err) {
                    setError((err as Error).message);
                  }
                }}
              >
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" required placeholder="dana@whitfieldaviation.com" />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" required placeholder="••••••••" />
                </div>
                <Button type="submit" variant="amber" className="w-full">
                  Sign in to Client Portal
                </Button>
              </form>
              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
              <p className="mt-4 text-center text-sm text-steel">
                New here? <Link to="/signup" className="text-amberDark hover:underline">Create an account</Link>
              </p>
            </TabsContent>

            <TabsContent value="admin">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  const form = e.currentTarget as HTMLFormElement;
                  const email = (form.elements.namedItem("admin-email") as HTMLInputElement).value;
                  const password = (form.elements.namedItem("admin-password") as HTMLInputElement).value;
                  try {
                    const profile = await signIn(email, password);
                    if (profile?.role === "admin") {
                      navigate("/admin/dashboard");
                    } else {
                      navigate("/portal/dashboard");
                    }
                  } catch (err) {
                    setError((err as Error).message);
                  }
                }}
              >
                <div>
                  <Label htmlFor="admin-email">Admin email</Label>
                  <Input id="admin-email" type="email" required placeholder="ops@brightworkaero.com" />
                </div>
                <div>
                  <Label htmlFor="admin-password">Password</Label>
                  <Input id="admin-password" type="password" required placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full">
                  Sign in to Admin Portal
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </BrandBackdrop>
  );
}
