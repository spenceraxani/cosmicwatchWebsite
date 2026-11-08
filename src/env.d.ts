/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    locale: import('@utils/locale').MarketingLocale;
    copy: import('@/copy').Copy;
  }
}
