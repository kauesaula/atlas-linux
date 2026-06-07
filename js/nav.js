/* Atlas Linux — navegação
   Scroll-spy do índice lateral + reveal das seções ao rolar.
   (Lógica original do documento, extraída para módulo próprio.) */
(function () {
  'use strict';

  // scroll-spy do índice
  const links = [...document.querySelectorAll('nav.toc a')];
  const map = new Map();
  links.forEach(a => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) map.set(el, a);
  });

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          const a = map.get(e.target);
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-15% 0px -75% 0px', threshold: 0 });
    map.forEach((a, el) => spy.observe(el));

    // reveal on scroll
    const rev = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          rev.unobserve(e.target);
        }
      });
    }, { threshold: 0.06 });
    document.querySelectorAll('.reveal').forEach(s => rev.observe(s));
  } else {
    // fallback: mostra tudo
    document.querySelectorAll('.reveal').forEach(s => s.classList.add('in'));
  }
})();
