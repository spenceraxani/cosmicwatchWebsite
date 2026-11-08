// Entrance motion from tailwindcss-motion, triggered by tailwindcss-intersect
// when an element first scrolls into view. Short, small and once only;
// prefers-reduced-motion turns it off (global.css).
export const reveal =
  'intersect:motion-opacity-in-0 intersect:motion-translate-y-in-[12px] intersect:motion-duration-[450ms] intersect:motion-ease-out-cubic intersect-once';

export const revealImage =
  'intersect:motion-opacity-in-0 intersect:motion-scale-in-[0.985] intersect:motion-duration-[600ms] intersect:motion-ease-out-cubic intersect-once';

const delays = [
  '',
  'intersect:motion-delay-[60ms]',
  'intersect:motion-delay-[120ms]',
  'intersect:motion-delay-[180ms]',
  'intersect:motion-delay-[240ms]',
  'intersect:motion-delay-[300ms]',
];

// Stagger items in a row or list; capped so long lists don't drag.
export const delay = (i: number) => delays[Math.min(i, delays.length - 1)];
