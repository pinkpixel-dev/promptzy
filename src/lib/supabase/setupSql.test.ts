// Regression tests for GHSA-x56f-9fqg-f568.
//
// The reported vulnerability was a shipped SQL script whose only policy was
// `FOR ALL USING (true)`. These assertions run against the real script the app
// hands users, so reintroducing a permissive policy fails the build rather than
// shipping quietly.
import { describe, expect, it } from 'vitest';
import { SETUP_SQL } from './setupSql';

const normalised = SETUP_SQL.replace(/\s+/g, ' ').toLowerCase();

/** Strip `--` comments so prose about the old policy is not mistaken for SQL. */
const executableSql = SETUP_SQL.split('\n')
  .filter((line) => !line.trimStart().startsWith('--'))
  .join('\n')
  .replace(/\s+/g, ' ')
  .toLowerCase();

describe('supabase setup script', () => {
  it('is the real script, not an empty or truncated import', () => {
    expect(SETUP_SQL.length).toBeGreaterThan(500);
    expect(normalised).toContain('create table if not exists prompts');
  });

  it('never creates a policy that grants unconditional access', () => {
    expect(executableSql).not.toMatch(/for all using \( ?true ?\)/);
    expect(executableSql).not.toContain('using (true)');
    expect(executableSql).not.toContain('allow all operations for now on prompts for all');
  });

  it('drops the permissive policy shipped by 1.x', () => {
    expect(executableSql).toContain('drop policy if exists "allow all operations for now" on prompts');
  });

  it('enables row level security', () => {
    expect(executableSql).toContain('alter table prompts enable row level security');
  });

  it.each([
    ['select', 'for select'],
    ['insert', 'for insert'],
    ['update', 'for update'],
    ['delete', 'for delete'],
  ])('defines a dedicated %s policy', (_operation, clause) => {
    expect(executableSql).toContain(clause);
  });

  it('scopes every policy to the authenticated role', () => {
    // Split on the statement keyword so the GRANT further down, which also says
    // "to authenticated", cannot stand in for a policy that forgot it.
    const policyBodies = executableSql.split('create policy').slice(1);

    expect(policyBodies).toHaveLength(4);
    for (const body of policyBodies) {
      const statement = body.split(';')[0];
      expect(statement).toContain('to authenticated');
    }
  });

  it('checks ownership against auth.uid() on every policy', () => {
    const ownershipChecks = (executableSql.match(/auth\.uid\(\)::text = user_id/g) ?? []).length;
    // select + insert + delete take one each; update needs USING and WITH CHECK.
    expect(ownershipChecks).toBe(5);
  });

  it('constrains writes with WITH CHECK so a row cannot be written for another user', () => {
    expect(executableSql).toContain('for insert to authenticated with check (auth.uid()::text = user_id)');
    expect(executableSql).toMatch(/for update to authenticated using \(auth\.uid\(\)::text = user_id\) with check \(auth\.uid\(\)::text = user_id\)/);
  });

  it('revokes table access from the anon role', () => {
    expect(executableSql).toContain('revoke all on prompts from anon');
  });

  it('documents the 1.x migration path', () => {
    expect(normalised).toContain('migrating from promptzy 1.x');
    expect(normalised).toContain('auth.users');
  });
});
