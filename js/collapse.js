/* Atlas Linux — cards colapsáveis
   Envolve a ficha técnica de cada distro num corpo recolhível e
   injeta um botão de toggle no cabeçalho. Animação por max-height.
   Também controla o botão "Recolher tudo / Expandir tudo" da toolbar. */
(function () {
  'use strict';

  const CHEVRON =
    '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="m6 9 6 6 6-6"/></svg>';

  const cards = [];

  document.querySelectorAll('.distro').forEach((card) => {
    const ficha = card.querySelector(':scope > .ficha');
    const head = card.querySelector(':scope > .d-head');
    if (!ficha || !head) return;

    // tudo da ficha em diante recolhe junto (ficha + eventuais irmãos seguintes)
    const body = document.createElement('div');
    body.className = 'd-body';
    ficha.parentNode.insertBefore(body, ficha);
    let node = ficha;
    while (node) {
      const next = node.nextElementSibling;
      body.appendChild(node);
      node = next;
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'd-toggle';
    btn.setAttribute('aria-expanded', 'true');
    btn.innerHTML = '<span class="lbl">ficha</span>' + CHEVRON;
    head.appendChild(btn);

    const entry = { card, btn, body };
    btn.addEventListener('click', () => toggle(entry));
    cards.push(entry);
  });

  function expand({ card, btn, body }) {
    card.classList.remove('collapsed');
    btn.setAttribute('aria-expanded', 'true');
    body.style.maxHeight = body.scrollHeight + 'px';
    body.addEventListener('transitionend', function te(e) {
      if (e.propertyName !== 'max-height') return;
      body.style.maxHeight = 'none';
      body.removeEventListener('transitionend', te);
    });
  }

  function collapse({ card, btn, body }) {
    body.style.maxHeight = body.scrollHeight + 'px';
    void body.offsetHeight; // força reflow para a transição partir de um valor concreto
    card.classList.add('collapsed');
    btn.setAttribute('aria-expanded', 'false');
    requestAnimationFrame(() => { body.style.maxHeight = '0px'; });
  }

  function toggle(entry) {
    entry.card.classList.contains('collapsed') ? expand(entry) : collapse(entry);
  }

  // botão global da toolbar
  const btnAll = document.getElementById('toggle-all');
  if (btnAll) {
    let allCollapsed = false;
    btnAll.addEventListener('click', () => {
      allCollapsed = !allCollapsed;
      cards.forEach((e) => (allCollapsed ? collapse(e) : expand(e)));
      btnAll.textContent = allCollapsed ? 'Expandir tudo' : 'Recolher tudo';
      btnAll.setAttribute('aria-pressed', String(allCollapsed));
    });
  }
})();
