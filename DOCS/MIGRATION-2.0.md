# Upgrading to Promptzy 2.0

> ## ⚠️ Back up your prompts before you upgrade
>
> **After upgrading, Promptzy will look completely empty.** Every prompt will
> still be in your database, but it will carry the old identifier and will not
> match your new account until you run one `UPDATE` statement (step 4).
>
> Nothing is deleted at any point in this process. Even so, take a backup first.
> It takes ten seconds and it means a mistyped `UPDATE` costs you nothing. See
> [Back up first](#back-up-first) below.

2.0 changes how Promptzy decides which prompts are yours. It closes
[GHSA-x56f-9fqg-f568](https://github.com/pinkpixel-dev/promptzy/security/advisories/GHSA-x56f-9fqg-f568),
and it needs about five minutes of your time.

Read the whole page before you start.

## What changed and why

Promptzy 1.x identified you by a plain string. Either a "Custom User ID" you
typed into Settings, or a generated `anon-...` value stored in your browser.
The database had one policy, `FOR ALL USING (true)`, which allowed every
operation to anyone.

Those two things together meant that anyone holding the project's anon key,
which ships in the client bundle of every deployment, could read, overwrite, or
delete any prompt in the table. The `user_id` filter in the app was a
convenience, not a boundary. A string the browser chooses is a string the
browser can change.

2.0 replaces that with a real account:

| | 1.x | 2.0 |
|---|---|---|
| Identity | Any string you type | Supabase Auth user, verified by JWT |
| Enforcement | App-side `.eq('user_id', ...)` filter | Database RLS policies on `auth.uid()` |
| Delete path | Filtered by `id` only | Filtered by `id` and owner, plus RLS |
| Default database | Hardcoded shared project | None, you configure your own |
| Cross-device sync | Same typed string | Sign in with the same account |

Cross-device sync still works exactly as before from your side. Sign in on your
phone with the same email and password, and your prompts are there.

## Back up first

You are still on 1.x at this point, which has no export button, so this backup
goes through Supabase. Do both of these. The first is instant insurance, the
second gives you a copy that survives losing the project entirely.

> Once you are on 2.0 there is an **Export prompts** button in
> Settings → Backup & Restore, so future backups take one click. The JSON you
> save now can also be fed back through 2.0's **Import prompts**, which is a
> useful safety net if step 4 does not go to plan.

### 1. Copy the table, inside the database

In your Supabase project's **SQL Editor**:

```sql
CREATE TABLE prompts_backup_1x AS SELECT * FROM prompts;
```

That is a full, independent copy. If anything goes wrong later you can restore
from it:

```sql
-- Only if you need to undo. This replaces the live table's contents.
DELETE FROM prompts;
INSERT INTO prompts SELECT * FROM prompts_backup_1x;
```

Keep the backup table until you have confirmed everything came across, then drop
it with `DROP TABLE prompts_backup_1x;`.

### 2. Download a copy off Supabase

Either works:

- **Table Editor** → `prompts` → the **…** menu → **Export data as CSV**.
- **SQL Editor** → run `SELECT * FROM prompts;` → **Download CSV** on the
  results panel.

Save that file somewhere real. It is a plain CSV with your prompt text in the
`content` column, so it is readable even without Promptzy.

<details>
<summary>Prefer JSON?</summary>

```sql
SELECT json_agg(row_to_json(prompts)) FROM prompts;
```

Run it in the SQL Editor and copy the single result cell into a `.json` file.

</details>

## Step 1: Note your old user_id

In the SQL Editor:

```sql
SELECT user_id, COUNT(*) FROM prompts GROUP BY user_id;
```

Write down the values. If you only ever used Promptzy yourself you will see one
row, something like `my-custom-id` or `anon-1730000000000-a1b2c3d`. You need
these in step 4.

## Step 2: Run the new setup script

Copy [`supabase-setup.sql`](../supabase-setup.sql) and run the whole thing in
the SQL Editor. It is safe to run against an existing table.

It drops the permissive `"Allow all operations for now"` policy, creates four
ownership-scoped policies, and revokes the `anon` role's access to the table.

The verification queries at the bottom tell you whether it worked. The last one,
checking `anon` grants, should return no rows.

## Step 3: Turn off email confirmation (optional but recommended)

In your Supabase dashboard, under **Authentication → Sign In / Providers →
Email**, turn off **Confirm email**.

Supabase's built-in email service is rate limited and meant for testing, so
leaving confirmation on means you need your own SMTP provider before you can
create an account. For a personal install, turning it off is simpler and costs
you nothing meaningful, since you control the database.

Leave it on if you would rather set up SMTP, or if other people use your
instance.

## Step 4: Create your account, then claim your prompts

Open Promptzy. You will see the sign-in screen. Choose **Need an account?
Create one** and sign up with your email and a password.

Your prompts will not be there yet. That is expected: they still carry the old
`user_id` from step 1.

Go back to the SQL Editor and re-point them, using the old value you noted:

```sql
UPDATE prompts
SET user_id = (SELECT id::text FROM auth.users WHERE email = 'you@example.com')
WHERE user_id = 'the-old-value-from-step-1';
```

Refresh Promptzy. Everything should be back.

If more than one person's prompts share the table, run this once per person,
matching each old value to the right account. Do not run a blanket `UPDATE`.

### Or skip the SQL entirely

If you saved a JSON backup in the backup step, restore it through the app
instead: **Settings → Backup & Restore → Import prompts**. It reads raw Supabase
table rows as well as Promptzy's own export format, and stamps everything with
your new account as it goes.

The `UPDATE` is tidier, since it moves your existing rows rather than writing new
ones. Import is the better option if the `UPDATE` gave you trouble, or if you
would rather not touch SQL again.

## Step 5: Sign in on your other devices

Same email, same password, same Supabase project URL and anon key in Settings.
That is all cross-device sync needs now.

## If you were using the built-in database

1.x shipped with a hardcoded Supabase project as a fallback, so installs that
never configured credentials were silently reading and writing a shared
database. That fallback is gone in 2.0, and there is no default to fall back on.

If you never entered your own credentials in Settings, your prompts lived in
that shared project and Promptzy 2.0 will show you the setup screen on first
launch. Create your own Supabase project and follow this guide from step 2.
Your old prompts are not recoverable through the app.

## Troubleshooting

**"Sign in" says invalid credentials on an account I just made.**
Email confirmation is probably still on. Either confirm via the email Supabase
sent, or turn confirmation off as in step 3 and sign up again.

**I signed in but I see no prompts.**
Step 4 is not done, or the old `user_id` in the `WHERE` clause did not match.
Re-run the query from step 1 to see what is actually stored.

**Saving a prompt fails with a row-level security error.**
The setup script did not finish, or it ran against a different project than the
one configured in Settings. Re-run it and check the verification queries.

**Settings → Diagnose says RLS is not enforced.**
The old permissive policy is still there. Re-run the setup script; section 5
drops it by name.

---

Made with 💖 by Pink Pixel
