// Prompt reads and writes.
//
// The database is the security boundary: the RLS policies in supabase-setup.sql
// scope every operation to auth.uid(). The user_id filters here are defence in
// depth and a way to fail early with a clear message. They are not what keeps
// one account out of another's data, and should never be treated as if they are.
import { getSupabaseClient } from '@/integrations/supabase/client';
import { getCurrentUserId } from './auth';
import { promptToRow, rowToPrompt, type PromptRow } from './promptMapper';
import type { Prompt } from '@/types';

export interface WriteResult {
  ok: boolean;
  error?: string;
}

const NOT_CONFIGURED = 'No Supabase project is configured.';
const NOT_SIGNED_IN = 'You need to be signed in to do that.';

/** Resolve the client and signed-in user together, since every call needs both. */
const getContext = async () => {
  const client = getSupabaseClient();
  if (!client) return { error: NOT_CONFIGURED } as const;

  const userId = await getCurrentUserId();
  if (!userId) return { error: NOT_SIGNED_IN } as const;

  return { client, userId } as const;
};

export const getPrompts = async (): Promise<Prompt[]> => {
  const context = await getContext();
  if ('error' in context) {
    console.warn('Skipping prompt load:', context.error);
    return [];
  }

  const { data, error } = await context.client
    .from('prompts')
    .select('*')
    .eq('user_id', context.userId)
    .order('createdat', { ascending: false });

  if (error) {
    console.error('Could not load prompts:', error);
    return [];
  }

  return (data ?? []).map((row) => rowToPrompt(row as PromptRow));
};

export const savePrompt = async (prompt: Prompt): Promise<WriteResult> => {
  const context = await getContext();
  if ('error' in context) return { ok: false, error: context.error };

  // user_id is stamped from the verified session, never from the caller. The
  // insert/update policies re-check it against auth.uid() regardless.
  const row = promptToRow(prompt, context.userId);

  const { error } = await context.client
    .from('prompts')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    console.error('Could not save prompt:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
};

export const deletePrompt = async (id: string): Promise<WriteResult> => {
  const context = await getContext();
  if ('error' in context) return { ok: false, error: context.error };

  const { error } = await context.client
    .from('prompts')
    .delete()
    .eq('id', id)
    .eq('user_id', context.userId);

  if (error) {
    console.error('Could not delete prompt:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
};

export interface SyncSummary {
  synced: number;
  failed: number;
}

export const syncPrompts = async (prompts: Prompt[]): Promise<SyncSummary> => {
  const summary: SyncSummary = { synced: 0, failed: 0 };

  for (const prompt of prompts) {
    const result = await savePrompt(prompt);
    if (result.ok) summary.synced += 1;
    else summary.failed += 1;
  }

  return summary;
};
