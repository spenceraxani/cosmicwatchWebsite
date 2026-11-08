import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';

import mdx from '@astrojs/mdx';
import guides from './src/data_files/guides.json' with { type: 'json' };

// Sidebar for the full guides, built from the manifest that scripts/sync-guides.py
// writes when it converts the PDFs. One group per guide, chapters inside it.
const guideSidebar = guides.guides.map((g) => ({
  label: g.title,
  collapsed: true,
  items: g.chapters.map((c) =>
    c.children
      ? {
          label: c.title,
          collapsed: true,
          items: [
            { label: 'Introduction', link: c.url },
            ...c.children.map((s) => ({ label: s.title, link: s.url })),
          ],
        }
      : { label: c.title, link: c.url }
  ),
}));

// The UD address is not decided yet. Set SITE_URL when it is; on Vercel the
// production domain is used until then. Add `base` if UD serves it from a sub-folder.
const SITE_URL =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://cosmicwatch.example.udel.edu');

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  prefetch: true,
  integrations: [
    sitemap(),
    starlight({
      title: 'CosmicWatch Docs',
      // English only. The marketing pages are English only as well.
      locales: {
        root: { label: 'English', lang: 'en' },
      },
      // https://starlight.astro.build/guides/sidebar/
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Overview', link: '/docs/' },
            { label: 'How the detector works', link: '/docs/how-it-works/' },
            { label: 'Coincidence mode', link: '/docs/coincidence-mode/' },
            { label: 'Recording data', link: '/docs/recording-data/' },
          ],
        },
        {
          label: 'Build a detector',
          items: [{ autogenerate: { directory: 'docs/build' } }],
        },
        {
          label: 'Measurements',
          items: [{ autogenerate: { directory: 'docs/measurements' } }],
        },
        {
          label: 'Help',
          items: [
            { label: 'Troubleshooting', link: '/docs/troubleshooting/' },
          ],
        },
        {
          label: 'Full guides (from the PDFs)',
          items: [{ label: 'All guides and sync status', link: '/docs/guides/' }, ...guideSidebar],
        },
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/spenceraxani/CosmicWatch-Desktop-Muon-Detector-v3X',
        },
      ],
      disable404Route: true,
      customCss: ['./src/assets/styles/starlight.css'],
      favicon: '/favicon.ico',
      components: {
        SiteTitle: './src/components/ui/starlight/SiteTitle.astro',
        Head: './src/components/ui/starlight/Head.astro',
        MobileMenuFooter:
          './src/components/ui/starlight/MobileMenuFooter.astro',
        ThemeSelect: './src/components/ui/starlight/ThemeSelect.astro',
      },
      head: [
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: SITE_URL + '/social.webp' },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'twitter:image',
            content: SITE_URL + '/social.webp',
          },
        },
      ],
    }),
    mdx(),
  ],
  experimental: {
    clientPrerender: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
