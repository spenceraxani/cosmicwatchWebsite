// No photos yet, so cards show initials. Confirm the list with Prof. Axani.
import type { ImageMetadata } from 'astro';

export interface Person {
  name: string;
  role: string;
  note?: string;
  email?: string;
  photo?: ImageMetadata;
}

export const team: Person[] = [
  {
    name: 'Spencer N. G. Axani',
    role: 'Assistant Professor, Physics and Astronomy, University of Delaware',
    note: 'Created CosmicWatch and leads the program.',
    email: 'saxani@udel.edu',
  },
  {
    name: 'Masooma Sarfraz',
    role: 'PhD student, University of Delaware',
    note: 'Lead author of the v3X paper.',
  },
  {
    name: 'Miles Garcia',
    role: 'University of Delaware',
    note: 'Co-author of the v3X paper.',
  },
  {
    name: 'Collin Owens',
    role: 'University of Delaware',
    note: 'Co-author of the v3X paper.',
  },
  {
    name: 'Anvay Ajmera',
    role: 'Research intern',
    note: 'Spaceflight adaptation of the v3X and this website.',
  },
];

export const collaborators: Person[] = [
  {
    name: 'Katarzyna Frankiewicz',
    role: 'Co-creator of CosmicWatch',
    note: 'Built the program with Axani while at Poland\'s National Centre for Nuclear Research.',
  },
  {
    name: 'Janet M. Conrad',
    role: 'Professor of Physics, MIT',
    note: 'Supported CosmicWatch from the start at MIT.',
  },
];

export const sponsors: { name: string; detail: string }[] = [
  { name: 'U.S. National Science Foundation', detail: 'Grant PHY-1505858 (MIT era)' },
  { name: 'MIT', detail: 'Seed funding (MIT era)' },
  { name: 'National Science Centre, Poland', detail: 'Grant 2015/17/N/ST2/04064' },
];
