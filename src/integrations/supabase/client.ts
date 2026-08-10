// Supabase client wiring.
//
// There is deliberately no built-in project to fall back on. Promptzy talks to
// the Supabase project you configure and nothing else. If no credentials are
// configured the client is `null` and the app shows its setup screen, rather
// than quietly connecting somewhere you did not choose.
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export type PromptzyClient = SupabaseClient<Database>;

// Storage keys for credentials entered through Settings
export const SUPABASE_URL_KEY = 'custom-supabase-url';
export const SUPABASE_KEY_KEY = 'custom-supabase-key';

// Build-time credentials, supplied by the Docker build args or a .env file.
// These are baked into the bundle at build time and act as the starting
// configuration for a deployment. Empty when the build did not supply them.
const BUILD_SUPABASE_URL = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '').trim();
const BUILD_SUPABASE_ANON_KEY = ((import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '').trim();

export interface SupabaseCredentials {
  supabaseUrl: string;
  supabaseKey: string;
}

const readStoredCredential = (key: string): string => {
  try {
    return (localStorage.getItem(key) ?? '').trim();
  } catch (error) {
    // localStorage throws in some privacy modes and in non-browser contexts.
    console.error(`Could not read "${key}" from localStorage:`, error);
    return '';
  }
};

/**
 * Resolve the Supabase credentials for this install.
 *
 * Credentials entered in Settings win over the build-time values, so a user can
 * point a prebuilt image at their own project without rebuilding it. Returns
 * empty strings when nothing is configured.
 */
export const getSupabaseCredentials = (): SupabaseCredentials => ({
  supabaseUrl: readStoredCredential(SUPABASE_URL_KEY) || BUILD_SUPABASE_URL,
  supabaseKey: readStoredCredential(SUPABASE_KEY_KEY) || BUILD_SUPABASE_ANON_KEY,
});

/** True when the build supplied credentials, so Settings can show where they came from. */
export const hasBuildTimeCredentials = (): boolean =>
  Boolean(BUILD_SUPABASE_URL && BUILD_SUPABASE_ANON_KEY);

/**
 * Check a URL/key pair for obvious problems before we try to use it.
 * Returns a human-readable reason, or null when the pair looks usable.
 */
export const describeCredentialProblem = ({ supabaseUrl, supabaseKey }: SupabaseCredentials): string | null => {
  if (!supabaseUrl && !supabaseKey) return 'No Supabase project is configured yet.';
  if (!supabaseUrl) return 'Supabase project URL is missing.';
  if (!supabaseKey) return 'Supabase anon key is missing.';

  // Catch a paste that landed inside an existing value instead of replacing it.
  // `new URL()` accepts the result, treating the second URL as a path, which
  // then fails much later as an opaque network or CSP error.
  if ((supabaseUrl.match(/https?:\/\//gi) ?? []).length > 1) {
    return 'That looks like two URLs pasted together. Clear the field and paste just one.';
  }

  let parsed: URL;
  try {
    parsed = new URL(supabaseUrl);
  } catch {
    return 'Supabase project URL is not a valid URL.';
  }

  if (parsed.protocol !== 'https:') return 'Supabase project URL must start with https://';

  if (!parsed.hostname.includes('.')) {
    return `"${parsed.hostname}" is not a complete domain. The URL should look like https://yourproject.supabase.co`;
  }

  // A project URL is just an origin. Anything trailing is usually a mangled
  // paste, or a dashboard link copied instead of the API URL.
  if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
    return 'Use only the project URL, with nothing after the domain. It should look like https://yourproject.supabase.co';
  }

  if (supabaseKey.length < 20) return 'Supabase anon key looks too short to be valid.';

  return null;
};

/** True when a usable URL and key are configured. */
export const isSupabaseConfigured = (): boolean =>
  describeCredentialProblem(getSupabaseCredentials()) === null;

export const saveSupabaseCredentials = (url: string, key: string): boolean => {
  try {
    localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(SUPABASE_KEY_KEY, key.trim());
    clearClientCache();
    return true;
  } catch (error) {
    console.error('Could not save Supabase credentials:', error);
    return false;
  }
};

/**
 * Forget credentials entered through Settings. The build-time values, if the
 * deployment was built with any, become active again.
 */
export const clearSupabaseCredentials = (): boolean => {
  try {
    localStorage.removeItem(SUPABASE_URL_KEY);
    localStorage.removeItem(SUPABASE_KEY_KEY);
    clearClientCache();
    return true;
  } catch (error) {
    console.error('Could not clear Supabase credentials:', error);
    return false;
  }
};

const CLIENT_OPTIONS = {
  auth: {
    autoRefreshToken: true,
    // Sessions must survive a reload, otherwise you would sign in on every visit.
    persistSession: true,
    detectSessionInUrl: true,
  },
} as const;

let cachedClient: PromptzyClient | null = null;
let cachedFor: string | null = null;

/** Drop the memoised client. Call after credentials change. */
export const clearClientCache = (): void => {
  cachedClient = null;
  cachedFor = null;
};

/**
 * The Supabase client for the configured project, or null when nothing is
 * configured. Callers must handle null: that is the app's "not set up yet"
 * state, not an error worth throwing over.
 */
export const getSupabaseClient = (): PromptzyClient | null => {
  const credentials = getSupabaseCredentials();
  if (describeCredentialProblem(credentials) !== null) {
    clearClientCache();
    return null;
  }

  const fingerprint = `${credentials.supabaseUrl}::${credentials.supabaseKey}`;
  if (cachedClient && cachedFor === fingerprint) return cachedClient;

  cachedClient = createClient<Database>(credentials.supabaseUrl, credentials.supabaseKey, CLIENT_OPTIONS);
  cachedFor = fingerprint;
  return cachedClient;
};

/**
 * Build an unmemoised client. Only needed when you want a client that is
 * isolated from the shared one, such as a connection test against credentials
 * the user is still typing.
 */
export const createSupabaseClient = (credentials?: SupabaseCredentials): PromptzyClient | null => {
  const resolved = credentials ?? getSupabaseCredentials();
  if (describeCredentialProblem(resolved) !== null) return null;
  return createClient<Database>(resolved.supabaseUrl, resolved.supabaseKey, CLIENT_OPTIONS);
};
