/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    locale: import('@utils/locale').MarketingLocale;
    copy: import('@/copy').Copy;
  }
}

interface ImportMetaEnv {
  /** URL of the contact Worker (workers/contact/). See src/data_files/navigation.ts. */
  readonly PUBLIC_CONTACT_ENDPOINT?: string;
  /** Cloudflare Turnstile site key (public) for the contact form. */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}
