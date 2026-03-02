# ✨ Promptzy 🎯

<p align="center">
  <img src="https://res.cloudinary.com/di7ctlowx/image/upload/v1748393462/icon_lzh8zy.png" alt="Promptzy Logo" width="250" height="250" />
</p>

**Promptzy** - A modern, cute web application for managing and organizing your AI prompts, with tagging, search, and cloud storage.

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.4.0-green.svg)
![NPM](https://img.shields.io/npm/v/@pinkpixel/promptzy?color=red)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-2.49.7-3ECF8E?logo=supabase)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

</div>

## ✨ Features

- **Organize AI Prompts**: Store, edit, and categorize prompts for various AI models
- **Custom Tagging**: Organize prompts with custom tags for easy retrieval
- **Powerful Search**: Find the perfect prompt with full-text search and tag filtering
- **Cloud Storage**: Reliable Supabase cloud storage with cross-device sync
- **Refresh Prompts**: Manual refresh button to sync prompts after configuration changes
- **AI Assistant**: Generate new prompt ideas with AI help
- **Progressive Web App (PWA)**: Install as a mobile app directly from your browser
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

## 🧩 Tech Stack

- React 19 with TypeScript 5.8
- Vite 6 for fast builds + `@tailwindcss/vite` plugin
- **Tailwind CSS v4** (CSS-first architecture, no PostCSS config needed)
- Shadcn/UI components (Radix UI primitives)
- TanStack Query
- React Hook Form with Zod
- Supabase for cloud storage
- PWA (Progressive Web App) with Workbox (vite-plugin-pwa v1.2)
- Cloudflare Pages for deployment

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
