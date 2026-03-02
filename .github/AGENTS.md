# Promptzy Project Guide

## 🗂️ What This Project Is

**Promptzy** is a React + TypeScript PWA for managing AI prompts — categorize by type (`system`/`task`/`image`/`video`), tag, search, and sync to Supabase. Also published as an npm package (`@pinkpixel/promptzy`).

## ⚡ Build, Dev & Deploy

```bash
npm run dev        # Vite dev server → http://localhost:8080
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run lint       # ESLint 9 flat config (run after code changes)
wrangler pages deploy dist   # Deploy to Cloudflare Pages
```

**No test suite exists.** No `typecheck` script — use `npm run build` to surface TS errors.

## 🏗️ Architecture

```
App.tsx (QueryClientProvider + BrowserRouter)
  └── Index.tsx          ← ALL app state lives here (useState/useEffect/useCallback)
        ├── Header.tsx
        ├── AIAssistant.tsx    ← Pollinations API streaming, collapsible
        ├── SearchInput.tsx
        ├── TagFilter.tsx
        ├── PromptCard.tsx ×N  ← masonry grid (manual column calculation)
        ├── PromptForm.tsx     ← add/edit dialog, React Hook Form + Zod
        ├── EmptyState.tsx
        └── SettingsDialog.tsx ← Supabase credentials stored in localStorage
```

- Import alias: `@/` → `src/`
- All UI primitives from `src/components/ui/` (Shadcn/Radix)
- No global state library — props/callbacks throughout; React Query is wired but not used for fetching yet
- Masonry layout: `window.matchMedia` → 1/2/3 columns (mobile/tablet/desktop)

## 🗄️ Supabase Data Layer

**Field name mismatch** — app types ↔ DB schema:

| App (`Prompt` type) | DB column   |
| ------------------- | ----------- |
| `text`              | `content`   |
| `type`              | `category`  |
| `createdAt`         | `createdat` |

All mapping is manual in `src/lib/supabasePromptStore.ts`. **Any schema changes touch both the DB and transform functions.**

Credentials: default fallback baked into `src/integrations/supabase/client.ts` (public anon key by design); users can override via Settings dialog → `localStorage`. User ID: Supabase auth session → `custom-user-id` localStorage → auto-generated anon ID (priority order).

## 🤖 AI Integration (Pollinations)

- **Free, no API key** — `GET https://text.pollinations.ai/{params}`, model `openai`
- SSE streaming via `fetch` + `ReadableStream`; ref cleanup on unmount
- System prompt configurable in Settings → `localStorage` (`ai-system-prompt`)
- Required headers: `Referrer: promptzy`, `X-Referrer: promptzy`
- See [pollinations.md](../pollinations.md) for full API reference

## 🚀 Deployment

- **Cloudflare Pages** (static SPA) via `wrangler pages deploy dist`
- **PWA** is intentionally _disabled in production builds_ (`mode === 'development'` guard in `vite.config.ts`) — only active when running the npm package locally
- Also published to npm as `@pinkpixel/promptzy`; `bin/promptzy.js` serves `dist/` on port 4173

## ⚠️ Pitfalls to Know

1. **DB field mapping** — always check `content`/`category`/`createdat` vs `text`/`type`/`createdAt` when touching Supabase code
2. **No tests** — manually verify with `npm run dev` and `npm run build`
3. **RLS is permissive** (`FOR ALL USING (true)`) — row isolation is enforced in query filters, not at DB level
4. **React Query unused** — data fetching is direct `async/await`; don't assume query cache is populated
5. **PWA off in prod** — don't troubleshoot PWA features on the deployed site; test locally with `npm run dev`

## Personal Info

- **Name:** Pink Pixel
- **Website:** [pinkpixel.dev](https://pinkpixel.dev)
- **GitHub:** [github.com/pinkpixel-dev](https://github.com/pinkpixel-dev)
- **Discord:** @sizzlebop
- **Email:** admin@pinkpixel.dev
- **Buy me a coffee:** [buy me a coffee](https://www.buymeacoffee.com/pinkpixel)

## Branding & Identification

- **Emoji:** ✨
- **Tagline:** "Dream it, Pixel it”
- **Signature:** “Made with ❤️ by Pink Pixel”
- **Modern & Stylized Approach:**
- Always provide modern, elegant, and stylized solutions.
- Avoid basic or outdated implementations, even for simple tasks.
- Ensure code, design, and UI/UX examples reflect contemporary best practices and thoughtful details
