// The current team only (Prof. Axani: list active people so visitors know who to
// contact). No photos yet, so cards show initials. Confirm the list with him.
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
