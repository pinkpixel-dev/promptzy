Here's a full breakdown of the Promptzy project:

---

## Project Purpose & Tech Stack

**Promptzy** (`@pinkpixel/promptzy` v1.4.0) is a modern PWA for managing and organizing AI prompts — supports categorization by type (`system` / `task` / `image` / `video`), tagging, full-text search, cloud sync, and AI-assisted prompt generation.

**Stack:**
- **React 19** + **TypeScript 5.9** + **Vite 7** (SWC compiler via `@vitejs/plugin-react-swc`)
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **Shadcn/UI** (Radix UI primitives — full component set in `src/components/ui/`)
- **Supabase** (`@supabase/supabase-js` v2) for cloud storage
- **TanStack React Query v5** (set up in `App.tsx`, not heavily used yet beyond provider setup)
- **React Router DOM v7**
- **Sonner + Radix Toast** for notifications
- **Lucide React** for icons
- **Zod + React Hook Form** (imported but available)
- Distributed also as an **npm package** with a `bin/promptzy.js` CLI launcher

---

## Scripts

| Script | Command |
|---|---|
| `dev` | `vite` — dev server on port `8080` |
| `build` | `vite build` — production build to `dist/` |
| `build:dev` | `vite build --mode development` |
| `lint` | `eslint .` — ESLint 9 flat config |
| `preview` | `vite preview` — preview production build |
| `start` | `node bin/promptzy.js` — serve via npm package CLI |
| `prepublishOnly` | `npm run build` — auto-builds before publish |

**No test script exists.** No `typecheck` script — type checking is implicit via build. Run `npm run lint` for linting.

---

## Architecture

### Component tree / data flow

```
App.tsx
  └── QueryClientProvider + TooltipProvider + BrowserRouter
        └── Index.tsx                    ← single-page app, all state lives here
              ├── Header.tsx
              ├── AIAssistant.tsx          ← collapsible, calls Pollinations API
              ├── SearchInput.tsx
              ├── TagFilter.tsx
              ├── PromptCard.tsx (×N)      ← masonry grid layout
              ├── PromptForm.tsx           ← add/edit dialog
              ├── EmptyState.tsx
              └── SettingsDialog.tsx       ← Supabase credentials config
```

**State management:** All app state is in `Index.tsx` via `useState` / `useEffect` / `useCallback` — no Zustand/Redux/Context. React Query is wired up but not currently used for data fetching (Supabase calls are done imperatively). Data flows down as props; events bubble up via callbacks.

**Responsive masonry layout:** `Index.tsx` manually calculates column count using `window.matchMedia` (1 col mobile / 2 col tablet / 3 col desktop) and distributes cards into columns.

---

## Supabase Usage Patterns

**Credential storage:** Credentials live in `localStorage` (`custom-supabase-url`, `custom-supabase-key`). A hardcoded default project URL/anon-key is baked into [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts) as a fallback — **this is a public anon key, intentional for an open-source project but worth noting.**

**User identity:** Three-tier resolution in [src/lib/supabasePromptStore.ts](src/lib/supabasePromptStore.ts):
1. Supabase authenticated session user ID
2. Custom user ID from `localStorage` (`custom-user-id`)
3. Auto-generated anonymous ID (`supabase-anonymous-id`)

**Table schema:** Single `prompts` table with columns `id`, `content`, `tags TEXT[]`, `createdat`, `title`, `category`, `description`, `user_id`, `ispublic`, `likes`, `views`, `comments`. **Note the impedance mismatch** — the app's `Prompt` type uses `text`/`createdAt`/`type`, while Supabase uses `content`/`createdat`/`category`. Mapping happens in `getPromptsFromSupabase`/`savePromptToSupabase`.

**RLS:** Table has RLS enabled with a permissive `FOR ALL USING (true)` policy — all-access, row filtering is done in the query layer via `user_id`.

**Client caching:** [supabasePromptStore.ts](src/lib/supabasePromptStore.ts) caches the Supabase client instance (URL+key keyed), re-creating on credential change. The `getPromptsFromSupabase` intentionally creates a fresh `createClient` call (bypasses cache) to ensure latest credentials on every fetch.

---

## AI Integration — Pollinations API

[pollinations.md](pollinations.md) documents the full API; here's what the app actually uses:

**Endpoint:** `GET https://text.pollinations.ai/{params}` (free tier, no API key in app)

