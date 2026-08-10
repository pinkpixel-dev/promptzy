// Export and import of a prompt library as JSON.
//
// Parsing is deliberately forgiving about shape, because the files people
// actually have come from three places: this app's own export, a raw
// `json_agg(row_to_json(prompts))` out of the Supabase SQL editor, and
// hand-edited versions of either. All three are accepted.
//
// It is not forgiving about content. Anything without usable prompt text is
// reported rather than silently imported as an empty prompt.
import { rowToPrompt, type PromptRow } from './promptMapper';
import type { Prompt, Tag } from '@/types';

export const EXPORT_FORMAT = 'promptzy-export';
export const EXPORT_VERSION = 1;

export interface PromptExport {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  count: number;
  prompts: Prompt[];
}

export interface ParseResult {
  prompts: Prompt[];
  /** Human-readable problems with individual entries, safe to show in the UI. */
  skipped: string[];
}

export const buildExport = (prompts: Prompt[]): PromptExport => ({
  format: EXPORT_FORMAT,
  version: EXPORT_VERSION,
  exportedAt: new Date().toISOString(),
  count: prompts.length,
  prompts,
});

export const serializeExport = (prompts: Prompt[]): string =>
  JSON.stringify(buildExport(prompts), null, 2);

/** `promptzy-prompts-2026-08-10.json` */
export const buildExportFilename = (date = new Date()): string =>
  `promptzy-prompts-${date.toISOString().slice(0, 10)}.json`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Tags arrive as `Tag[]` from our export, or `string[]` from a raw table row. */
const normaliseTags = (value: unknown): Tag[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry): Tag[] => {
    if (typeof entry === 'string') {
      const name = entry.trim();
      return name ? [{ id: name, name }] : [];
    }
    if (isRecord(entry) && typeof entry.name === 'string') {
      const name = entry.name.trim();
      if (!name) return [];
      return [{ id: typeof entry.id === 'string' && entry.id ? entry.id : name, name }];
    }
    return [];
  });
};

const PROMPT_TYPES = ['system', 'task', 'image', 'video'] as const;
type PromptType = (typeof PROMPT_TYPES)[number];

const normaliseType = (value: unknown): PromptType =>
  PROMPT_TYPES.includes(value as PromptType) ? (value as PromptType) : 'task';

const normaliseDate = (value: unknown): string => {
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return value;
  return new Date().toISOString();
};

/**
 * Turn one entry into a Prompt, whatever shape it arrived in.
 * Returns a reason string when the entry cannot be used.
 */
const parseEntry = (entry: unknown, index: number): Prompt | string => {
  const position = `Entry ${index + 1}`;

  if (!isRecord(entry)) return `${position}: not an object.`;

  // A raw table row uses `content`; our export uses `text`.
  const isTableRow = typeof entry.content === 'string' && typeof entry.text !== 'string';
  if (isTableRow) {
    const prompt = rowToPrompt(entry as unknown as PromptRow);
    if (!prompt.text.trim()) return `${position}: empty prompt text.`;
    return prompt;
  }

  if (typeof entry.text !== 'string' || !entry.text.trim()) {
    return `${position}: no prompt text found.`;
  }

  return {
    id: typeof entry.id === 'string' ? entry.id : '',
    text: entry.text,
    tags: normaliseTags(entry.tags),
    createdAt: normaliseDate(entry.createdAt ?? entry.createdat),
    type: normaliseType(entry.type ?? entry.category),
  };
};

/**
 * Read an export file.
 *
 * Throws only when the file is not usable at all. Individual bad entries are
 * collected in `skipped` so a mostly-good file still imports.
 */
export const parseImport = (text: string): ParseResult => {
  if (!text.trim()) throw new Error('That file is empty.');

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON. Export files end in .json.');
  }

  let entries: unknown[];
  if (Array.isArray(parsed)) {
    entries = parsed;
  } else if (isRecord(parsed) && Array.isArray(parsed.prompts)) {
    entries = parsed.prompts;
  } else {
    throw new Error('No prompts found in that file. Expected a list of prompts.');
  }

  if (entries.length === 0) throw new Error('That file contains no prompts.');

  const prompts: Prompt[] = [];
  const skipped: string[] = [];

  entries.forEach((entry, index) => {
    const result = parseEntry(entry, index);
    if (typeof result === 'string') skipped.push(result);
    else prompts.push(result);
  });

  if (prompts.length === 0) {
    throw new Error(`No usable prompts found. ${skipped[0] ?? ''}`.trim());
  }

  return { prompts, skipped };
};
