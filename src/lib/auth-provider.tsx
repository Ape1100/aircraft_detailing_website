import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
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
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      if (data.session?.user?.id) {
        const loadedProfile = await loadProfile(data.session.user.id);
        setProfile(loadedProfile);
      }
      setLoading(false);
    }

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user?.id) {
          const loadedProfile = await loadProfile(session.user.id);
          setProfile(loadedProfile);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,

      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, company: company || null } },
        });

        if (error) {
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
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
      },
    }),
    [profile, session]
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
