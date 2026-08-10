// Account handling for Promptzy.
//
// Every prompt is owned by a Supabase Auth user id. That id comes from a signed
// JWT, so the database can verify it in an RLS policy. There is no client-chosen
// user id any more: a value the client picks is a value the client can change,
// which is exactly what made the old scheme unenforceable.
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/integrations/supabase/client';

export interface AuthResult {
  ok: boolean;
  /** Human-readable failure reason, safe to show in the UI. */
  error?: string;
  /** Set when a sign-up landed but the project still wants an email confirmed. */
  needsEmailConfirmation?: boolean;
}

const NOT_CONFIGURED = 'No Supabase project is configured. Add your project URL and anon key in Settings.';

/** The signed-in user, or null. Null simply means "show the sign-in screen". */
export const getCurrentUser = async (): Promise<User | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.auth.getSession();
  if (error) {
    console.error('Could not read Supabase session:', error);
    return null;
  }
  return data.session?.user ?? null;
};

/**
 * The owner id to read and write prompts under, or null when signed out.
 *
 * Callers must treat null as "do nothing". Falling back to a locally generated
 * id here is what let anyone claim anyone else's rows in earlier versions.
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const user = await getCurrentUser();
  return user?.id ?? null;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data } = await client.auth.getSession();
  return data.session ?? null;
};

export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: NOT_CONFIGURED };

  const { error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
};

export const signUp = async (email: string, password: string): Promise<AuthResult> => {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: NOT_CONFIGURED };

  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) return { ok: false, error: error.message };

  // With email confirmation enabled the user exists but has no session yet.
  const needsEmailConfirmation = Boolean(data.user) && !data.session;
  return { ok: true, needsEmailConfirmation };
};

export const signOut = async (): Promise<AuthResult> => {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: NOT_CONFIGURED };

  const { error } = await client.auth.signOut();
  if (error) return { ok: false, error: error.message };
  return { ok: true };
};

/**
 * Subscribe to sign-in and sign-out. Returns an unsubscribe function; calling it
 * when no project is configured is a harmless no-op.
 */
export const onAuthStateChange = (handler: (session: Session | null) => void): (() => void) => {
  const client = getSupabaseClient();
  if (!client) return () => undefined;

  const { data } = client.auth.onAuthStateChange((_event, session) => handler(session));
  return () => data.subscription.unsubscribe();
};

/** Basic password check, matching Supabase's own default minimum of 6 characters. */
export const describePasswordProblem = (password: string): string | null => {
  if (!password) return 'Enter a password.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
};

export const describeEmailProblem = (email: string): string | null => {
  const trimmed = email.trim();
  if (!trimmed) return 'Enter an email address.';
  // Deliberately loose: Supabase is the real validator, this only catches typos.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'That does not look like an email address.';
  return null;
};
