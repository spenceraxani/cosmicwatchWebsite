// Prices stay null ("Price on request") until the lab sets them.
//
// Purchases happen on a separate store outside the University of Delaware,
// because UD does not allow payments on UD websites. Put that store's address
// here when it exists; every Buy button links to it with ?item=<product id>.
// While it is empty the buttons read "Available soon" and nothing is sold here.
export const STORE_URL = '';
export const STORE_NAME = 'the CosmicWatch store';
import blue from '@images/cw/render-blue-iso.png';
import kit from '@images/cw/render-exploded.png';
import pcb from '@images/cw/render-main-pcb.png';
import glow from '@images/cw/scintillator-glow.jpg';

// The lineup from the Nov 2026 website review with Prof. Axani. It is still
// tentative: confirm each product, what it includes and its photo with him
// before a store goes live. Kits are built around a manufactured,
// pre-populated circuit board; the lab does not ship bags of loose resistors
// and capacitors. Building from scratch is the Parts List (bottom of the page).
export interface Product {
  id: string;
  name: string;
  /** One or two sentences under the name: what this option is for. */
  summary: string;
  /** "What's included", one short line each. */
  includes: string[];
  price: number | null;
  image: ImageMetadata;
  imageAlt: string;
  cutout: boolean;
}

export const products: Product[] = [
  {
    id: 'assembled',
    name: 'Assembled Detector',
    summary:
      'A complete detector, ready to use. Plug it into a USB port and it starts counting.',
    includes: ['Fully assembled detector in its case'],
    price: null,
    image: blue,
    // TODO(Axani): the assembled model is a smaller version (called "v3C" in the
    // review). Swap in its photo and add how it differs from the v3X once he
    // confirms the name and the comparison.
    imageAlt: 'An assembled CosmicWatch detector in a blue aluminum case',
    cutout: true,
  },
  {
    id: 'kit',
    name: 'Detector Kit',
    summary:
      'A pre-populated circuit board plus the other parts to finish one detector. You assemble it with the build guide.',
    includes: [
      'Pre-populated main circuit board',
      'Plastic scintillator',
      'Other parts to finish the detector',
    ],
    price: null,
    image: kit,
    imageAlt:
      'Exploded render of the v3X showing the case, boards and scintillator',
    cutout: true,
  },
  {
    id: 'pcb-populated',
    name: 'Pre-Populated Circuit Board',
    summary:
      'The main circuit board with its surface-mount parts already soldered on. Order the rest from the Parts List.',
    includes: ['Pre-populated main circuit board'],
    price: null,
    image: pcb,
    imageAlt: 'Render of the v3X main circuit board',
    cutout: true,
  },
  {
    id: 'scintillator',
    name: 'Plastic Scintillator',
    summary: 'A 50 × 50 × 10 mm plastic scintillator, the size the v3X uses.',
    includes: ['One plastic scintillator'],
    price: null,
    image: glow,
    imageAlt: 'Plastic scintillator slabs glowing blue',
    cutout: false,
  },
];
