/* Atlas Linux — navegação
   Scroll-spy do índice lateral + reveal das seções ao rolar.
   (Lógica original do documento, extraída para módulo próprio.) */
(function () {
  'use strict';

  // scroll-spy do índice (detecção por posição de rolagem)
  const links = [...document.querySelectorAll('nav.toc a')];
  const map = new Map();
  links.forEach(a => {
    const el = document.getElementById(a.getAttribute('href').slice(1));
    if (el) map.set(el, a);
  });
  const targets = [...map.keys()].sort((x, y) =>
    (x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);

  let ticking = false;
  function updateSpy() {
    ticking = false;
    const line = window.innerHeight * 0.30;
    let current = targets[0] || null;
    for (const el of targets) {
      if (el.getBoundingClientRect().top - line <= 0) current = el;
    }
    links.forEach(l => l.classList.remove('active'));
    const a = current && map.get(current);
    if (a) a.classList.add('active');
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(updateSpy); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateSpy();

  if ('IntersectionObserver' in window) {
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
