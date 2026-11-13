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

// Contact form → UD's Forms Data Processor (FDP), run by UD Information
// Technologies. FDP stores each message and emails it to the address set in FDP.
// Set CONTACT_FDP_FORM_ID to the Form ID registered at https://www.udel.edu/fdp/
// (see docs/contact-form-setup.md). While it is empty the form shows a note with
// a pre-filled email to CONTACT_EMAIL instead of submitting.
export const FDP_ACTION = 'https://udapps.nss.udel.edu/formsPro/collect';
export const CONTACT_FDP_FORM_ID = '';

export const socialLinks = {
  github: REPO_URL,
  email: `mailto:${CONTACT_EMAIL}`,
};
