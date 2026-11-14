export const REPO = 'spenceraxani/CosmicWatch-Desktop-Muon-Detector-v3X';
export const REPO_URL = `https://github.com/${REPO}`;

// Labels for these ids live in the copy table.
export type NavLinkId =
  'detector' | 'docs' | 'measure' | 'downloads' | 'contact';

export const navLinks: { id: NavLinkId; path: string }[] = [
  { id: 'detector', path: '/detector' },
  { id: 'docs', path: '/docs/' },
  { id: 'measure', path: '/measure' },
  { id: 'downloads', path: '/github' },
  { id: 'contact', path: '/contact' },
];

export type FooterSectionId = 'program' | 'detector' | 'get';
export type FooterLinkId =
  | 'about'
  | 'people'
  | 'contact'
  | 'detector'
  | 'build'
  | 'measurements'
  | 'troubleshooting'
  | 'measure'
  | 'downloads'
  | 'purchase'
  | 'github'
  | 'papers';

export const footerSections: {
  id: FooterSectionId;
  links: { id: FooterLinkId; path: string }[];
}[] = [
  {
    id: 'program',
    links: [
      { id: 'about', path: '/#about' },
      { id: 'people', path: '/contact#people' },
      { id: 'contact', path: '/contact' },
    ],
  },
  {
    id: 'detector',
    links: [
      { id: 'detector', path: '/detector' },
      {
        id: 'build',
        path: '/docs/guides/instruction-manual/how-to-build-a-cosmicwatch-detector-v3x/',
      },
      {
        id: 'measurements',
        path: '/docs/guides/example-measurements/tested-measurements/',
      },
      {
        id: 'troubleshooting',
        path: '/docs/guides/troubleshooting/troubleshooting/',
      },
    ],
  },
  {
    id: 'get',
    links: [
      { id: 'measure', path: '/measure' },
      { id: 'downloads', path: '/github' },
      { id: 'purchase', path: '/shop' },
      { id: 'github', path: REPO_URL },
      { id: 'papers', path: '/detector#papers' },
    ],
  },
];

export const CONTACT_EMAIL = 'saxani@udel.edu';

// Contact form. Three ways it can send, picked in this order:
// 1. The contact Worker (workers/contact/): set PUBLIC_CONTACT_ENDPOINT to its
//    URL and PUBLIC_TURNSTILE_SITE_KEY to the Turnstile site key. The Worker
//    checks Cloudflare Turnstile and other spam signals server-side, then
//    emails the message to Prof. Axani.
// 2. UD's Forms Data Processor: set CONTACT_FDP_FORM_ID (docs/contact-form-setup.md).
// 3. Neither set: pressing Send opens the visitor's email app with the message
//    already written to CONTACT_EMAIL.
// Both are public values (the Turnstile secret lives only in the Worker).
export const CONTACT_ENDPOINT: string =
  import.meta.env.PUBLIC_CONTACT_ENDPOINT ??
  'https://cosmicwatch-contact.anvayajmera9.workers.dev';
export const TURNSTILE_SITE_KEY: string =
  import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? '0x4AAAAAAGAM2BpQ5UssI6wl';
export const FDP_ACTION = 'https://udapps.nss.udel.edu/formsPro/collect';
export const CONTACT_FDP_FORM_ID = '';

export const socialLinks = {
  github: REPO_URL,
  email: `mailto:${CONTACT_EMAIL}`,
};
