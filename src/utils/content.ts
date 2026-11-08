import { getCollection, type CollectionEntry } from 'astro:content';
import {
  DEFAULT_LOCALE,
  isMarketingLocale,
  localePath,
  type MarketingLocale,
} from '@utils/locale';

// Entries live at src/content/<collection>/<locale>/<slug>.md, so ids are `<locale>/<slug>`.

export type LocalisedCollection = 'blog';
export type LocalisedEntry<
  C extends LocalisedCollection = LocalisedCollection,
> = CollectionEntry<C>;

const ROUTES: Record<LocalisedCollection, string> = {
  blog: '/news',
};

const SORTERS: {
  [C in LocalisedCollection]: (
    a: CollectionEntry<C>,
    b: CollectionEntry<C>
  ) => number;
} = {
  blog: (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
};

export function localeOf(entry: LocalisedEntry): MarketingLocale {
  const prefix = entry.id.split('/')[0];
  return isMarketingLocale(prefix) ? prefix : DEFAULT_LOCALE;
}

export function slugOf(entry: LocalisedEntry): string {
  return entry.id.replace(/^[^/]+\//, '');
}

export function pathFor(entry: LocalisedEntry): string {
  return `${localePath(localeOf(entry), ROUTES[entry.collection])}/${slugOf(entry)}/`;
}

export async function entriesFor<C extends LocalisedCollection>(
  collection: C,
  locale: MarketingLocale
): Promise<CollectionEntry<C>[]> {
  const entries = await getCollection(collection, ({ id }) =>
    id.startsWith(`${locale}/`)
  );
  return entries.sort(
    SORTERS[collection] as (
      a: CollectionEntry<C>,
      b: CollectionEntry<C>
    ) => number
  );
}

export async function siblingOf<C extends LocalisedCollection>(
  entry: CollectionEntry<C>,
  locale: MarketingLocale
): Promise<CollectionEntry<C> | undefined> {
  const siblings = (await entriesFor(
    entry.collection,
    locale
  )) as CollectionEntry<C>[];
  const slug = slugOf(entry);
  return siblings.find(candidate => slugOf(candidate) === slug);
}

export async function staticPathsFor<C extends LocalisedCollection>(
  collection: C,
  locale: MarketingLocale
) {
  const entries = await entriesFor(collection, locale);
  return entries.map(entry => ({
    params: { id: slugOf(entry) },
    props: { entry },
  }));
}
