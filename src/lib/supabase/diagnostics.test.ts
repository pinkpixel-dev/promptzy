// The connection test must succeed on a correctly locked-down project.
//
// After the setup script runs, `anon` holds no grants on `prompts`, so a
// signed-out client is refused with 42501. The first version of this code read
// that as a connection failure, which meant "Connect" reported an error on a
// project that was in fact configured perfectly, before anyone could create an
// account. These tests pin the classification down.
import { describe, expect, it } from 'vitest';
import { classifyConnectionError } from './diagnostics';

describe('classifyConnectionError', () => {
  it('treats no error as reachable', () => {
    expect(classifyConnectionError(null)).toBe('reachable');
    expect(classifyConnectionError(undefined)).toBe('reachable');
  });

  it('reads 42501 as the database refusing anon, not as a broken connection', () => {
    expect(classifyConnectionError({ code: '42501' })).toBe('blocked-by-rls');
  });

  it('reads a permission denied message the same way when no code is given', () => {
    expect(
      classifyConnectionError({ message: 'permission denied for table prompts' }),
    ).toBe('blocked-by-rls');
  });

  it('reads 42P01 as the table not existing yet', () => {
    expect(classifyConnectionError({ code: '42P01' })).toBe('table-missing');
  });

  it('flags a rejected key as bad credentials', () => {
    expect(classifyConnectionError({ message: 'Invalid API key' })).toBe('bad-credentials');
    expect(classifyConnectionError({ message: 'JWT expired' })).toBe('bad-credentials');
  });

  it('falls back to unreachable for anything it does not recognise', () => {
    expect(classifyConnectionError({ message: 'NetworkError when attempting to fetch' })).toBe(
      'unreachable',
    );
  });

  it.each([
    ['reachable', { code: undefined } as { code?: string }],
    ['table-missing', { code: '42P01' }],
    ['blocked-by-rls', { code: '42501' }],
  ])('counts %s as having reached the project', (_label, error) => {
    const outcome = classifyConnectionError(error.code ? error : null);
    expect(['reachable', 'table-missing', 'blocked-by-rls']).toContain(outcome);
  });

  it('does not count bad credentials or a dead host as reached', () => {
    expect(classifyConnectionError({ message: 'Invalid API key' })).not.toBe('reachable');
    expect(classifyConnectionError({ message: 'Failed to fetch' })).toBe('unreachable');
  });
});
