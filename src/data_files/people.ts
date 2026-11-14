// People actively working on CosmicWatch, shown on the Contact page between the
// form and the FAQ. Prof. Axani asked for active people only, each with what
// they contributed. Photos: add a file to src/images/people/ and set `photo`
// (import it at the top) only for people happy to have their face on the site;
// everyone else shows initials.
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
    role: 'Assistant Professor, Physics & Astronomy, University of Delaware',
    email: 'saxani@udel.edu',
  },
  {
    name: 'Masooma Sarfraz',
    role: 'PhD student, University of Delaware',
  },
  {
    name: 'Miles Garcia',
    role: 'PhD student, University of Delaware',
  },
  {
    name: 'Collin Owens',
    role: 'University of Delaware',
  },
  {
    name: 'Anvay Ajmera',
    role: 'Research intern, University of Delaware',
  },
];
