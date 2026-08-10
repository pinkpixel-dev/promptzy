import { describe, expect, it } from 'vitest';
import { ensureUuid, promptToRow, rowToPrompt, UUID_REGEX, type PromptRow } from './promptMapper';
import type { Prompt } from '@/types';

const OWNER = '3f8c1d2e-9b4a-4c7d-8e1f-2a3b4c5d6e7f';

const buildRow = (overrides: Partial<PromptRow> = {}): PromptRow => ({
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  content: 'Summarise this in three bullets.',
  tags: ['writing', 'summary'],
  createdat: '2026-01-15T10:30:00.000Z',
  title: 'Summarise this in three bullets.',
  category: 'task',
  description: '',
  user_id: OWNER,
  ispublic: false,
  likes: 0,
  views: 0,
  comments: 0,
  ...overrides,
});

describe('ensureUuid', () => {
  it('keeps an id that is already a UUID', () => {
    const id = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
    expect(ensureUuid(id)).toBe(id);
  });

  it.each(['', 'not-a-uuid', '12345', 'a1b2c3d4-e5f6-4a7b-8c9d'])(
    'mints a real UUID for %j, since the column rejects anything else',
    (input) => {
      const result = ensureUuid(input);
      expect(result).toMatch(UUID_REGEX);
      expect(result).not.toBe(input);
    },
  );
});

describe('rowToPrompt', () => {
  it('maps a stored row onto the app shape', () => {
    expect(rowToPrompt(buildRow())).toEqual({
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      text: 'Summarise this in three bullets.',
      tags: [
        { id: 'writing', name: 'writing' },
        { id: 'summary', name: 'summary' },
      ],
      createdAt: '2026-01-15T10:30:00.000Z',
      type: 'task',
    });
  });

  it('falls back to the task type for an unrecognised category', () => {
    expect(rowToPrompt(buildRow({ category: 'nonsense' })).type).toBe('task');
  });

  it.each(['system', 'task', 'image', 'video'] as const)('preserves the %s category', (category) => {
    expect(rowToPrompt(buildRow({ category })).type).toBe(category);
  });

  it('survives a row with null tags', () => {
    expect(rowToPrompt(buildRow({ tags: null as unknown as string[] })).tags).toEqual([]);
  });
});

describe('promptToRow', () => {
  const prompt: Prompt = {
    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    text: 'Write release notes for this change.',
    tags: [{ id: 'release', name: 'release' }],
    createdAt: '2026-02-01T08:00:00.000Z',
    type: 'task',
  };

  it('stamps the row with the owner it was given', () => {
    expect(promptToRow(prompt, OWNER).user_id).toBe(OWNER);
  });

  it('flattens tags to the names the column stores', () => {
    expect(promptToRow(prompt, OWNER).tags).toEqual(['release']);
  });

  it('derives a title from the first 50 characters', () => {
    const long = { ...prompt, text: 'x'.repeat(120) };
    expect(promptToRow(long, OWNER).title).toHaveLength(50);
  });

  it('round-trips through rowToPrompt without losing anything', () => {
    expect(rowToPrompt(promptToRow(prompt, OWNER))).toEqual(prompt);
  });

  it('gives a prompt with no id a valid UUID before it reaches the database', () => {
    expect(promptToRow({ ...prompt, id: '' }, OWNER).id).toMatch(UUID_REGEX);
  });

  it('never marks a prompt public, since Promptzy has no sharing feature', () => {
    expect(promptToRow(prompt, OWNER).ispublic).toBe(false);
  });
});
