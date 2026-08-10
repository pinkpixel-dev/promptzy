import { describe, expect, it } from 'vitest';
import {
  buildExport,
  buildExportFilename,
  EXPORT_FORMAT,
  parseImport,
  serializeExport,
} from './transfer';
import type { Prompt } from '@/types';

const prompt: Prompt = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  text: 'Write release notes for this change.',
  tags: [
    { id: 'release', name: 'release' },
    { id: 'docs', name: 'docs' },
  ],
  createdAt: '2026-02-01T08:00:00.000Z',
  type: 'task',
};

describe('export', () => {
  it('wraps prompts with format metadata', () => {
    const result = buildExport([prompt]);
    expect(result.format).toBe(EXPORT_FORMAT);
    expect(result.version).toBe(1);
    expect(result.count).toBe(1);
    expect(result.prompts).toEqual([prompt]);
    expect(Date.parse(result.exportedAt)).not.toBeNaN();
  });

  it('names the file by date', () => {
    expect(buildExportFilename(new Date('2026-08-10T12:00:00Z'))).toBe(
      'promptzy-prompts-2026-08-10.json',
    );
  });

  it('round-trips through serialize and parse without losing anything', () => {
    const { prompts } = parseImport(serializeExport([prompt]));
    expect(prompts).toEqual([prompt]);
  });

  it('handles an empty library', () => {
    expect(buildExport([]).count).toBe(0);
  });
});

describe('import: Promptzy export files', () => {
  it('reads a full export file', () => {
    const { prompts, skipped } = parseImport(serializeExport([prompt, { ...prompt, id: 'second' }]));
    expect(prompts).toHaveLength(2);
    expect(skipped).toEqual([]);
  });

  it('reads a bare array of prompts', () => {
    const { prompts } = parseImport(JSON.stringify([prompt]));
    expect(prompts[0].text).toBe(prompt.text);
  });
});

describe('import: raw Supabase table rows', () => {
  // What `SELECT json_agg(row_to_json(prompts))` gives you, which is what the
  // migration guide tells people to save before upgrading.
  const row = {
    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    content: 'Summarise this in three bullets.',
    tags: ['writing', 'summary'],
    createdat: '2026-01-15T10:30:00.000Z',
    title: 'Summarise this in three bullets.',
    category: 'image',
    description: '',
    user_id: 'sizzlebop',
    ispublic: false,
    likes: 0,
    views: 0,
    comments: 0,
  };

  it('maps content, createdat, and category across', () => {
    const { prompts } = parseImport(JSON.stringify([row]));
    expect(prompts[0]).toEqual({
      id: row.id,
      text: 'Summarise this in three bullets.',
      tags: [
        { id: 'writing', name: 'writing' },
        { id: 'summary', name: 'summary' },
      ],
      createdAt: row.createdat,
      type: 'image',
    });
  });

  it('drops the old user_id rather than carrying it over', () => {
    const { prompts } = parseImport(JSON.stringify([row]));
    expect(prompts[0]).not.toHaveProperty('user_id');
  });
});

describe('import: messy input', () => {
  it('accepts tags given as plain strings', () => {
    const { prompts } = parseImport(JSON.stringify([{ ...prompt, tags: ['one', 'two'] }]));
    expect(prompts[0].tags).toEqual([
      { id: 'one', name: 'one' },
      { id: 'two', name: 'two' },
    ]);
  });

  it('drops blank and malformed tags', () => {
    const { prompts } = parseImport(
      JSON.stringify([{ ...prompt, tags: ['ok', '  ', 42, {}, { name: 'fine' }] }]),
    );
    expect(prompts[0].tags).toEqual([
      { id: 'ok', name: 'ok' },
      { id: 'fine', name: 'fine' },
    ]);
  });

  it('falls back to the task type for an unknown type', () => {
    const { prompts } = parseImport(JSON.stringify([{ ...prompt, type: 'nonsense' }]));
    expect(prompts[0].type).toBe('task');
  });

  it('substitutes a valid date for a broken one', () => {
    const { prompts } = parseImport(JSON.stringify([{ ...prompt, createdAt: 'not a date' }]));
    expect(Date.parse(prompts[0].createdAt)).not.toBeNaN();
  });

  it('imports the good entries and reports the bad ones', () => {
    const { prompts, skipped } = parseImport(
      JSON.stringify([prompt, { text: '   ' }, 'nonsense', { ...prompt, id: 'other' }]),
    );
    expect(prompts).toHaveLength(2);
    expect(skipped).toHaveLength(2);
    expect(skipped[0]).toMatch(/entry 2/i);
    expect(skipped[1]).toMatch(/entry 3/i);
  });

  it('leaves a missing id blank so a real UUID is minted on save', () => {
    const { prompts } = parseImport(JSON.stringify([{ text: 'No id here', tags: [] }]));
    expect(prompts[0].id).toBe('');
  });
});

describe('import: files that cannot be used', () => {
  it.each([
    ['', /empty/i],
    ['   ', /empty/i],
    ['not json at all', /not valid json/i],
    ['{"format":"promptzy-export"}', /no prompts found/i],
    ['[]', /contains no prompts/i],
    ['{"prompts":[]}', /contains no prompts/i],
    ['[{"nope":true}]', /no usable prompts/i],
  ])('rejects %j', (text, expected) => {
    expect(() => parseImport(text)).toThrow(expected);
  });

  it('does not throw on a CSV, but explains it is not JSON', () => {
    expect(() => parseImport('id,content\n1,hello')).toThrow(/not valid json/i);
  });
});
