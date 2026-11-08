import type { MarketingLocale } from '@utils/locale';
import { en } from './en';

// Other locales must match the English table's shape, or `astro check` fails.
export type Copy = typeof en;

const tables: Record<MarketingLocale, Copy> = { en };

export function getCopy(locale: MarketingLocale): Copy {
  return tables[locale];
}
