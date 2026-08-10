// Connection testing and diagnostics for the Settings screen.
import type { PromptzyClient } from '@/integrations/supabase/client';
import {
  createSupabaseClient,
  describeCredentialProblem,
  getSupabaseCredentials,
  getSupabaseClient,
} from '@/integrations/supabase/client';
import { getCurrentUserId } from './auth';

/** Postgres: relation does not exist. */
const UNDEFINED_TABLE = '42P01';
/** Postgres: insufficient privilege. What a correctly locked-down table returns to anon. */
const INSUFFICIENT_PRIVILEGE = '42501';

export type ConnectionOutcome =
  | 'reachable'
  | 'table-missing'
  | 'blocked-by-rls'
  | 'bad-credentials'
  | 'unreachable';

interface QueryError {
  code?: string;
  message?: string;
}

/**
 * Work out what a failed `prompts` query actually tells us about the connection.
 *
 * The important case is `42501`. Once the setup script has run, the `anon` role
 * holds no grants on the table, so a signed-out client is refused. That means we
 * reached the project and the policies are in force, which is a success, not a
 * connection failure. Treating it as a failure made "Connect" report an error on
 * a correctly configured project.
 */
export const classifyConnectionError = (error: QueryError | null | undefined): ConnectionOutcome => {
  if (!error) return 'reachable';

  if (error.code === UNDEFINED_TABLE) return 'table-missing';
  if (error.code === INSUFFICIENT_PRIVILEGE) return 'blocked-by-rls';

  const message = error.message ?? '';
  if (/permission denied|insufficient privilege/i.test(message)) return 'blocked-by-rls';
  if (/invalid api key|jwt|unauthorized|invalid.*token/i.test(message)) return 'bad-credentials';

  return 'unreachable';
};

/** Did we reach the project, whatever it then said about permissions? */
const isReachable = (outcome: ConnectionOutcome): boolean =>
  outcome === 'reachable' || outcome === 'table-missing' || outcome === 'blocked-by-rls';

/**
 * Does the prompts table exist?
 *
 * Postgres reports a missing table as 42P01. Anything else, including a refusal
 * because the anon role holds no grants, means the table is there.
 */
export const checkTableExists = async (client: PromptzyClient): Promise<boolean> => {
  try {
    const { error } = await client.from('prompts').select('id').limit(1);
    return classifyConnectionError(error) !== 'table-missing';
  } catch (err) {
    console.error('Could not check whether the prompts table exists:', err);
    return false;
  }
};

export interface SupabaseDiagnostics {
  url: string;
  keyLength: number;
  credentialProblem: string | null;
  networkConnectivity: boolean;
  corsIssue: boolean;
  authConnection: boolean;
  signedIn: boolean;
  dataConnection: boolean;
  tableExists: boolean;
  rlsEnforced: boolean | null;
  error?: string;
}

/**
 * Probe whether RLS is actually scoping reads.
 *
 * Run while signed out: a correctly configured project returns zero rows,
 * because no policy grants the anon role anything. Rows coming back here means
 * the permissive 1.x policy is still in place and the setup script has not been
 * re-run. Returns null when we cannot tell, such as when signed in.
 */
const probeRlsWhileSignedOut = async (client: PromptzyClient): Promise<boolean | null> => {
  const userId = await getCurrentUserId();
  if (userId) return null; // Signed in, so rows are expected and prove nothing.

  const { data, error } = await client.from('prompts').select('id').limit(1);

  if (error) {
    const outcome = classifyConnectionError(error);
    // Refused outright is the strongest possible signal that RLS is in force.
    if (outcome === 'blocked-by-rls') return true;
    if (outcome === 'table-missing') return null;
    return null;
  }

  // Readable while signed out means the permissive 1.x policy is still there.
  return (data?.length ?? 0) === 0;
};

export const getSupabaseDiagnostics = async (): Promise<SupabaseDiagnostics> => {
  const credentials = getSupabaseCredentials();
  const diagnostics: SupabaseDiagnostics = {
    url: credentials.supabaseUrl ? `${credentials.supabaseUrl.substring(0, 15)}...` : '(not set)',
    keyLength: credentials.supabaseKey.length,
    credentialProblem: describeCredentialProblem(credentials),
    networkConnectivity: false,
    corsIssue: false,
    authConnection: false,
    signedIn: false,
    dataConnection: false,
    tableExists: false,
    rlsEnforced: null,
    error: undefined,
  };

  if (diagnostics.credentialProblem) {
    diagnostics.error = diagnostics.credentialProblem;
    return diagnostics;
  }

  const client = getSupabaseClient();
  if (!client) {
    diagnostics.error = 'Could not build a Supabase client from the configured credentials.';
    return diagnostics;
  }

  try {
    // Reaching the configured project at all also answers the network question,
    // without calling out to any unrelated third party.
    const { error: authError } = await client.auth.getSession();
    diagnostics.authConnection = !authError;
    diagnostics.networkConnectivity = !authError;
    diagnostics.signedIn = Boolean(await getCurrentUserId());

    if (authError) {
      diagnostics.error = authError.message;
      return diagnostics;
    }
  } catch (err) {
    diagnostics.authConnection = false;
    if (err instanceof Error && /CORS|cross-origin/i.test(err.message)) {
      diagnostics.corsIssue = true;
      diagnostics.error = 'CORS issue: the browser blocked requests to this Supabase project.';
    } else if (err instanceof Error) {
      diagnostics.error = err.message;
    }
    return diagnostics;
  }

  try {
    const { error: healthError } = await client.from('prompts').select('id').limit(1);
    diagnostics.dataConnection = isReachable(classifyConnectionError(healthError));
    diagnostics.tableExists = await checkTableExists(client);
    diagnostics.rlsEnforced = await probeRlsWhileSignedOut(client);
  } catch (err) {
    diagnostics.dataConnection = false;
    if (!diagnostics.error && err instanceof Error) diagnostics.error = err.message;
  }

  return diagnostics;
};

/**
 * Can we reach the configured project?
 *
 * This deliberately only needs a URL and a key. Being signed out is not a
 * failure, and neither is the database refusing an anon read: once the setup
 * script has run, that refusal is the expected answer and proves the policies
 * are working. Only unreachable hosts and rejected credentials count as failures,
 * so a correctly configured project verifies before anyone has an account.
 */
export const testSupabaseConnection = async (credentials?: {
  supabaseUrl: string;
  supabaseKey: string;
}): Promise<boolean> => {
  const resolved = credentials ?? getSupabaseCredentials();
  const problem = describeCredentialProblem(resolved);
  if (problem) {
    console.error('Supabase credentials are not usable:', problem);
    return false;
  }

  const client = credentials ? createSupabaseClient(credentials) : getSupabaseClient();
  if (!client) return false;

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out after 5 seconds')), 5000),
    );

    const query = client.from('prompts').select('id').limit(1);
    const { error } = await Promise.race([query, timeout]);

    const outcome = classifyConnectionError(error);
    if (!isReachable(outcome)) {
      console.error(`Supabase connection check failed (${outcome}):`, error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Supabase connection test failed:', err);
    return false;
  }
};
