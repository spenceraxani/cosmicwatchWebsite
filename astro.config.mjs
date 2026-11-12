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
  collapsed: false,
  items: [
    // The live PDF viewer (src/pages/pdf/[slug].astro), always the newest file on GitHub.
    { label: 'Full PDF ↗', link: `/pdf/${g.slug}/`, attrs: { target: '_blank', rel: 'noopener', class: 'cw-sidebar-pdf' } },
    ...g.chapters.map((c) =>
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
  ],
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
      title: 'CosmicWatch Guides',
      // English only. The marketing pages are English only as well.
      locales: {
        root: { label: 'English', lang: 'en' },
      },
      // https://starlight.astro.build/guides/sidebar/
      // One group per manual, chapters inside. Everything comes from the PDFs on GitHub.
      sidebar: [
        { label: 'All guides', link: '/docs/' },
        { label: 'Parts List & BOM', link: '/docs/parts-list/' },
        ...guideSidebar,
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/spenceraxani/CosmicWatch-Desktop-Muon-Detector-v3X',
        },
      ],
      disable404Route: true,
      // No "On this page" column or bar: the chapter text gets the full width.
      tableOfContents: false,
      routeMiddleware: './src/routeData.ts',
      customCss: ['./src/assets/styles/starlight.css'],
      favicon: '/favicon.ico',
      components: {
        Header: './src/components/ui/starlight/Header.astro',
        Head: './src/components/ui/starlight/Head.astro',
        MobileMenuFooter: './src/components/ui/starlight/MobileMenuFooter.astro',
        ThemeProvider: './src/components/ui/starlight/ThemeProvider.astro',
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
