/* Atlas Linux — explorador (filtro por família + busca)
   - Deriva a família de cada distro a partir da cor (--c) já no markup,
     sem alterar o HTML existente.
   - Monta os chips de filtro dinamicamente.
   - Busca textual sobre distros, window managers e conceitos.
   - Esconde seções que ficam sem resultados. */
(function () {
  'use strict';

  const FAMILIES = [
    { k: 'debian', label: 'Debian' },
    { k: 'arch',   label: 'Arch' },
    { k: 'fedora', label: 'Fedora / RHEL' },
    { k: 'suse',   label: 'SUSE' },
    { k: 'indep',  label: 'Independentes' },
    { k: 'sec',    label: 'Segurança' },
    { k: 'beyond', label: 'Além do Linux' },
  ];

  const distros = [...document.querySelectorAll('.distro')];
  const filterable = [...document.querySelectorAll('.distro, .wm, .ccard')];
  const sections = [...document.querySelectorAll('main > section')];

  // marca a família e guarda texto normalizado p/ busca
  distros.forEach((card) => {
    const c = (card.getAttribute('style') || '');
    const m = c.match(/--fam-([a-z]+)/);
    card.dataset.family = m ? m[1] : 'beyond';
  });
  filterable.forEach((card) => {
    card.dataset.text = card.textContent.toLowerCase();
  });

  const filtersEl = document.getElementById('filters');
  const searchEl = document.getElementById('search');
  const clearEl = document.getElementById('search-clear');
  const countEl = document.getElementById('result-count');
  const emptyEl = document.getElementById('empty-state');
  const emptyReset = document.getElementById('empty-reset');

  let activeFamily = 'all';

  // ---- chips ----
  const present = new Set(distros.map((d) => d.dataset.family));
  const chips = [];
  function makeChip(k, label, dot) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fchip' + (k === 'all' ? ' active' : '');
    b.dataset.k = k;
    if (k !== 'all') b.style.setProperty('--c', 'var(--fam-' + k + ')');
    b.innerHTML = (dot ? '<span class="dot"></span>' : '') + label;
    b.setAttribute('aria-pressed', String(k === 'all'));
    b.addEventListener('click', () => {
      activeFamily = k;
      chips.forEach((c) => {
        const on = c.dataset.k === k;
        c.classList.toggle('active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      apply();
    });
    filtersEl.appendChild(b);
    chips.push(b);
  }
  makeChip('all', 'Todas', false);
  FAMILIES.filter((f) => present.has(f.k)).forEach((f) => makeChip(f.k, f.label, true));

  // ---- busca ----
  let q = '';
  function onSearch() {
    q = searchEl.value.trim().toLowerCase();
    clearEl.hidden = q.length === 0;
    apply();
  }
  searchEl.addEventListener('input', onSearch);
  clearEl.addEventListener('click', () => { searchEl.value = ''; onSearch(); searchEl.focus(); });
  if (emptyReset) emptyReset.addEventListener('click', resetAll);

  function resetAll() {
    searchEl.value = ''; q = ''; clearEl.hidden = true;
    activeFamily = 'all';
    chips.forEach((c) => {
      const on = c.dataset.k === 'all';
      c.classList.toggle('active', on);
      c.setAttribute('aria-pressed', String(on));
    });
    apply();
  }

  // ---- aplica filtro + busca ----
  function apply() {
    const searching = q.length > 0;

    filterable.forEach((card) => {
      let vis = true;
      const isDistro = card.classList.contains('distro');
      if (isDistro && activeFamily !== 'all') vis = card.dataset.family === activeFamily;
      if (vis && searching) vis = card.dataset.text.indexOf(q) !== -1;
      card.classList.toggle('is-hidden', !vis);
    });

    sections.forEach((sec) => {
      const cards = sec.querySelectorAll('.distro, .wm, .ccard');
      const visCount = [...cards].filter((c) => !c.classList.contains('is-hidden')).length;
      let show;
      if (searching) {
        show = visCount > 0; // na busca, só seções com algo que casa
      } else if (sec.querySelector('.distro')) {
        show = visCount > 0; // seção de distros respeita o filtro de família
      } else {
        show = true;         // seções conceituais ficam sempre visíveis
      }
      sec.classList.toggle('is-hidden', !show);
    });

    const visDistros = distros.filter((d) => !d.classList.contains('is-hidden')).length;
    const filtered = searching || activeFamily !== 'all';
    countEl.textContent = filtered
      ? visDistros + (visDistros === 1 ? ' distro' : ' distros')
      : '';

    const nothing = filtered &&
      filterable.filter((c) => !c.classList.contains('is-hidden')).length === 0;
    emptyEl.hidden = !nothing;
  }

  apply();
})();
