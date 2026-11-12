// Starlight builds the previous/next buttons from the sidebar order. The sidebar
// starts each manual with a "Full PDF" link to the live viewer, which should not
// be a page you page through, so recompute prev/next without those links.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

type Entry = { type: 'link' | 'group'; href?: string; isCurrent?: boolean; entries?: Entry[] };

export const onRequest = defineRouteMiddleware(context => {
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
  const { pagination } = route as unknown as { pagination: { prev?: Entry; next?: Entry } };
  pagination.prev = pages[i - 1];
  pagination.next = pages[i + 1];
});
