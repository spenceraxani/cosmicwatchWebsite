// Labels for these ids live in the copy table.
export type NavLinkId =
  | 'about'
  | 'detector'
  | 'docs'
  | 'measure'
  | 'software'
  | 'news'
  | 'people'
  | 'contact';

export const navLinks: { id: NavLinkId; path: string }[] = [
  { id: 'about', path: '/about' },
  { id: 'detector', path: '/detector' },
  { id: 'docs', path: '/docs/' },
  { id: 'measure', path: '/measure' },
  { id: 'software', path: '/software' },
  { id: 'news', path: '/news' },
  { id: 'people', path: '/people' },
  { id: 'contact', path: '/contact' },
];

export type FooterSectionId = 'program' | 'detector' | 'get';
export type FooterLinkId =
  | 'about'
  | 'people'
  | 'news'
  | 'contact'
  | 'detector'
  | 'build'
  | 'measurements'
  | 'troubleshooting'
  | 'measure'
  | 'software'
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
      { id: 'about', path: '/about' },
      { id: 'people', path: '/people' },
      { id: 'news', path: '/news' },
      { id: 'contact', path: '/contact' },
    ],
  },
  {
    id: 'detector',
    links: [
      { id: 'detector', path: '/detector' },
      { id: 'build', path: '/docs/build/' },
      { id: 'measurements', path: '/docs/measurements/' },
      { id: 'troubleshooting', path: '/docs/troubleshooting/' },
    ],
  },
  {
    id: 'get',
    links: [
      { id: 'measure', path: '/measure' },
      { id: 'software', path: '/software' },
      { id: 'purchase', path: '/shop' },
      { id: 'github', path: '/github' },
      { id: 'papers', path: '/about#papers' },
    ],
  },
];

export const REPO = 'spenceraxani/CosmicWatch-Desktop-Muon-Detector-v3X';
export const REPO_URL = `https://github.com/${REPO}`;
export const CONTACT_EMAIL = 'saxani@udel.edu';

export const socialLinks = {
  github: REPO_URL,
  email: `mailto:${CONTACT_EMAIL}`,
};
