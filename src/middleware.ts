import { defineMiddleware } from 'astro:middleware';
import { resolveLocale } from '@utils/locale';
import { getCopy } from '@/copy';

export const onRequest = defineMiddleware((context, next) => {
  const locale = resolveLocale(context.url.pathname, context.currentLocale);
  context.locals.locale = locale;
  context.locals.copy = getCopy(locale);
  return next();
});
