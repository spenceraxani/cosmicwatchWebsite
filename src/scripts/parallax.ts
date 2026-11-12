// Hero parallax with GSAP ScrollTrigger (gsap is already a site dependency).
//   [data-parallax="0.5"]    moves down at half the scroll speed, so it looks far away
//   [data-parallax="-0.12"]  moves up a little faster than the page, so it looks closer
//   [data-parallax-content]  drifts up a little and fades as the hero leaves the screen
// Both are scoped to the nearest [data-parallax-root]. Nothing moves for visitors
// who ask their system for reduced motion.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let started = false;

export function initParallax() {
  if (started) return;
  started = true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll<HTMLElement>('[data-parallax-root]').forEach(root => {
    const scroll = { trigger: root, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true };
    root.querySelectorAll<HTMLElement>('[data-parallax]').forEach(layer => {
      const speed = Number(layer.dataset.parallax) || 0.35; // negative = towards the viewer
      gsap.to(layer, { y: () => root.offsetHeight * speed, ease: 'none', scrollTrigger: scroll });
    });
    root.querySelectorAll<HTMLElement>('[data-parallax-content]').forEach(content => {
      gsap.to(content, { y: -60, opacity: 0.25, ease: 'none', scrollTrigger: scroll });
    });
  });
}
