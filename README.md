# ✨ Promptzy 🎯

<p align="center">
  <img src="https://res.cloudinary.com/di7ctlowx/image/upload/v1748393462/icon_lzh8zy.png" alt="Promptzy Logo" width="250" height="250" />
</p>

**Promptzy** - A modern, cute web application for managing and organizing your AI prompts, with tagging, search, and cloud storage.

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.4.1-green.svg)
![NPM](https://img.shields.io/npm/v/@pinkpixel/promptzy?color=red)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-2.49.7-3ECF8E?logo=supabase)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Electron](https://img.shields.io/badge/Electron-34.x-47848F?logo=electron)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)
![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

</div>

## ✨ Features

- **Organize AI Prompts**: Store, edit, and categorize prompts for various AI models
- **Custom Tagging**: Organize prompts with custom tags for easy retrieval
- **Powerful Search**: Find the perfect prompt with full-text search and tag filtering
- **Cloud Storage**: Reliable Supabase cloud storage with cross-device sync
- **Refresh Prompts**: Manual refresh button to sync prompts after configuration changes
- **AI Assistant**: Generate new prompts with AI — powered by [Pollinations](https://pollinations.ai), with selectable model and streaming responses
- **Progressive Web App (PWA)**: Install as a mobile app directly from your browser
- **Desktop App**: Native Electron app for Linux (more platforms coming)
- **Docker**: Run anywhere with a single `docker compose up` command
- **Modern UI**: Clean, responsive interface built with Shadcn/UI and Tailwind

## 🖥️ Screenshots

<p align="center">
  <img src="https://res.cloudinary.com/di7ctlowx/image/upload/v1748492164/dashboard_c6krgr.png" alt="Screenshot" width="800" />
</p>

## 🛠️ Installation

### Quick Start (Global Installation)

Install globally from npm and run with a single command:

```bash
# Install globally
npm install -g @pinkpixel/promptzy

# Run Promptzy
promptzy
```

Promptzy will start on `http://localhost:4173` and open automatically in your browser!

**Alternative commands:**

```bash
# Legacy commands still work
prompt-dashboard
ai-prompt-dashboard

# Or run directly with npx (no installation needed)
npx @pinkpixel/promptzy
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/pinkpixel-dev/promptzy.git

# Navigate to the project directory
cd promptzy

# Install dependencies (choose one)
npm install
# or
bun install
# or
yarn install

# Start the development server
npm run dev
# or
bun run dev
# or
yarn dev
```

### 📱 Mobile App Installation (PWA)

Promptzy can be installed as a mobile app directly from your browser! No app store needed.

**On Mobile (iOS/Android):**

1. Visit the Promptzy website in your mobile browser
2. Look for "Add to Home Screen" or "Install App" popup
3. Tap "Install" or "Add"
4. Promptzy will appear on your home screen like a native app!

**On Desktop (Chrome/Edge):**

1. Visit the website
2. Look for the install icon in the address bar
3. Click to install as a desktop app

**Benefits of the Mobile App:**

- 📱 Native app experience with no browser UI
- ⚡ Faster loading and offline functionality
- 🔄 Automatic updates when new versions are released
- 🏠 Easy access from your home screen
- 🔄 Manual refresh button for syncing prompts after setup

### 🖥️ Linux Desktop App (Electron)

Download the native desktop app for Linux — no browser required.

| Package                | Format      | Download                                                                                                 |
| ---------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| Debian / Ubuntu / Mint | `.deb`      | [Promptzy-1.4.1-amd64.deb](https://pub-699cccf9e73e444da2db8cbfb168ab3a.r2.dev/Promptzy-1.4.1-amd64.deb) |
| Universal Linux        | `.AppImage` | [Promptzy-1.4.1.AppImage](https://pub-699cccf9e73e444da2db8cbfb168ab3a.r2.dev/Promptzy-1.4.1.AppImage)   |

**Install the `.deb` package:**

```bash
wget https://pub-699cccf9e73e444da2db8cbfb168ab3a.r2.dev/Promptzy-1.4.1-amd64.deb
sudo dpkg -i Promptzy-1.4.1-amd64.deb
```

**Run the `.AppImage` (no install needed):**

```bash
wget https://pub-699cccf9e73e444da2db8cbfb168ab3a.r2.dev/Promptzy-1.4.1.AppImage
chmod +x Promptzy-1.4.1.AppImage
./Promptzy-1.4.1.AppImage
```

### 🐳 Docker

Run Promptzy as a self-hosted web app in a Docker container.

**Quick start (pre-built image from source):**

```bash
git clone https://github.com/pinkpixel-dev/promptzy.git
cd promptzy
docker compose up --build
```

Promptzy will be available at `http://localhost:3000`.

**With Supabase & Pollinations credentials baked in:**

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co \
VITE_SUPABASE_ANON_KEY=your_anon_key \
VITE_POLLINATIONS_API_KEY=pk_your_key \
docker compose up --build
```

**Or build & run manually:**

```bash
npm run docker:build   # docker build -t promptzy .
npm run docker:run     # docker run --rm -p 3000:80 promptzy
```

> Credentials can also be configured at runtime through the in-app Settings dialog — no rebuild needed.

### Deployment

For deploying to Cloudflare Pages or other platforms, see the [DEPLOYMENT.md](DEPLOYMENT.md) guide.

## 🔧 Configuration

### Supabase Configuration

To use promptzy you will need to set up a table on Supabase. They have a free tier and the setup is very easy to do.

1. Create a Supabase account and project at [supabase.com](https://supabase.com). Once you have an account set up, create a project. At the top of your project page, you should see a button that says "Connect." Click on that button, and then click on the 2nd tab. You should see a screen that gives you a supabase url, and an anon key. You can also find this information in your project settings, you will see a project id, and your anon key will be located in the api keys section.

Now that you have this information, return to Promptzy.

2. Configure your Supabase credentials:
   - Open Promptzy
   - Go to Settings (gear icon)
   - Select "Supabase" as your storage option
   - Enter your Supabase Project URL and API Key
     - Find these in your Supabase dashboard under Project Settings → API
   - Click "Connect" to verify your credentials

3. Create the required database table:
   - After connecting, you'll need to set up the prompts table manually. You should see the instructions appear after entering your credentials.
   - Click the "Open SQL Editor" button in the settings
   - Copy the SQL code provided in the settings (or use the SQL from `supabase-setup.sql`)
   - Paste and run it in the Supabase SQL Editor

4. Return to Promptzy and click "Connect" again to verify the table setup
5. Save your settings
6. Use the "Refresh" button in the header to load your prompts

   **Note:** Automatic table creation isn't supported by Supabase for security reasons, so this one-time manual setup is required. You should only have to do this once per browser. After setup, use the refresh button to ensure prompts load properly, especially on mobile devices.

The application will now use your Supabase instance for cloud storage! The cloud storage is ideal because it allows you to access your prompt database from any browser, computer or mobile device, and with Supabase's free tier you will have plenty of storage space for your prompts.

## 📖 Usage

1. Launch the application
2. Configure your Supabase connection in Settings
3. Use the "Refresh" button to load your prompts after setup
4. Add prompts with the "+" button
5. Assign tags to organize your prompts
6. Use the search box and tag filters to find prompts
7. Select a prompt to copy it or edit its details

## 🤖 AI Assistant

The AI Assistant panel sits at the bottom-right of the screen and lets you generate ready-to-use prompts with a single click.

### Setup

1. Grab a free API key from [enter.pollinations.ai](https://enter.pollinations.ai) — a publishable `pk_` key works fine for browser use
2. Open **Settings** (gear icon) → **AI Assistant Configuration**
3. Paste your key into **Pollinations API Key**
4. Optionally change the **AI Model** (default: `gemini-fast`)
5. Click **Save Changes**

### Generating a Prompt

1. Click **AI Prompt Assistant** in the bottom-right corner to expand it
2. Choose the prompt type: **System**, **Task**, **Image**, or **Video**
3. Describe what you want in the text area (e.g. _"a friendly customer support assistant"_ for a System prompt)
4. Click **Generate Prompt** — response streams in live
5. **Copy** the result to clipboard, or click **Use as Prompt** to save it directly to your library

### Available Models

Any [Pollinations text model](https://gen.pollinations.ai/api/docs) can be used. Some good picks:

| Model          | Description                                          |
| -------------- | ---------------------------------------------------- |
| `gemini-fast`  | Google Gemini 2.5 Flash Lite — default, fast & cheap |
| `openai`       | GPT-5 Mini — fast & balanced                         |
| `openai-large` | GPT-5.2 — most powerful                              |
| `claude`       | Claude Sonnet 4.6 — capable & balanced               |
| `deepseek`     | DeepSeek V3.2 — efficient reasoning                  |

### Customising the System Prompt

Open **Settings → AI Assistant Configuration**, uncheck **Use default system prompt**, and edit the prompt freely. Click **Reset to default** to restore the original at any time.

## 🧩 Tech Stack

- React 19 with TypeScript 5.8
- Vite 6 for fast builds + `@tailwindcss/vite` plugin
- **Tailwind CSS v4** (CSS-first architecture, no PostCSS config needed)
- Shadcn/UI components (Radix UI primitives)
- TanStack Query
- React Hook Form with Zod
- Supabase for cloud storage
- PWA (Progressive Web App) with Workbox (vite-plugin-pwa v1.2)
- **Electron 34** — native desktop app (Linux `.deb` & `.AppImage`; Windows & macOS builds available)
- **Docker** — multi-stage Nginx image for self-hosted deployments
- Cloudflare Pages for hosted deployment

## 📋 Roadmap

- [ ] Prompt version history
- [ ] AI prompt templates
- [ ] Shared prompt libraries
- [ ] Additional storage backends
- [ ] Advanced tagging with hierarchies

## 🤝 Contributing

Contributions are welcome! See the [CONTRIBUTING.md](CONTRIBUTING.md) file for details.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Shadcn/UI](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Supabase](https://supabase.com/) for authentication and cloud storage

---

Made with ❤️ by [Pink Pixel](https://pinkpixel.dev)
