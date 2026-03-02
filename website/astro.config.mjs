// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.promptzy.pinkpixel.dev',
	integrations: [
		starlight({
			title: 'Promptzy',
			description: 'Documentation for Promptzy — your modern AI prompt manager.',
			logo: {
				src: './src/assets/logo.png',
				alt: 'Promptzy',
			},
			favicon: '/favicon.png',
			customCss: ['./src/styles/custom.css'],
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/pinkpixel-dev/promptzy' },
				{ icon: 'npm', label: 'npm', href: 'https://www.npmjs.com/package/@pinkpixel/promptzy' },
			],
			sidebar: [
				{
					label: '✨ Getting Started',
					items: [
						{ label: 'Overview', slug: 'index' },
						{ label: 'Installation', slug: 'getting-started' },
					],
				},
				{
					label: '⚙️ Configuration',
					items: [
						{ label: 'Supabase Setup', slug: 'supabase-setup' },
						{ label: 'AI Assistant', slug: 'ai-assistant' },
					],
				},
				{
					label: '✍️ Prompting Guide',
					items: [
						{ label: 'Prompt Engineering', slug: 'prompting-guide' },
						{ label: 'Prompt Templates', slug: 'prompt-templates' },
					],
				},
			],
		}),
	],
});
