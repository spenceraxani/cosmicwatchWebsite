// Background photos for the full-screen hero, all from the CosmicWatch v3X
// manuals on GitHub (cropped to remove baked-in captions). Compare them at
// /hero-lab/ on the dev server.
import type { ImageMetadata } from 'astro';
import glow from '@images/hero/scintillator-glow.jpg';
import superK from '@images/hero/super-kamiokande.jpg';
import southPole from '@images/hero/south-pole.jpg';
import stack from '@images/hero/detector-stack.jpg';
import v2 from '@images/hero/v2-board.jpg';
import gui from '@images/hero/gui-live.jpg';

export interface HeroPhoto {
  label: string;
  image: ImageMetadata;
  alt: string;
  /** CSS object-position for the crop, e.g. '50% 40%'. */
  position: string;
  /** Short caption shown in the corner, saying what the photo is. */
  caption: string;
}

export const heroPhotos = {
  'photo-glow': {
    label: '1 · Scintillator',
    image: glow,
    alt: 'A stack of plastic scintillator tiles glowing blue under ultraviolet light',
    position: '50% 45%',
    caption: 'Plastic scintillator under UV light',
  },
  'photo-superk': {
    label: '2 · Super-K',
    image: superK,
    alt: 'A researcher in a raft inside the Super-Kamiokande detector, its wall lined with photomultiplier tubes',
    // Favour the wall of light sensors on the right over the person on the left.
    position: '100% 30%',
    caption: 'Measuring the muon rate inside Super-Kamiokande, 1 km underground',
  },
  'photo-southpole': {
    label: '3 · South Pole',
    image: southPole,
    alt: 'A C-130 Hercules aircraft on the ice at McMurdo, Antarctica',
    position: '40% 50%',
    caption: 'Deploying a detector to the South Pole',
  },
  'photo-stack': {
    label: '4 · v3X stack',
    image: stack,
    alt: 'Two v3X detectors stacked in the lab, one yellow and one blue, their screens lit',
    position: '50% 45%',
    caption: 'Two v3X detectors running in coincidence',
  },
  'photo-v2': {
    label: '5 · Board',
    image: v2,
    alt: 'Close-up of a CosmicWatch circuit board and scintillator, lit red',
    position: '50% 50%',
    caption: 'A CosmicWatch v2 detector',
  },
  'photo-gui': {
    label: '6 · Live data',
    image: gui,
    alt: 'The CosmicWatch GUI plotting days of muon rate data',
    position: '30% 35%',
    caption: 'Days of muon data in the CosmicWatch GUI',
  },
} satisfies Record<string, HeroPhoto>;

export type HeroPhotoKey = keyof typeof heroPhotos;
