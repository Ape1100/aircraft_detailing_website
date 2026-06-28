import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth-provider";

/** Gates everything under /admin on the real Supabase session's
 * profiles.role — RLS already protects the underlying data, but the UI
 * shouldn't rely on that as its only defense. Logged-out visitors and
 * client-role accounts are both redirected to /login; only a session
 * whose profile.role === "admin" renders the nested admin routes. */
export function RequireAdmin() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-steel">
        Loading…
      </div>
    );
  }

  if (!session || profile?.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
