import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { usePostHog } from "posthog-js/react";
import { supabase } from "./supabase-client";
import type { ClientProfile } from "@/types";

interface AuthContextValue {
  session: Session | null;
  profile: ClientProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<ClientProfile | null>;
  signUp: (
    name: string,
    email: string,
    company: string,
    password: string
  ) => Promise<{ profile: ClientProfile | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** supabase-js's GoTrueClient coordinates session reads/writes across
 * browser tabs using the Web Locks API (lock name
 * "sb-<project-ref>-auth-token"). If that lock is ever left held — a
 * tab closed mid-operation, a browser quirk — every future call that
 * needs it (getSession, signInWithPassword, signUp, signOut) hangs
 * forever: no error, no network request, nothing. Confirmed via
 * navigator.locks.query() during a real stuck session on the live
 * site. This wraps those calls with a hard timeout so a stuck lock
 * degrades to "treat as signed out, let the user retry" instead of
 * freezing the app permanently with zero recovery path. */
function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 8000): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

function timeoutError(action: string) {
  return new Error(`${action} timed out — please refresh the page and try again.`);
}

async function loadProfile(userId: string): Promise<ClientProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,role,name,email,phone,company")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ClientProfile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const posthog = usePostHog();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const trackAuthFailure = (
    flow: "sign_in" | "sign_up" | "reset_password" | "update_password",
    error: unknown,
    email?: string
  ) => {
    const errorMessage = error instanceof Error ? error.message : typeof error === "string" ? error : "unknown";
    const errorCode =
      typeof error === "object" && error !== null && "code" in error && typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : undefined;

    posthog?.capture("auth_password_error", {
      flow,
      error_code: errorCode ?? "unknown",
      error_message: errorMessage,
      email_domain: email?.split("@")[1] ?? null,
      source: "auth_provider",
    });
  };

  useEffect(() => {
    async function init() {
      const { data } = await withTimeout(supabase.auth.getSession(), { data: { session: null }, error: null });
      setSession(data.session ?? null);
      if (data.session?.user?.id) {
        const loadedProfile = await loadProfile(data.session.user.id);
        setProfile(loadedProfile);
      }
      setLoading(false);
    }

    init();

    // This callback MUST stay synchronous. supabase-js awaits it directly
    // inside the same exclusive lock that signInWithPassword/getSession
    // hold for their entire duration (confirmed in GoTrueClient's
    // _notifyAllSubscribers, called from inside _acquireLock(-1, ...) —
    // wait forever, no timeout). loadProfile() queries `profiles` through
    // the same Supabase client; if that needs to validate the session
    // token via GoTrueClient internally, it tries to acquire that same
    // lock again and deadlocks against itself forever — no error, no
    // network request, the lock just stays held permanently. This is
    // Supabase's own documented gotcha and workaround: keep the callback
    // synchronous, defer any async follow-up with setTimeout so it runs
    // after this callback (and the lock it's holding) has already
    // returned.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setTimeout(() => {
        if (session?.user?.id) {
          loadProfile(session.user.id).then(setProfile);
        } else {
          setProfile(null);
        }
      }, 0);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,

      signIn: async (email, password) => {
        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          { data: { user: null, session: null }, error: timeoutError("Sign-in") } as Awaited<
            ReturnType<typeof supabase.auth.signInWithPassword>
          >
        );

        if (error) {
          trackAuthFailure("sign_in", error, email);
          throw error;
        }

        const userId = data.session?.user?.id;
        if (!userId) {
          return null;
        }

        const loadedProfile = await loadProfile(userId);
        setProfile(loadedProfile);
        setSession(data.session);
        return loadedProfile;
      },

      signUp: async (name, email, company, password) => {
        // The profiles row is NOT inserted here. A database trigger
        // (handle_new_user, see supabase/schema.sql) creates it
        // automatically when the auth.users row lands, using the
        // metadata passed below — that's the only path that works
        // regardless of whether email confirmation is pending (profiles
        // has no client-side insert policy, and even if it did, there's
        // no authenticated session yet to satisfy an auth.uid() check
        // at this exact moment).
        const { data, error } = await withTimeout(
          supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name, company: company || null },
              // Without this, Supabase falls back to the project's
              // dashboard-configured Site URL for the confirmation link —
              // which is whatever it was last set to (often a stale
              // localhost dev value), regardless of where signup actually
              // happened. Pinning it to the real origin keeps confirmation
              // links working in dev and prod without depending on
              // dashboard state staying in sync.
              emailRedirectTo: `${window.location.origin}/login`,
            },
          }),
          { data: { user: null, session: null }, error: timeoutError("Sign-up") } as Awaited<
            ReturnType<typeof supabase.auth.signUp>
          >
        );

        if (error) {
          trackAuthFailure("sign_up", error, email);
          throw error;
        }

        const userId = data.user?.id || data.session?.user?.id;
        if (!userId) {
          return { profile: null, needsEmailConfirmation: false };
        }

        if (!data.session) {
          // Email confirmation is required — the profiles row already
          // exists (the trigger ran), but there's no session yet to
          // read it back under RLS. The caller should prompt the user
          // to confirm their email rather than treating this as signed in.
          return { profile: null, needsEmailConfirmation: true };
        }

        const loadedProfile = await loadProfile(userId);
        setProfile(loadedProfile);
        setSession(data.session);
        return { profile: loadedProfile, needsEmailConfirmation: false };
      },

      signOut: async () => {
        await withTimeout(supabase.auth.signOut(), { error: null });
        setProfile(null);
        setSession(null);
      },

      sendPasswordReset: async (email) => {
        const { error } = await withTimeout(
          supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          }),
          { data: {}, error: timeoutError("Password reset request") } as unknown as Awaited<
            ReturnType<typeof supabase.auth.resetPasswordForEmail>
          >
        );

        if (error) {
          trackAuthFailure("reset_password", error, email);
          throw error;
        }
      },

      updatePassword: async (newPassword) => {
        const { error } = await withTimeout(
          supabase.auth.updateUser({ password: newPassword }),
          { data: { user: null }, error: timeoutError("Password update") } as Awaited<
            ReturnType<typeof supabase.auth.updateUser>
          >
        );

        if (error) {
          trackAuthFailure("update_password", error);
          throw error;
        }
      },
    }),
    [profile, session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
