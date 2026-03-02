# ✨ Promptzy 🎯

**Last Updated:** 2026-03-01

## Project Overview

**Promptzy** is a modern Vite-based React application for managing, organizing, and utilizing AI prompts. It serves as a centralized repository where users can create, edit, categorize, and quickly access their collection of prompts across devices. The application ships as a hosted web app (Cloudflare Pages), a self-hosted Docker image, a native Linux desktop app (Electron), a Progressive Web App, and a global npm CLI.

## ✨ Key Features

- **Prompt Management:** Create, edit, view, and delete AI prompts with UUID support
- **Prompt Types:** Support for system, task, image, and video prompts with type-specific badges
- **Tagging System:** Organize prompts with customizable tags and visual tag chips
- **Search & Filter:** Full-text search and tag-based filtering with responsive masonry layout
- **Manual Refresh:** Dedicated refresh button in header for syncing prompts after configuration changes
- **AI Assistant:** Prompt generation using the Pollinations.ai API with:
  - OpenAI-compatible `POST /v1/chat/completions` endpoint (`https://gen.pollinations.ai`)
  - API key authentication — stored in Settings UI (`pollinations-api-key` localStorage); get a free key at [enter.pollinations.ai](https://enter.pollinations.ai)
  - Configurable model (default: `gemini-fast`); stored in Settings UI (`pollinations-model` localStorage)
  - SSE streaming via `fetch` + `ReadableStream` with ref-based cleanup on unmount
  - Support for system, task, image, and video prompt types
  - Aggressive anti-fluff system prompt — output is raw prompt text only, no greetings or commentary
  - Customisable system prompt via Settings; reset to default anytime
- **Cloud Storage:**
  - Supabase-only storage for reliable cloud persistence
  - UUID validation and user management
  - Intelligent client caching to reduce multiple instance warnings
  - Fixed critical bug where prompts saved to hardcoded URL instead of user's configured URL
  - Row Level Security (RLS) policies for data protection
- **Advanced UI/UX:**
  - Glass theming system (`.glass` / `.glass__bar`) for consistent glassmorphism across panels
  - `ShinyButton` component with real-time cursor-tracking shine effects
  - Redesigned Header with gradient text logo and cyan accent buttons
  - Redesigned TagFilter, TagInput, SearchInput, PromptCard, EmptyState
  - Responsive masonry layout (1-3 columns based on screen size)
  - Expandable prompt cards with copy functionality
  - Delete confirmation dialogs with "don't show again" option
  - Empty state handling for filtered and unfiltered views
  - Mobile-optimized responsive design with proper touch targets
  - Enhanced accessibility with proper DialogDescription components
- **Progressive Web App (PWA):**
  - Installable as mobile app directly from browser
  - Service worker for offline functionality and caching
  - Native app experience with no browser UI
  - Auto-updates and home screen installation
  - Manual refresh button for mobile PWA sync after Supabase setup
- **Settings & Configuration:** Comprehensive settings dialog with in-app Database Setup Guide, Supabase connection testing & diagnostics, and AI system prompt management
- **Theming & Responsive Design:** Custom purple theme with dark/light mode support and smooth animations
- **Global Installation:** npm global installation support with CLI commands (`promptzy`, `prompt-dashboard`, `ai-prompt-dashboard`)
- **Docker:** Multi-stage Nginx Docker image for self-hosted deployments; `docker compose up --build` one-liner; supports `VITE_*` build-arg credentials
- **Electron Desktop App:** Native Linux desktop app (`.deb` and `.AppImage`); secure `contextIsolation` preload; custom `app://` protocol for SPA routing in packaged builds; native app menu, context menus, and external link handling
- **Linux Binary Downloads:**
  - [Promptzy-1.4.1-amd64.deb](https://pub-699cccf9e73e444da2db8cbfb168ab3a.r2.dev/Promptzy-1.4.1-amd64.deb)
  - [Promptzy-1.4.1.AppImage](https://pub-699cccf9e73e444da2db8cbfb168ab3a.r2.dev/Promptzy-1.4.1.AppImage)
- **Production Ready:** Cloudflare Pages deployment with automated CI/CD and proper SPA routing

## 🛠️ Technical Stack

- **Framework:** React 19.1 (TypeScript)
- **Bundler & Dev Server:** Vite 6 with React SWC plugin + `@tailwindcss/vite` for native Tailwind processing
- **Styling:** Tailwind CSS v4 (CSS-first architecture, `@import "tailwindcss"`, no PostCSS/config file) + Radix UI primitives (via Shadcn UI)
- **Component Library:** Shadcn UI & Radix primitives (40+ components) + custom `ShinyButton` with cursor-tracking shine effects
- **Glass Theming:** `.glass` / `.glass__bar` utility classes for glassmorphism panels; accent palette: cyan, yellow, rose-pink
- **State Management:** React Hooks with sophisticated local state management
- **Routing:** React Router v7 with SPA routing configuration
- **Forms & Validation:** React Hook Form & Zod for type-safe form handling
- **Data Storage:**
  - Supabase JS SDK with custom client configuration
  - Cloud-only storage for reliable data persistence
  - UUID validation and proper error handling
- **AI Integration:** Pollinations.ai API (`https://gen.pollinations.ai/v1/chat/completions`) with streaming responses, configurable model, and API key auth
- **PWA Features:** vite-plugin-pwa v1.2 with Workbox for service worker and caching
- **Electron 34:** Native desktop app — `electron/main.cjs` (main process) + `electron/preload.cjs` (sandboxed contextBridge); packaged via `electron-builder` to `.deb` and `.AppImage`
- **Docker:** Multi-stage `Dockerfile` (Node 20 build → Nginx 1.27 serve) + `nginx.conf` (SPA routing, security headers, gzip) + `docker-compose.yml`
- **Notifications:** Sonner + custom toast hook for user feedback
- **Theming:** Next-Themes for dark/light mode with custom animations
- **Icons:** Lucide React (consistent icon system)
- **Date Handling:** date-fns for relative timestamps
- **Development Tools:** Lovable-tagger for component development

## ⚙️ Configuration & Tooling

- **TypeScript:** v5.8 with relaxed strictness for rapid development
- **Linting:** ESLint v9 flat config with React hooks and TypeScript support
- **Styling:** Tailwind CSS v4 (CSS-first via `src/index.css` `@theme {}` block) — `tailwind.config.ts` and `postcss.config.js` removed
- **Deployment:** Cloudflare Pages with wrangler.toml configuration
- **SPA Routing:** \_routes.json for proper client-side routing on Cloudflare Pages
- **Package Management:** npm with lockfile for consistent dependencies

## 📁 Project Structure

```
promptzy/
├── public/                 # Static assets
│   └── _routes.json        # SPA routing configuration for Cloudflare Pages
├── src/                    # Source code
│   ├── components/         # UI components
│   │   ├── AIAssistant.tsx      # Collapsible AI prompt generator with streaming
│   │   ├── AnimatedLogo.tsx     # Interactive logo with hover sound + animation
│   │   ├── EmptyState.tsx       # Contextual empty state screens
│   │   ├── Header.tsx           # App header with gradient logo, refresh, settings
│   │   ├── PromptCard.tsx       # Expandable prompt cards with type badges
│   │   ├── PromptForm.tsx       # Modal form for creating/editing prompts
│   │   ├── SearchInput.tsx      # Search input with icon
│   │   ├── SettingsDialog.tsx   # Settings modal with Database Setup Guide & diagnostics
│   │   ├── ShinyButton.tsx      # Custom button with cursor-tracking shine effects
│   │   ├── TagFilter.tsx        # Tag filtering pill buttons
│   │   ├── TagInput.tsx         # Tag management with keyboard support
│   │   └── ui/                  # Shadcn UI & Radix primitives (40+ components)
│   ├── hooks/              # Custom React hooks (use-toast, use-mobile)
│   ├── integrations/       # Third-party SDKs
│   │   └── supabase/       # Supabase client with custom configuration
│   ├── lib/                # Business logic & data stores
│   │   ├── supabasePromptStore.ts # Supabase cloud storage, diagnostics, client cache
│   │   ├── systemPromptStore.ts # AI assistant system prompt management
│   │   └── utils.ts             # Utility functions
│   ├── pages/              # Route pages (Index, NotFound)
│   └── types/              # TypeScript definitions
├── electron/               # Electron main process
│   ├── main.cjs            # Main process: app:// protocol, window factory, menus
│   └── preload.cjs         # Sandboxed preload — exposes window.electronAPI
├── dist/                   # Vite build output (web + served by Electron)
├── dist-electron/          # Electron packager output (.deb, .AppImage, etc.)
├── Dockerfile              # Multi-stage Docker build (Node 20 → Nginx 1.27)
├── nginx.conf              # SPA-aware Nginx config with security headers & gzip
├── docker-compose.yml      # One-command self-hosted deployment
├── electron-builder.yml    # electron-builder packaging config
├── wrangler.toml           # Cloudflare Pages config
└── vite.config.ts          # Vite config (includes @tailwindcss/vite plugin)
```

## 🚀 Getting Started

### Global Installation (Recommended)

```bash
# Install globally from npm
npm install -g @pinkpixel/promptzy

# Run Promptzy
promptzy
# or (legacy commands)
prompt-dashboard
ai-prompt-dashboard
```

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install | yarn install | bun install
   ```
3. Start development server:
   ```bash
   npm run dev | yarn dev | bun run dev
   ```
4. Open the app at http://localhost:5173

## 🌐 Deployment

The project is configured for deployment to Cloudflare Pages using Wrangler. The key configuration files are:

- **wrangler.toml**: Defines the project name, build output directory, and environment variables
- **\_routes.json**: Handles SPA routing by serving index.html for all non-asset routes

For detailed deployment instructions, see the [DEPLOYMENT.md](DEPLOYMENT.md) guide.

## ⚠️ Recent Changes & User Preferences

- **✅ v1.4.2 Released:** Electron desktop app (Linux `.deb` & `.AppImage`), Docker self-hosted deployment, new download links
- **✅ v1.4.1 Released:** Pollinations API migration to new endpoint, API key + model selection in Settings
- **✅ v1.4.0 Released:** Glass theming, ShinyButton, Tailwind CSS v4, Database Setup Guide, major UI overhaul
- **✅ Tailwind CSS v4:** Migrated to CSS-first architecture — `tailwind.config.ts` and `postcss.config.js` removed
- **✅ ShinyButton Component:** New interactive button with cursor-tracking shine effects used throughout the UI
- **✅ Glass Theming System:** `.glass` / `.glass__bar` classes applied site-wide for glassmorphism aesthetic
- **✅ Database Setup Guide:** Built directly into SettingsDialog — users can follow setup steps without leaving the app
- **✅ Supabase Diagnostics:** New diagnostics panel in settings for connection troubleshooting
- **✅ Security Patched:** 4 high-severity npm vulnerabilities resolved
- **✅ Storage Simplified:** Removed localStorage and sync functionality - now uses Supabase-only storage for reliability
- **✅ Manual Refresh Button:** Added refresh button in header to solve mobile PWA sync issues after Supabase configuration
- **✅ Global CLI Support:** Added npm global installation with `promptzy`, `prompt-dashboard` and `ai-prompt-dashboard` commands
- **✅ Progressive Web App:** Added PWA functionality for mobile app installation directly from browser
- **Authentication:** User prefers login-based authentication system with multiple options (Google, GitHub, email/password) over anonymous user IDs
- **✅ Rebranded to Promptzy:** Updated from "AI Prompt Dashboard" to "Promptzy" with cute new branding and logo

## 🔮 Future Enhancements

- **Authentication System:** Implement proper login-based authentication with multiple providers
- **Version Control:** Prompt version history & diff tracking
- **Templates:** AI prompt templates and presets for common use cases
- **Collaboration:** Shared prompt libraries and team collaboration features
- **Advanced Tagging:** Hierarchical tagging system with categories
- **Storage Backends:** Additional storage options (NeonDB, Firebase, etc.)
- **Analytics:** Usage analytics and prompt performance tracking
- **Import/Export:** Bulk import/export functionality for prompt collections
- **Search Enhancement:** Semantic search with embedding-based similarity

---

_Made with ❤️ by Pink Pixel_
