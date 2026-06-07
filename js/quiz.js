/* Atlas Linux — quiz de decisão
   Cinco perguntas → pontua um conjunto de distros → recomenda a
   campeã + uma reserva, com link para a ficha completa na página.
   100% client-side, sem dependências. */
(function () {
  'use strict';

  const root = document.getElementById('quiz-app');
  if (!root) return;

  const FAMVAR = {
    debian: 'var(--fam-debian)', arch: 'var(--fam-arch)', fedora: 'var(--fam-fedora)',
    suse: 'var(--fam-suse)', indep: 'var(--fam-indep)', sec: 'var(--fam-sec)', beyond: 'var(--fam-beyond)',
  };

  const DISTROS = {
    mint:      { name: 'Linux Mint', id: 'mint-zorin', fam: 'debian', tags: ['base · Ubuntu', 'Cinnamon', 'sem dramas'],
      why: 'A recomendação nº1 do mundo para quem vem do Windows. Interface familiar, estável, sem Snap por padrão e uma comunidade gigante — você acha tudo onde imagina.' },
    zorin:     { name: 'Zorin OS', id: 'mint-zorin', fam: 'debian', tags: ['base · Ubuntu', 'visual', 'transição'],
      why: 'Quando a estética importa: um painel troca o layout inteiro para imitar Windows 11 ou macOS. Impressiona já no primeiro dia e é ideal para migração sem treinamento.' },
    pop:       { name: 'Pop!_OS', id: 'pop', fam: 'debian', tags: ['base · Ubuntu', 'NVIDIA', 'dev'],
      why: 'Feita por uma fabricante de hardware: NVIDIA sem dor (ISO com drivers), tiling embutido e foco em produtividade. A opção menos chata para subir LLMs/Stable Diffusion numa RTX.' },
    fedora:    { name: 'Fedora Workstation', id: 'fedora', fam: 'fedora', tags: ['~6 meses', 'GNOME puro', 'vanguarda'],
      why: 'O equilíbrio entre moderno e estável: as tecnologias novas estreiam aqui, mas testadas. GNOME puro, SELinux de fábrica e excelente para desenvolvimento.' },
    bazzite:   { name: 'Bazzite', id: 'bazzite', fam: 'fedora', tags: ['atômica', 'gaming', 'zero manutenção'],
      why: 'Imutável e praticamente impossível de quebrar: jogos funcionam de cara, atualiza como bloco único e reverte no boot. "Instale, jogue e esqueça que é Linux".' },
    nobara:    { name: 'Nobara', id: 'nobara', fam: 'fedora', tags: ['base · Fedora', 'gaming', 'mídia'],
      why: 'Fedora com codecs, drivers e patches de kernel para jogos já resolvidos pelo criador do Proton-GE. Instala e já está pronto para jogar e criar conteúdo.' },
    cachyos:   { name: 'CachyOS', id: 'cachyos', fam: 'arch', tags: ['base · Arch', 'performance', 'gaming'],
      why: 'Arch turbinado: pacotes recompilados para CPUs modernas (x86-64-v3/v4) e kernel com scheduler afinado. Em hardware recente, é praticamente trapaça de desempenho.' },
    garuda:    { name: 'Garuda Linux', id: 'garuda', fam: 'arch', tags: ['base · Arch', 'visual', 'snapshots'],
      why: 'Arch de gamer com visual exuberante e snapshots Btrfs automáticos — se um update quebrar, você volta no tempo em segundos. Bonito e com rede de segurança.' },
    arch:      { name: 'Arch Linux', id: 'arch', fam: 'arch', tags: ['raiz', 'rolling', 'DIY'],
      why: 'Minimalismo radical: você monta tudo e entende cada peça. Rolling release, AUR para quase tudo e a melhor wiki do planeta. O caminho para aprender Linux de verdade.' },
    endeavour: { name: 'EndeavourOS', id: 'endeavour', fam: 'arch', tags: ['base · Arch', 'rolling', 'quase-vanilla'],
      why: 'O melhor meio-termo Arch: instalador gráfico amigável e um sistema quase idêntico ao Arch puro. Ganha a wiki e o AUR de presente, sem o ritual da instalação manual.' },
    omarchy:   { name: 'Omarchy', id: 'omarchy', fam: 'arch', tags: ['base · Arch', 'Hyprland', 'opinativa'],
      why: 'Arch + Hyprland lindo e pré-configurado (por DHH). Resolve a tela preta intimidadora do Hyprland: teclado-centrado, dev toolkit afinado e estética pronta para ricing.' },
    mxlinux:   { name: 'MX Linux', id: 'leves', fam: 'debian', tags: ['base · Debian', 'leve', 'MX Tools'],
      why: 'Estabilidade do Debian com leveza real e os MX Tools (central gráfica). Perfeito para ressuscitar máquinas com pouca RAM sem abrir mão de conforto.' },
    nixos:     { name: 'NixOS', id: 'nixos', fam: 'indep', tags: ['declarativa', 'reproduzível', 'IaC'],
      why: 'O sistema inteiro descrito num arquivo: reproduzível, atômico e reversível por geração. Infra-como-código aplicada ao SO — paraíso de quem ama dotfiles versionados.' },
    tails:     { name: 'Tails', id: 'tails', fam: 'sec', tags: ['Tor', 'amnésico', 'live USB'],
      why: 'Privacidade ao extremo: roda de um pendrive, força todo o tráfego pelo Tor e não deixa rastro ao desligar. A escolha de jornalistas e ativistas.' },
    kali:      { name: 'Kali Linux', id: 'kali', fam: 'sec', tags: ['pentest', 'rolling', 'ferramentas'],
      why: 'Centenas de ferramentas de segurança ofensiva pré-instaladas. Para auditorias e estudo de pentest — use em VM ou live USB, não como sistema do dia a dia.' },
  };

  const QUESTIONS = [
    { id: 'origem', q: 'De onde você está vindo?', opts: [
      { k: 'windows', e: '🪟', t: 'Do Windows', d: 'Quero algo familiar, menu e barra no lugar esperado.' },
      { k: 'mac',     e: '🍎', t: 'Do macOS',   d: 'Curto a estética Mac e quero algo parecido.' },
      { k: 'linux',   e: '🐧', t: 'Já uso Linux', d: 'Quero subir de nível ou trocar de distro.' },
      { k: 'novo',    e: '✨', t: 'Primeiro contato', d: 'Começando do zero, sem vícios.' },
    ]},
    { id: 'hardware', q: 'Como é a máquina?', opts: [
      { k: 'antigo',  e: '🪶', t: 'Antiga / fraca', d: 'Menos de 4 GB de RAM, hardware de 5–10 anos.' },
      { k: 'mediano', e: '💻', t: 'Mediana',        d: 'Notebook ou desktop comum, dá conta do recado.' },
      { k: 'parruda', e: '🚀', t: 'Parruda / nova',  d: 'CPU recente, GPU dedicada, bastante RAM.' },
    ]},
    { id: 'objetivo', q: 'Qual o uso principal?', opts: [
      { k: 'geral',     e: '🌐', t: 'Uso geral',  d: 'Navegar, vídeo, documentos, dia a dia.' },
      { k: 'gaming',    e: '🎮', t: 'Jogos',       d: 'Steam/Proton, talvez handheld.' },
      { k: 'dev',       e: '⌨️', t: 'Desenvolvimento', d: 'Programar, containers, workstation.' },
      { k: 'priv',      e: '🛡️', t: 'Privacidade & segurança', d: 'Anonimato, pentest, ambientes hostis.' },
      { k: 'aprender',  e: '🧠', t: 'Aprender a fundo', d: 'Entender o Linux peça por peça.' },
    ]},
    { id: 'manutencao', q: 'Quanta manutenção topa fazer?', opts: [
      { k: 'zero',  e: '😴', t: 'Zero',  d: 'Quero que simplesmente funcione, sempre.' },
      { k: 'media', e: '🔧', t: 'Média', d: 'Resolvo um problema ocasional sem drama.' },
      { k: 'gosto', e: '🛠️', t: 'Adoro mexer', d: 'Configurar e ajustar faz parte da diversão.' },
    ]},
    { id: 'estetica', q: 'E a estética / ricing?', opts: [
      { k: 'nao',     e: '🤷', t: 'Tanto faz', d: 'Só quero usar, o visual é detalhe.' },
      { k: 'pronto',  e: '🎨', t: 'Bonito pronto', d: 'Quero algo lindo, mas já configurado.' },
      { k: 'montar',  e: '🧩', t: 'Montar do zero', d: 'Quero meu desktop sob medida, keyboard-driven.' },
    ]},
  ];

  const SCORE = {
    origem: {
      windows:  { mint: 3, zorin: 3, pop: 1 },
      mac:      { zorin: 3, pop: 2, fedora: 1 },
      linux:    { arch: 2, fedora: 2, endeavour: 2, cachyos: 1, nixos: 1 },
      novo:     { mint: 3, zorin: 2, fedora: 1 },
    },
    hardware: {
      antigo:   { mxlinux: 4, mint: 1 },
      mediano:  { mint: 2, fedora: 2, zorin: 1, pop: 1 },
      parruda:  { cachyos: 3, bazzite: 2, pop: 2, fedora: 1, arch: 1 },
    },
    objetivo: {
      geral:    { mint: 3, zorin: 2, fedora: 1 },
      gaming:   { bazzite: 4, cachyos: 4, nobara: 2, garuda: 2, pop: 1 },
      dev:      { fedora: 3, pop: 2, arch: 2, nixos: 2, endeavour: 1 },
      priv:     { tails: 9, kali: 6 },
      aprender: { arch: 4, endeavour: 3, nixos: 2 },
    },
    manutencao: {
      zero:     { bazzite: 3, mint: 2, zorin: 2, fedora: 1 },
      media:    { fedora: 2, pop: 2, endeavour: 1, mint: 1, garuda: 1 },
      gosto:    { arch: 3, cachyos: 2, nixos: 2, endeavour: 1, omarchy: 1 },
    },
    estetica: {
      nao:      { mint: 1, fedora: 1 },
      pronto:   { zorin: 2, garuda: 2, bazzite: 1, pop: 1 },
      montar:   { arch: 3, omarchy: 2, endeavour: 1, nixos: 1 },
    },
  };

  let step = 0;
  const answers = {};

  function render() {
    if (step >= QUESTIONS.length) return showResult();
    const Q = QUESTIONS[step];
    root.innerHTML = '';

    const prog = document.createElement('div');
    prog.className = 'quiz-progress';
    QUESTIONS.forEach((_, i) => {
      const i2 = document.createElement('i');
      if (i < step) i2.className = 'done';
      else if (i === step) i2.className = 'current';
      prog.appendChild(i2);
    });
    root.appendChild(prog);

    const wrap = document.createElement('div');
    wrap.className = 'quiz-step';
    wrap.innerHTML =
      '<div class="quiz-kicker">Pergunta <span>' + (step + 1) + '</span> de ' + QUESTIONS.length + '</div>' +
      '<div class="quiz-q">' + Q.q + '</div>';

    const opts = document.createElement('div');
    opts.className = 'quiz-opts';
    Q.opts.forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-opt';
      b.innerHTML =
        '<span class="ot"><span class="oe">' + o.e + '</span>' + o.t + '</span>' +
        '<span class="od">' + o.d + '</span>';
      b.addEventListener('click', () => {
        answers[Q.id] = o.k;
        step++;
        render();
      });
      opts.appendChild(b);
    });
    wrap.appendChild(opts);

    const nav = document.createElement('div');
    nav.className = 'quiz-nav';
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'quiz-back';
    back.textContent = '← Voltar';
    back.disabled = step === 0;
    back.addEventListener('click', () => { if (step > 0) { step--; render(); } });
    nav.appendChild(back);
    wrap.appendChild(nav);

    root.appendChild(wrap);
  }

  function tally() {
    const scores = {};
    Object.keys(answers).forEach((qid) => {
      const table = SCORE[qid] && SCORE[qid][answers[qid]];
      if (!table) return;
      Object.keys(table).forEach((d) => { scores[d] = (scores[d] || 0) + table[d]; });
    });
    return Object.keys(scores)
      .map((d) => ({ d, s: scores[d] }))
      .sort((a, b) => b.s - a.s);
  }

  function showResult() {
    const ranked = tally();
    const top = ranked[0] ? DISTROS[ranked[0].d] : DISTROS.mint;
    const runner = ranked[1] ? DISTROS[ranked[1].d] : null;
    const col = FAMVAR[top.fam] || 'var(--lav)';

    root.innerHTML = '';
    const res = document.createElement('div');
    res.className = 'quiz-result';

    const tags = top.tags.map((t) => '<span class="qr-tag">' + t + '</span>').join('');
    let html =
      '<div class="qr-eyebrow">// sua distro</div>' +
      '<div class="qr-card" style="--c:' + col + '">' +
        '<div class="glow"></div>' +
        '<div class="qr-name">' + top.name + '</div>' +
        '<div class="qr-tags">' + tags + '</div>' +
        '<p class="qr-why">' + top.why + '</p>' +
        '<div class="qr-actions">' +
          '<a class="qr-link" href="#' + top.id + '">Ver a ficha completa</a>' +
          '<button type="button" class="qr-restart">↺ Refazer o quiz</button>' +
        '</div>';
    if (runner) {
      html +=
        '<div class="qr-runner">Segunda opção: <b>' + runner.name + '</b> — ' +
        '<a href="#' + runner.id + '">ver ficha</a>.</div>';
    }
    html += '</div>';
    res.innerHTML = html;
    root.appendChild(res);

    res.querySelector('.qr-restart').addEventListener('click', () => {
      step = 0;
      Object.keys(answers).forEach((k) => delete answers[k]);
      render();
      if (root.scrollIntoView) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  render();
})();
