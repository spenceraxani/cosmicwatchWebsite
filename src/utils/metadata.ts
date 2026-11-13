import { SITE } from '@data/constants';
import { getCopy } from '@/copy';
import {
  LOCALE_INFO,
  MARKETING_LOCALES,
  alternatePaths,
  localePath,
  type MarketingLocale,
} from '@utils/locale';

export type PageKind =
  | { type: 'WebPage' }
  | {
      type: 'BlogPosting';
      image: string;
      datePublished: Date;
      author: string;
    }
  | { type: 'Article'; image: string }
  | { type: 'Product' };

export interface PageMetadataInput {
  locale: MarketingLocale;
  pathname: string;
  title?: string;
  /** `<meta name="description">`; falls back to the site description. */
  description?: string;
  /** Open Graph / Twitter title; falls back to the site OG title. */
  ogTitle?: string;
  section?: string;
  kind?: PageKind;
  /** Keep the page out of search results (thank-you page, 404, redirects). */
  noindex?: boolean;
}

export interface PageMetadata {
  lang: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogLocale: string;
  canonical: string;
  alternates: { hreflang: string; href: string }[];
  jsonLd: Record<string, unknown>;
  noindex: boolean;
}

/** Breadcrumb names for the parent sections of nested pages. */
const SECTION_NAMES: Record<string, string> = {
  '/contact/': 'Contact',
  '/docs/': 'Guides',
  '/pdf/': 'Guides',
};

/** Home › section › page, as schema.org BreadcrumbList (shown by Google under the result). */
export function breadcrumbs(pathname: string, pageName: string) {
  const items = [{ name: SITE.title, url: absoluteUrl('/') }];
  const parts = pathname.split('/').filter(Boolean);
  for (let k = 1; k < parts.length; k++) {
    const path = `/${parts.slice(0, k).join('/')}/`;
    const name = SECTION_NAMES[path];
    if (name)
      items.push({
        name,
        url: absoluteUrl(path === '/pdf/' ? '/docs/' : path),
      });
  }
  if (pathname !== '/')
    items.push({ name: pageName, url: absoluteUrl(pathname) });
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** The organization and website, described once on the home page. */
export function siteGraph() {
  return [
    {
      '@type': 'Organization',
      '@id': `${SITE.url}/#organization`,
      name: SITE.title,
      url: absoluteUrl('/'),
      logo: `${SITE.url}/brand/logo-darkblue.png`,
      email: 'saxani@udel.edu',
      parentOrganization: {
        '@type': 'CollegeOrUniversity',
        name: 'University of Delaware',
        url: 'https://www.udel.edu',
      },
      sameAs: [
        'https://github.com/spenceraxani/CosmicWatch-Desktop-Muon-Detector-v3X',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      name: SITE.title,
      alternateName: ['CosmicWatch v3X', 'CosmicWatch Desktop Muon Detector'],
      url: absoluteUrl('/'),
      publisher: { '@id': `${SITE.url}/#organization` },
      inLanguage: 'en-US',
    },
  ];
}

/** Absolute URL on the marketing site; the root has no trailing slash. */
export function absoluteUrl(path: string): string {
  return path === '/' ? SITE.url : `${SITE.url}${path}`;
}

export function buildPageMetadata(input: PageMetadataInput): PageMetadata {
  const { locale, pathname, kind = { type: 'WebPage' } } = input;
  const copy = getCopy(locale);
  const info = LOCALE_INFO[locale];

  // The home page uses the full name; every other page is "Page | CosmicWatch".
  const title = input.title
    ? `${input.title} | ${SITE.title}`
    : copy.site.ogTitle;
  const description = input.description ?? copy.site.description;
  const ogTitle =
    input.ogTitle ??
    (input.title && input.section
      ? `${input.title} | ${input.section} | ${SITE.title}`
      : copy.site.ogTitle);
  const ogDescription = input.description ?? copy.site.ogDescription;
  const canonical = absoluteUrl(pathname);

  const paths = alternatePaths(pathname);
  const alternates = MARKETING_LOCALES.map(alt => ({
    hreflang: LOCALE_INFO[alt].lang,
    href: absoluteUrl(paths[alt]),
  }));

  const publisher = {
    '@type': 'Organization',
    name: SITE.title,
    logo: { '@type': 'ImageObject', url: `${SITE.url}/favicon.ico` },
  };

  let jsonLd: Record<string, unknown>;
  switch (kind.type) {
    case 'BlogPosting':
      jsonLd = {
        '@type': 'BlogPosting',
        headline: input.title,
        image: kind.image,
        datePublished: kind.datePublished.toISOString(),
        author: { '@type': 'Person', name: kind.author },
        publisher,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      };
      break;
    case 'Article':
      jsonLd = {
        '@type': 'Article',
        headline: input.title,
        description,
        image: kind.image,
        author: { '@type': 'Organization', name: SITE.title },
        publisher,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      };
      break;
    case 'Product':
      jsonLd = {
        '@type': 'Product',
        '@id': canonical,
        name: input.title,
        description,
        brand: { '@type': 'Brand', name: SITE.title },
      };
      break;
    default:
      jsonLd = {
        '@type': 'WebPage',
        '@id': canonical,
        url: canonical,
        name: input.title ?? ogTitle,
        description,
        isPartOf: { '@id': `${SITE.url}/#website` },
        inLanguage: info.inLanguage,
      };
  }
  const graph = [jsonLd, breadcrumbs(pathname, input.title ?? SITE.title)];
  if (pathname === localePath(locale)) graph.push(...siteGraph());

  return {
    lang: info.lang,
    title,
    description,
    ogTitle,
    ogDescription,
    ogLocale: info.ogLocale,
    canonical,
    alternates,
    jsonLd: { '@context': 'https://schema.org', '@graph': graph },
    noindex: input.noindex ?? false,
  };
}
