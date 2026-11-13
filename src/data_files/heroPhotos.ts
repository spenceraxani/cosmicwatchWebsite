// The home page's full-screen hero photo: the banner from the original
// CosmicWatch site (cosmicwatch.lns.mit.edu).
import type { ImageMetadata } from 'astro';
import mitEarth from '@images/hero/mit-earth.jpg';

export interface HeroPhoto {
  image: ImageMetadata;
  alt: string;
  /** CSS object-position for the crop, e.g. '50% 40%'. */
  position: string;
}

export const heroPhoto: HeroPhoto = {
  image: mitEarth,
  alt: 'A yellow CosmicWatch detector and a silver CosmicWatch detector in front of an illustration of cosmic-ray tracks hitting the Earth',
  // Keep the two detectors in view below the centred headline.
  position: '50% 75%',
};
