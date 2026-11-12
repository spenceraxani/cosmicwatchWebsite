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
