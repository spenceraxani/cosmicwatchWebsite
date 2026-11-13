/**
 * Design toggles: a small panel in the bottom-left corner to switch between
 * the hero and nav designs while we compare them (DesignToggles.astro).
 *
 * Shown on the dev server only. Set TOGGLES_ON to true to ship them in a build too.
 */
export const TOGGLES_ON = import.meta.env.DEV;

/** Choices, stored in localStorage and mirrored on <html data-hero / data-nav>. */
export const HERO_CHOICES = [
  { id: 'photo', label: 'Photo' },
  { id: 'original', label: 'Old' },
] as const;
export const NAV_CHOICES = [
  { id: 'bar', label: 'Bar' },
  { id: 'bubble', label: 'Bubble' },
] as const;

/**
 * Runs in <head> before the page paints, so the saved choice shows without a
 * flash, and again after each docs page swap (view transitions replace <html>
 * attributes).
 */
export const earlyScript = `(() => {
  const apply = () => {
    const d = document.documentElement;
    try {
      d.dataset.hero = localStorage.getItem('cw-hero') || 'photo';
      d.dataset.nav = localStorage.getItem('cw-nav') || 'bar';
    } catch {}
  };
  apply();
  document.addEventListener('astro:after-swap', apply);
})();`;
