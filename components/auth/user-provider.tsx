"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

export interface SessionUser {
  email: string;
  name: string;
  role: string;
  /** Cohort student id (set in user_metadata for student accounts) — used to
   *  resolve a student to their own team in the workspace view. */
  studentId: string | null;
}

interface UserContextValue {
  user: SessionUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

/** Build the user from auth metadata alone. `role` here is only a PRE-LOAD HINT —
 *  the authoritative role is read from profiles.role in resolveSessionUser(). */
function metaUser(u: User): SessionUser {
  const meta = u.user_metadata ?? {};
  return {
    email: u.email ?? "",
    name: (meta.full_name as string) || (u.email?.split("@")[0] ?? "Account"),
    role: (meta.role as string) || "Member",
    studentId: (meta.student_id as string) || null,
  };
}

/** Resolve the session user with the AUTHORITATIVE role of record: profiles.role —
 *  the same column the backend (require_admin) and RLS is_admin() trust, never
 *  client-supplied metadata. Read-only query scoped to the user's own row (RLS
 *  allows reading own profile). Falls back to the metadata hint if the read is
 *  empty (e.g. profile not yet created), so the UI never blocks on it. */
async function resolveSessionUser(
  supabase: ReturnType<typeof createClient>,
  u: User,
): Promise<SessionUser> {
  const base = metaUser(u);
  const { data } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", u.id)
    .single();
  if (data?.role) base.role = data.role as string;
  return base;
}

const UserContext = React.createContext<UserContextValue | null>(null);

/** App-wide auth state: fetched once and kept live via auth state changes, so it
 *  survives client-side navigation instead of refetching on every page mount. */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = React.useMemo(() => createClient(), []);
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      const su = data.user ? await resolveSessionUser(supabase, data.user) : null;
      if (!active) return;
      setUser(su);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      void resolveSessionUser(supabase, session.user).then((su) => {
        if (active) setUser(su);
      });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }, [supabase]);

  const value = React.useMemo<UserContextValue>(
    () => ({ user, loading, signOut }),
    [user, loading, signOut],
  );
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = React.useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
