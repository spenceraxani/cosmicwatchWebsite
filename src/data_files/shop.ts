// Prices stay null ("Price on request") until the lab sets them.
//
// Purchases happen on a separate store outside the University of Delaware,
// because UD does not allow payments on UD websites. Put that store's address
// here when it exists; every Buy button links to it with ?item=<product id>.
// While it is empty the buttons read "Available soon" and nothing is sold here.
export const STORE_URL = '';
export const STORE_NAME = 'the CosmicWatch store';
import blue from '@images/cw/render-blue-iso.png';
import yellow from '@images/cw/render-yellow-front.png';
import pair from '@images/cw/detector-stack-cutout.png';
import kit from '@images/cw/render-exploded.png';
import pcb from '@images/cw/render-main-pcb.png';
import glow from '@images/cw/scintillator-glow.jpg';

export interface Product {
  id: string;
  name: string;
  summary: string;
  includes: string[];
  price: number | null;
  image: ImageMetadata;
  imageAlt: string;
  cutout: boolean;
  options?: { label: string; values: string[] };
  group: 'detectors' | 'build' | 'parts';
}

export const products: Product[] = [
  {
    id: 'v3x-assembled',
    name: 'v3X detector, assembled',
    summary: 'Built and tested in the UD lab. Plug it into USB and it starts counting.',
    includes: [
      '5 × 5 × 1 cm plastic scintillator and SiPM',
      'OLED screen, microSD card slot, temperature, pressure and motion sensors',
      'Aluminum case with faceplates',
      'Latest firmware installed',
    ],
    price: null,
    image: blue,
    imageAlt: 'A v3X detector in a blue aluminum case',
    cutout: true,
    options: { label: 'Case color', values: ['Blue', 'Yellow', 'Silver'] },
    group: 'detectors',
  },
  {
    id: 'v3x-pair',
    name: 'Coincidence pair',
    summary: 'Two assembled detectors and the network cable that links them. Use this for clean muon-only measurements.',
    includes: ['Two assembled v3X detectors', 'Coincidence cable', 'One USB cable powers both'],
    price: null,
    image: pair,
    imageAlt: 'Two v3X detectors, yellow and blue, stacked',
    cutout: true,
    group: 'detectors',
  },
  {
    id: 'v3x-kit',
    name: 'Build-it-yourself kit',
    summary: 'Every part on the bill of materials in one box, with both circuit boards. You solder it; the build guide walks through each step.',
    includes: ['Main board and SiPM board', 'All components from the parts list', 'Scintillator, SiPM and case', 'Printed component placement sheet'],
    price: null,
    image: kit,
    imageAlt: 'Exploded render of the v3X showing the case, boards and scintillator',
    cutout: true,
    group: 'build',
  },
  {
    id: 'v3x-pcbs',
    name: 'Circuit board set',
    summary: 'Bare main board and SiPM board, for groups who are ordering the components themselves.',
    includes: ['Main board (v28)', 'SiPM board'],
    price: null,
    image: pcb,
    imageAlt: 'Render of the v3X main circuit board',
    cutout: true,
    group: 'build',
  },
  {
    id: 'scintillator',
    name: 'Plastic scintillator',
    summary: 'A 50 × 50 × 10 mm slab, drilled for the SiPM board and wrapped light-tight.',
    includes: ['One wrapped scintillator slab'],
    price: null,
    image: glow,
    imageAlt: 'Plastic scintillator slabs glowing blue',
    cutout: false,
    group: 'parts',
  },
];

export const groups: { id: Product['group']; title: string; body: string }[] = [
  { id: 'detectors', title: 'Ready to measure', body: 'Assembled and tested detectors.' },
  { id: 'build', title: 'Build your own', body: 'Kits and boards for classes and clubs that want to solder.' },
  { id: 'parts', title: 'Spare parts', body: 'Replacements for detectors you already have.' },
];
