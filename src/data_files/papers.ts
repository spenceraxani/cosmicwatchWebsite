/** Papers about CosmicWatch, newest first. Shown in the About section of the home page. */
export interface Paper {
  year: number;
  title: string;
  authors: string;
  venue: string;
  url: string;
  arxiv?: string;
}

export const papers: Paper[] = [
  {
    year: 2026,
    title:
      'The CosmicWatch Desktop Muon Detector (v3X): Prototype Design and Adaptation for Spaceflight',
    authors: 'A. Ajmera, S. N. G. Axani',
    venue: 'arXiv preprint',
    url: 'https://arxiv.org/abs/2610.07199',
    arxiv: '2610.07199',
  },
  {
    year: 2025,
    title: 'CosmicWatch: The Desktop Muon Detector (v3X)',
    authors:
      'S. Axani, M. Sarfraz, M. Garcia, C. Owens, K. Frankiewicz, J. M. Conrad',
    venue: 'Journal of Instrumentation 20, P10040',
    url: 'https://doi.org/10.1088/1748-0221/20/10/P10040',
    arxiv: '2508.12111',
  },
  {
    year: 2019,
    title: 'The Physics Behind the CosmicWatch Desktop Muon Detectors',
    authors: 'S. N. Axani',
    venue: "MIT master's thesis",
    url: 'https://arxiv.org/abs/1908.00146',
    arxiv: '1908.00146',
  },
  {
    year: 2018,
    title:
      'The CosmicWatch Desktop Muon Detector: a self-contained, pocket sized particle detector',
    authors: 'S. N. Axani, K. Frankiewicz, J. M. Conrad',
    venue: 'Journal of Instrumentation 13, P03019',
    url: 'https://arxiv.org/abs/1801.03029',
    arxiv: '1801.03029',
  },
  {
    year: 2017,
    title:
      'The Desktop Muon Detector: A simple, physics-motivated machine- and electronics-shop project for university students',
    authors: 'S. N. Axani, J. M. Conrad, C. Kirby',
    venue: 'American Journal of Physics 85, 948',
    url: 'https://doi.org/10.1119/1.5003806',
    arxiv: '1606.01196',
  },
];
