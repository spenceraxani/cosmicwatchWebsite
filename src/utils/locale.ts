// Docs (Starlight) handle their own locales; this is for the marketing pages only.

export const MARKETING_LOCALES = ['en'] as const;
export type MarketingLocale = (typeof MARKETING_LOCALES)[number];

export const DEFAULT_LOCALE: MarketingLocale = 'en';

/** Locales that carry a URL prefix (every locale except the default). */
const PREFIXED_LOCALES: readonly MarketingLocale[] = (
  MARKETING_LOCALES as readonly MarketingLocale[]
).filter(locale => locale !== DEFAULT_LOCALE);

export const LOCALE_INFO: Record<
  MarketingLocale,
  {
    label: string;
    lang: string;
    ogLocale: string;
    inLanguage: string;
    intl: string;
  }
> = {
  en: {
    label: 'English',
    lang: 'en',
    ogLocale: 'en_US',
    inLanguage: 'en-US',
    intl: 'en-US',
  },
};

export function isMarketingLocale(value: unknown): value is MarketingLocale {
  return (
    typeof value === 'string' &&
    (MARKETING_LOCALES as readonly string[]).includes(value)
  );
}

export function splitLocale(pathname: string): {
  locale: MarketingLocale;
  path: string;
} {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  for (const locale of PREFIXED_LOCALES) {
    const prefix = `/${locale}`;
    if (normalized === prefix) return { locale, path: '/' };
    if (normalized.startsWith(`${prefix}/`)) {
      return { locale, path: normalized.slice(prefix.length) };
    }
  }
  return { locale: DEFAULT_LOCALE, path: normalized };
}

// The pathname wins; Astro.currentLocale is only a fallback.
export function resolveLocale(
  pathname: string,
  currentLocale?: string | undefined
): MarketingLocale {
  const { locale } = splitLocale(pathname);
  if (locale !== DEFAULT_LOCALE) return locale;
  if (isMarketingLocale(currentLocale)) return currentLocale;
  return DEFAULT_LOCALE;
}

// Fragments and absolute URLs pass through unchanged.
export function localePath(locale: MarketingLocale, path = '/'): string {
  if (path.startsWith('#') || /^[a-z]+:/i.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  if (clean === '/') return `/${locale}`;
  return `/${locale}${clean}`;
}

export function alternatePaths(
  pathname: string
): Record<MarketingLocale, string> {
  const { path } = splitLocale(pathname);
  return Object.fromEntries(
    MARKETING_LOCALES.map(locale => [locale, localePath(locale, path)])
  ) as Record<MarketingLocale, string>;
}
