import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth-provider";

/** Same pattern as RequireAdmin, mirrored for /portal — gates on
 * profiles.role === "client". Logged-out visitors and admin-role
 * accounts are both redirected to /login (the client portal and admin
 * portal are kept separate; an admin who needs to view client-facing
 * pages should do so from their own account, not by reusing this one). */
export function RequireClient() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-steel">
        Loading…
      </div>
    );
  }

  if (!session || profile?.role !== "client") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
