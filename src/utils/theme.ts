/**
 * Light / dark theme, shared by the main pages and the guides.
 * Light is the default; the moon/sun button (ThemeToggle.astro) saves the
 * visitor's choice in localStorage ('cw-theme'). The script below runs in
 * <head> before the page paints, and again after each docs page swap.
 * It sets both the `dark` class (Tailwind's dark: styles) and data-theme
 * (Starlight's colours in src/assets/styles/starlight.css).
 */
export const themeScript = `(() => {
  const apply = () => {
    let t = 'light';
    try { if (localStorage.getItem('cw-theme') === 'dark') t = 'dark'; } catch {}
    const d = document.documentElement;
    d.classList.toggle('dark', t === 'dark');
    d.dataset.theme = t;
    d.style.colorScheme = t;
  };
  apply();
  document.addEventListener('astro:after-swap', apply);
})();`;
