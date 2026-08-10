// Public surface for Supabase-backed prompt storage.
//
// The implementation lives in ./supabase/*. This file stays as the single import
// path the app uses, so call sites do not need to know which module a given
// helper sits in.
//
// Note for anyone upgrading from 1.x: `setCustomUserId` is gone. Ownership is
// now the Supabase Auth user id, which the database verifies. A user id the
// client can choose is a user id the client can change, and that is precisely
// what allowed cross-account access before. Use the sign-in flow instead.

export {
  clearClientCache,
  createSupabaseClient,
  describeCredentialProblem,
  getSupabaseClient,
  getSupabaseCredentials,
  hasBuildTimeCredentials,
  isSupabaseConfigured,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  SUPABASE_URL_KEY,
  SUPABASE_KEY_KEY,
  type PromptzyClient,
  type SupabaseCredentials,
} from '@/integrations/supabase/client';

export {
  describeEmailProblem,
  describePasswordProblem,
  getCurrentSession,
  getCurrentUser,
  getCurrentUserId,
  onAuthStateChange,
  signIn,
  signOut,
  signUp,
  type AuthResult,
} from './supabase/auth';

export {
  deletePrompt,
  getPrompts,
  savePrompt,
  syncPrompts,
  type SyncSummary,
  type WriteResult,
} from './supabase/prompts';

export {
  checkTableExists,
  getSupabaseDiagnostics,
  testSupabaseConnection,
  type SupabaseDiagnostics,
} from './supabase/diagnostics';

export {
  ensureUuid,
  promptToRow,
  rowToPrompt,
  UUID_REGEX,
  type PromptRow,
} from './supabase/promptMapper';

export { SETUP_SQL } from './supabase/setupSql';

export {
  buildExport,
  buildExportFilename,
  EXPORT_FORMAT,
  EXPORT_VERSION,
  parseImport,
  serializeExport,
  type ParseResult,
  type PromptExport,
} from './supabase/transfer';
