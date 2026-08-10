// Guards on the read and write paths.
//
// In 1.x a signed-out client still got an identity, from a localStorage value
// anyone could set, and the delete path applied no ownership filter at all.
// These tests drive the real functions and assert that without a verified
// session nothing reads and nothing writes.
import { beforeEach, describe, expect, it } from 'vitest';
import { clearClientCache, saveSupabaseCredentials } from '@/integrations/supabase/client';
import { deletePrompt, getPrompts, savePrompt, syncPrompts } from './prompts';
import { getCurrentUserId } from './auth';
import type { Prompt } from '@/types';

const VALID_URL = 'https://exampleproject.supabase.co';
const VALID_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-key-long-enough';

const prompt: Prompt = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  text: 'Draft a changelog entry.',
  tags: [{ id: 'docs', name: 'docs' }],
  createdAt: '2026-03-01T12:00:00.000Z',
  type: 'task',
};

beforeEach(() => {
  localStorage.clear();
  clearClientCache();
});

describe('with no project configured', () => {
  it('has no user id to fall back on', async () => {
    await expect(getCurrentUserId()).resolves.toBeNull();
  });

  it('reads nothing', async () => {
    await expect(getPrompts()).resolves.toEqual([]);
  });

  it('refuses to save', async () => {
    const result = await savePrompt(prompt);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no supabase project is configured/i);
  });

  it('refuses to delete', async () => {
    const result = await deletePrompt(prompt.id);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no supabase project is configured/i);
  });
});

describe('configured but signed out', () => {
  beforeEach(() => {
    saveSupabaseCredentials(VALID_URL, VALID_KEY);
  });

  it('resolves no user id, rather than inventing a local one', async () => {
    await expect(getCurrentUserId()).resolves.toBeNull();
  });

  it('does not invent an anonymous identity in localStorage', async () => {
    await getPrompts();

    const keys = Object.keys(localStorage);
    expect(keys).not.toContain('custom-user-id');
    expect(keys).not.toContain('supabase-anonymous-id');
  });

  it('reads nothing', async () => {
    await expect(getPrompts()).resolves.toEqual([]);
  });

  it('refuses to save', async () => {
    const result = await savePrompt(prompt);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/signed in/i);
  });

  it('refuses to delete', async () => {
    const result = await deletePrompt(prompt.id);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/signed in/i);
  });

  it('reports every prompt as failed when syncing while signed out', async () => {
    await expect(syncPrompts([prompt, { ...prompt, id: '' }])).resolves.toEqual({
      synced: 0,
      failed: 2,
    });
  });
});

describe('public surface', () => {
  it('no longer exports a way to choose your own user id', async () => {
    const store = await import('@/lib/supabasePromptStore');
    expect(store).not.toHaveProperty('setCustomUserId');
  });
});