**Model:** `openai` (defaults to GPT-5 Mini per the docs)

**Parameters sent:**
```
model=openai, system={systemPrompt}, prompt={userPrompt}, temperature=0.4, top_p=0.8, private=true, stream=true
```

**Streaming:** Reads `text/event-stream` SSE via `fetch` + `ReadableStream` reader. Parses `data: {...}` chunks for `choices[0].delta.content`. Falls back to plain text if Content-Type isn't `text/event-stream`. Cleanup uses a ref (`eventSourceRef`) holding `{ close: () => reader.cancel() }` — cleaned up on unmount and before each new request.

**System prompt:** Configurable via [src/lib/systemPromptStore.ts](src/lib/systemPromptStore.ts) (stored in `localStorage` as `ai-system-prompt`), with a hardcoded default (`SYSTEM_PROMPT_DEFAULT` exported from `AIAssistant.tsx`). User can override in settings.

**Referral headers sent:** `Referrer: promptzy` and `X-Referrer: promptzy` — used by Pollinations for analytics/free-tier allowlisting.

---

## Component Patterns & Conventions

- **TypeScript:** Strict typing throughout; interfaces in [src/types/index.ts](src/types/index.ts). `eslint-disable` comments used sparingly for unavoidable `any` types in Supabase client generics.
- **Import alias:** `@/` maps to `src/` via `vite.config.ts` path alias.
- **Shadcn/UI pattern:** All UI primitives in `src/components/ui/`. Custom components in `src/components/`. No barrels — direct imports.
- **Hooks:** Custom hooks in `src/hooks/` (just `use-mobile.tsx` and `use-toast.ts`). Toast is also mirrored in `src/components/ui/use-toast.ts`.
- **Forms:** React Hook Form + Zod available; `PromptForm.tsx` likely uses this.
- **`useCallback`/`useMemo`:** Used defensively in `Index.tsx` to stabilize effect dependencies (Supabase client, load functions).
- **No global state library** — props/callbacks pattern throughout.

---

## Deployment

**Cloudflare Pages** via [wrangler.toml](wrangler.toml):
- Project name: `promptzy`
- Build output: `dist/`
- Deployed with `wrangler pages deploy dist` (last terminal command confirms this)
- Compatibility date: `2023-10-30`
- No Workers/KV/D1 — purely static SPA hosting

**PWA:** Only enabled in **development mode** (`mode === 'development'` guard in `vite.config.ts`) — `VitePWA` plugin with `autoUpdate`, manifest theme `#7E69AB`, `workbox` glob caching. In production builds, PWA is **disabled** (likely intentional to avoid service worker caching issues on Cloudflare Pages).

**npm package:** Also published to npm as `@pinkpixel/promptzy`. `bin/promptzy.js` serves the `dist/` folder locally on port 4173 and opens the browser. `prepublishOnly` ensures `dist/` is up to date.

---

## Notable Conventions & Pitfalls

1. **Hardcoded default Supabase credentials** in [client.ts](src/integrations/supabase/client.ts) — these are the developer's own project. Users share this instance unless they configure their own in Settings. This is by design for easy onboarding but means new users write to the Pink Pixel Supabase project by default.

2. **RLS policy is fully permissive** (`FOR ALL USING (true)`) — row isolation is done via `user_id` filtering in queries, not enforced at the DB level. Any user who knows someone else's `user_id` can access their prompts.

3. **PWA disabled in production builds** — the `mode === 'development'` guard means the deployed Cloudflare Pages site is not a PWA. The README advertises PWA features — this may be a bug or intentional for the npm package local use case where dev mode is used.

4. **`testSupabaseConnection`** is imported in `Index.tsx` but not defined in the visible portion of `supabasePromptStore.ts` — likely defined further in that file (or re-exported). Worth verifying if making changes near that code.

5. **Column name mismatch** between app types and DB schema (`text`↔`content`, `type`↔`category`, `createdAt`↔`createdat`) — all mapping is manual. Any schema changes require touching both the DB and the transform functions.

6. **No test suite** — zero testing infrastructure. No Vitest, no testing-library setup.

7. **`@tanstack/react-query`** is in the dependency tree and `QueryClientProvider` wraps the app, but actual data fetching bypasses it entirely (direct `async/await` calls). Could be leveraged in future for caching/loading states.