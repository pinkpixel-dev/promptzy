// Translation between the `prompts` table shape and the app's Prompt type.
// Kept separate from the query code so both sides can be tested without a
// database connection.
import type { Prompt } from '@/types';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PromptRow {
  id: string;
  content: string;
  tags: string[];
  createdat: string;
  title: string;
  category: string;
  description: string;
  user_id: string;
  ispublic: boolean;
  likes: number;
  views: number;
  comments: number;
}

const PROMPT_TYPES = ['system', 'task', 'image', 'video'] as const;
type PromptType = (typeof PROMPT_TYPES)[number];

const toPromptType = (value: string | null | undefined): PromptType =>
  PROMPT_TYPES.includes(value as PromptType) ? (value as PromptType) : 'task';

/**
 * The table's primary key is a UUID column, so a non-UUID id would be rejected
 * by Postgres. Prompts created in the UI before a first save can carry a
 * placeholder id, so mint a real one when needed.
 */
export const ensureUuid = (id: string): string => (UUID_REGEX.test(id ?? '') ? id : crypto.randomUUID());

export const rowToPrompt = (row: PromptRow): Prompt => ({
  id: row.id ?? '',
  text: row.content ?? '',
  tags: Array.isArray(row.tags)
    ? row.tags.map((name) => ({ id: name, name }))
    : [],
  createdAt: row.createdat ?? new Date().toISOString(),
  type: toPromptType(row.category),
});

/**
 * Build the row to persist. `userId` must be the signed-in user's auth id: the
 * insert and update policies compare it against auth.uid() and reject anything
 * else, so passing another user's id fails at the database rather than silently
 * writing to their data.
 */
export const promptToRow = (prompt: Prompt, userId: string): PromptRow => ({
  id: ensureUuid(prompt.id),
  content: prompt.text,
  tags: prompt.tags.map((tag) => tag.name),
  createdat: prompt.createdAt || new Date().toISOString(),
  title: (prompt.text ?? '').substring(0, 50),
  category: prompt.type || 'task',
  description: '',
  user_id: userId,
  ispublic: false,
  likes: 0,
  views: 0,
  comments: 0,
});
