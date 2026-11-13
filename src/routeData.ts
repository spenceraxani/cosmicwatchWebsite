// Starlight builds the previous/next buttons from the sidebar order. The sidebar
// starts each manual with a "Full PDF" link to the live viewer, which should not
// be a page you page through, so recompute prev/next without those links.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

type Entry = {
  type: 'link' | 'group';
  label?: string;
  href?: string;
  isCurrent?: boolean;
  entries?: Entry[];
};

const SITE = (import.meta.env.SITE ?? '').replace(/\/$/, '');

export const onRequest = defineRouteMiddleware(context => {
  addBreadcrumbs(context);
  const route = context.locals.starlightRoute;
  const pages: Entry[] = [];
  const walk = (list: Entry[]) => {
    for (const e of list) {
      if (e.type === 'group') walk(e.entries ?? []);
      else if (e.href && !e.href.startsWith('/pdf/')) pages.push(e);
    }
  };
  walk(route.sidebar as Entry[]);
  const i = pages.findIndex(e => e.isCurrent);
  if (i === -1) return;
  const { pagination } = route as unknown as {
    pagination: { prev?: Entry; next?: Entry };
  };
  pagination.prev = pages[i - 1];
  pagination.next = pages[i + 1];
});

/** Home › Guides › manual › chapter, as schema.org BreadcrumbList for search results. */
function addBreadcrumbs(
  context: Parameters<Parameters<typeof defineRouteMiddleware>[0]>[0]
) {
  const route = context.locals.starlightRoute;
  const path = context.url.pathname;
  const items = [
    { name: 'CosmicWatch', url: `${SITE}/` },
    { name: 'Guides', url: `${SITE}/docs/` },
  ];
  const find = (list: Entry[], parents: Entry[]): Entry[] | null => {
    for (const e of list) {
      if (e.type === 'group') {
        const hit = find(e.entries ?? [], [...parents, e]);
        if (hit) return hit;
      } else if (e.isCurrent) return parents;
    }
    return null;
  };
  const groups = find(route.sidebar as Entry[], []) ?? [];
  for (const g of groups) {
    const first = (g.entries ?? []).find(
      x => x.type === 'link' && x.href && !x.href.startsWith('/pdf/')
    );
    if (g.label && first?.href)
      items.push({ name: g.label, url: `${SITE}${first.href}` });
  }
  if (path !== '/docs/')
    items.push({ name: route.entry.data.title, url: `${SITE}${path}` });
  route.head.push({
    tag: 'script',
    attrs: { type: 'application/ld+json' },
    content: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, k) => ({
        '@type': 'ListItem',
        position: k + 1,
        name: it.name,
        item: it.url,
      })),
    }),
  });
}
