import ogImageSrc from '@images/social.png';

export const SITE = {
  title: 'CosmicWatch',
  tagline: 'The Desktop Muon Detector',
  description:
    'CosmicWatch is a University of Delaware outreach program built around a pocket-sized cosmic-ray muon detector that costs about $100 in parts and that students can build themselves.',
  description_short:
    'A pocket-sized cosmic-ray muon detector that students build themselves.',
  url: 'https://cosmicwatch.example.udel.edu',
  author: 'CosmicWatch, University of Delaware',
};

// Per-locale titles, descriptions and Open Graph text live in `src/copy/`;
// `src/utils/metadata.ts` assembles the <head> from them.
export const OG = {
  image: ogImageSrc,
};

// Shown as plain text; use official logos only with each group's permission.
const wordmark = (name: string, detail: string) =>
  `<span class="block py-3 text-center sm:text-left"><span class="block text-lg font-bold tracking-tight text-neutral-700 dark:text-neutral-300">${name}</span><span class="block text-sm text-neutral-500 dark:text-neutral-400">${detail}</span></span>`;

export const partnersData = [
  {
    icon: wordmark('MIT', 'Junior Lab'),
    name: 'MIT Junior Lab',
    href: 'https://arxiv.org/abs/2508.12111',
  },
  {
    icon: wordmark('University of Delaware', 'Advanced Lab'),
    name: 'UD Advanced Lab',
    href: 'https://arxiv.org/abs/2508.12111',
  },
  {
    icon: wordmark('Cornell', 'Intro physics labs'),
    name: 'Cornell',
    href: 'https://arxiv.org/abs/2508.12111',
  },
  {
    icon: wordmark('QuarkNet', 'Teacher workshops'),
    name: 'QuarkNet',
    href: 'https://quarknet.org/',
  },
  {
    icon: wordmark('NASA TechRise', 'Rocket and balloon payloads'),
    name: 'NASA TechRise',
    href: 'https://arxiv.org/abs/2508.12111',
  },
];
