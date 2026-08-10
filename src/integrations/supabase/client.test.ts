// Regression tests for the hardcoded fallback project.
//
// Promptzy 1.x shipped a real Supabase URL and anon key as defaults, so any
// install that skipped configuration silently read and wrote a shared database.
// These tests assert there is nothing to fall back to.
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearClientCache,
  clearSupabaseCredentials,
  createSupabaseClient,
  describeCredentialProblem,
  getSupabaseClient,
  getSupabaseCredentials,
  isSupabaseConfigured,
  saveSupabaseCredentials,
  SUPABASE_KEY_KEY,
  SUPABASE_URL_KEY,
} from './client';

const VALID_URL = 'https://exampleproject.supabase.co';
const VALID_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-key-long-enough';

beforeEach(() => {
  localStorage.clear();
  clearClientCache();
});

describe('credential resolution', () => {
  it('reports nothing configured on a fresh install', () => {
    expect(getSupabaseCredentials()).toEqual({ supabaseUrl: '', supabaseKey: '' });
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('returns no client when nothing is configured, instead of a default project', () => {
    expect(getSupabaseClient()).toBeNull();
    expect(createSupabaseClient()).toBeNull();
  });

  it('does not embed any supabase.co project as a default', () => {
    const { supabaseUrl, supabaseKey } = getSupabaseCredentials();
    expect(supabaseUrl).not.toMatch(/supabase\.co/);
    expect(supabaseKey).toBe('');
  });

  it('uses credentials saved through settings', () => {
    expect(saveSupabaseCredentials(VALID_URL, VALID_KEY)).toBe(true);

    expect(getSupabaseCredentials()).toEqual({ supabaseUrl: VALID_URL, supabaseKey: VALID_KEY });
    expect(isSupabaseConfigured()).toBe(true);
    expect(getSupabaseClient()).not.toBeNull();
  });

  it('trims whitespace pasted in alongside credentials', () => {
    saveSupabaseCredentials(`  ${VALID_URL}  `, `\t${VALID_KEY}\n`);
    expect(getSupabaseCredentials()).toEqual({ supabaseUrl: VALID_URL, supabaseKey: VALID_KEY });
  });

  it('treats a blank stored value as unconfigured rather than valid', () => {
    localStorage.setItem(SUPABASE_URL_KEY, '   ');
    localStorage.setItem(SUPABASE_KEY_KEY, '   ');
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('goes back to unconfigured after clearing, with no project underneath', () => {
    saveSupabaseCredentials(VALID_URL, VALID_KEY);
    expect(isSupabaseConfigured()).toBe(true);

    expect(clearSupabaseCredentials()).toBe(true);
    expect(isSupabaseConfigured()).toBe(false);
    expect(getSupabaseClient()).toBeNull();
  });

  it('memoises the client per credential pair and rebuilds when they change', () => {
    saveSupabaseCredentials(VALID_URL, VALID_KEY);
    const first = getSupabaseClient();
    expect(getSupabaseClient()).toBe(first);

    saveSupabaseCredentials('https://otherproject.supabase.co', VALID_KEY);
    expect(getSupabaseClient()).not.toBe(first);
  });
});

describe('credential validation', () => {
  it.each([
    [{ supabaseUrl: '', supabaseKey: '' }, /no supabase project is configured/i],
    [{ supabaseUrl: '', supabaseKey: VALID_KEY }, /url is missing/i],
    [{ supabaseUrl: VALID_URL, supabaseKey: '' }, /anon key is missing/i],
    [{ supabaseUrl: 'not-a-url', supabaseKey: VALID_KEY }, /not a valid url/i],
    [{ supabaseUrl: 'http://exampleproject.supabase.co', supabaseKey: VALID_KEY }, /https/i],
    [{ supabaseUrl: VALID_URL, supabaseKey: 'short' }, /too short/i],
  ])('rejects %j', (credentials, expected) => {
    expect(describeCredentialProblem(credentials)).toMatch(expected);
  });

  it('accepts a well-formed pair', () => {
    expect(describeCredentialProblem({ supabaseUrl: VALID_URL, supabaseKey: VALID_KEY })).toBeNull();
  });

  it('accepts a project URL with a trailing slash', () => {
    expect(
      describeCredentialProblem({ supabaseUrl: `${VALID_URL}/`, supabaseKey: VALID_KEY }),
    ).toBeNull();
  });

  // A paste into the middle of an existing value produces a string that
  // `new URL()` accepts, with the rest treated as a path. It then fails as an
  // opaque "Failed to fetch" once CSP blocks the bogus host.
  it('catches two project URLs pasted into each other', () => {
    expect(
      describeCredentialProblem({
        supabaseUrl: 'https://sqdgrtdmieobhttps://ccfvjanrpxrmpuqdqxhh.supabase.coorxramgx.supabase.co',
        supabaseKey: VALID_KEY,
      }),
    ).toMatch(/two URLs pasted together/i);
  });

  it('rejects a hostname with no dot in it', () => {
    expect(
      describeCredentialProblem({ supabaseUrl: 'https://justproject', supabaseKey: VALID_KEY }),
    ).toMatch(/not a complete domain/i);
  });

  it.each([
    'https://exampleproject.supabase.co/dashboard',
    'https://exampleproject.supabase.co/?apikey=abc',
    'https://exampleproject.supabase.co/#/project',
  ])('rejects %s, which carries more than the origin', (supabaseUrl) => {
    expect(describeCredentialProblem({ supabaseUrl, supabaseKey: VALID_KEY })).toMatch(
      /nothing after the domain/i,
    );
  });

  it('accepts self-hosted Supabase on a custom domain', () => {
    expect(
      describeCredentialProblem({ supabaseUrl: 'https://supabase.example.org', supabaseKey: VALID_KEY }),
    ).toBeNull();
  });
});
