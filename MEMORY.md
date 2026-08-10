# Project Memory

## 2026-08-10 - Security fix for GHSA-x56f-9fqg-f568 (v2.0.0)

### What was decided

- Replace the client-chosen user ID with Supabase Auth email/password sign-in, and scope prompts to `auth.uid()`.
- Write four ownership-scoped RLS policies, one per operation, each `TO authenticated`, with `WITH CHECK` on insert and update, plus `REVOKE ALL ON prompts FROM anon`.
- Remove the hardcoded fallback Supabase project entirely. When nothing is configured, `getSupabaseClient()` returns `null` and the app shows a setup screen.
- Keep `user_id` as `TEXT` and compare against `auth.uid()::text`, rather than migrating the column to `UUID`.
- Make credential precedence Settings → build-time env, and actually read `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, which had been documented but never consumed.
- Import `supabase-setup.sql` via Vite `?raw` so the in-app SQL and the repo script cannot drift.
- Ship a Vitest suite, including assertions against the real setup script so a permissive policy fails the build.

### Why

- The database had no trustworthy identity signal. With only the anon key, any RLS predicate would have compared against a client-supplied value, so no policy could enforce ownership without real auth. Splitting the permissive policy into four equally permissive ones would have looked like a fix while enforcing nothing.
- Email/password was chosen over anonymous sign-ins because anonymous identities are per-device, which would have broken cross-device sync. That sync is a feature the owner uses daily on mobile and explicitly wanted preserved.
- Email/password was chosen over magic link/OTP because OTP needs email delivery on every sign-in, and Supabase's built-in sender is rate limited and testing-only. Password auth with confirmation disabled has no email dependency at all.
- `user_id` stays `TEXT` because 1.x installs hold non-UUID values like `legacy-user` and `anon-1730…`. `ALTER COLUMN … TYPE uuid` would fail on those rows before anyone could migrate them.
- The owner strongly objects to fallbacks; the hardcoded project was also the sharpest part of the vulnerability, since unconfigured installs shared one database.

### What was rejected and why

- **Header-based RLS** (`current_setting('request.headers')`) was rejected. Supabase's docs only demonstrate `request.jwt.claims` and GUCs over direct Postgres connections, and I could not confirm custom client headers reach RLS on hosted Supabase. Building a security control on an unverified mechanism is worse than not shipping one.
- **Supabase anonymous sign-ins** were rejected despite being real auth, because each device gets a distinct identity and cross-device sync would break.
- **Username-only auth via synthetic emails** (`user@promptzy.local`) was rejected: no password recovery, and Supabase may reject undeliverable domains.
- **Shipping hardening without fixing RLS** (the original "option B") was rejected once it became clear it could not close the actual finding.
- **Deleting `supabasePromptStore.ts`** during the module split was rejected; it stays as a barrel so import paths keep working.

## 2026-07-11 - Dependency audit cleanup

### What was decided

- Keep the UI background simple and set the app page background to `#111113`.
- Use standard `npm audit fix` first, then targeted major upgrades for `electron` and `electron-builder` to clear the remaining audit findings.
- Harden the packaged Electron `app://` protocol handler with a path-boundary check before serving files from `dist/`.
- Update the Linux desktop-entry metadata to the electron-builder 26 `linux.desktop.entry` shape.
- Use `linux.executableName: promptzy` so Electron Builder 26 does not derive an unsafe Linux executable name from the scoped npm package name.
- Use `desktopName: promptzy.desktop` so Electron Builder can align Linux desktop entries and window association metadata.
- Remove direct R2 download links from README/docs and point users to GitHub Releases instead.
- Keep the docs site npm-compatible by removing pnpm-only `.npmrc` settings, replacing the pnpm-installed `node_modules` tree with an npm install, and adding `website/package-lock.json`.
- Keep the docs site's custom theme aligned with the app's dark charcoal UI, using solid accent colors instead of gradients.

### Why

- The original near-black background was too close to the component surfaces.
- The final background needed to sit between the darkest component interiors and the earlier lighter charcoal.
- The non-force audit fix resolved most vulnerabilities, while the remaining findings required Electron and electron-builder major upgrades.
- Electron's custom protocol docs recommend checking file paths before serving local resources.
- The electron-builder 26 schema rejected the old flat `linux.desktop` metadata object during a packaging smoke test.
- The electron-builder 26 AppImage path validation rejected the scoped npm package name-derived executable.
- The first successful 1.4.4 release build still warned about missing Linux `desktopName`.
- The project owner wants to clean up R2 buckets, so release docs should not depend on direct R2 asset URLs.
- npm 11 crashed in `website/` because it was trying to install into a pnpm-shaped `node_modules/.pnpm` tree; deleting generated `website/node_modules` and reinstalling with npm fixed it.
- The docs still had the old deep navy glassy gradient treatment, which no longer matched the simplified app UI.

### What was rejected and why

- Leaving Electron/electron-builder on vulnerable versions was rejected because the user asked to fix all audit findings.
- Using `npm audit fix --force` blindly was rejected in favor of targeted upgrades with verification, since npm flagged the remaining fixes as breaking changes.
- Keeping gradient docs backgrounds/text was rejected because the current app direction is solid charcoal surfaces with restrained accents.
