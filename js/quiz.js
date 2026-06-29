/* Atlas Linux — quiz de decisão
   Cinco perguntas → pontua um conjunto de distros → recomenda a
   campeã + uma reserva, com link para a ficha completa na página.
   100% client-side, sem dependências.
   As strings (perguntas, distros, textos de UI) são carregadas de
   quiz-strings.json, relativo ao próprio script (suporte a i18n). */
(function () {
  'use strict';

  const root = document.getElementById('quiz-app');
  if (!root) return;

  // base = diretório do próprio quiz.js (PT: js/ · EN: en/js/)
  const SELF = document.currentScript;
  const base = (SELF && SELF.src) ? SELF.src.replace(/quiz\.js(\?.*)?$/, '') : 'js/';

  fetch(base + 'quiz-strings.json')
    .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then((strings) => initQuiz(strings))
    .catch(() => {
      root.innerHTML = '<p style="color:var(--muted)">Não foi possível carregar o quiz.</p>';
    });

  // lógica de pontuação (não é conteúdo traduzível, permanece no JS)
  const FAMVAR = {
    debian: 'var(--fam-debian)', arch: 'var(--fam-arch)', fedora: 'var(--fam-fedora)',
    suse: 'var(--fam-suse)', indep: 'var(--fam-indep)', sec: 'var(--fam-sec)', beyond: 'var(--fam-beyond)',
  };

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

  function initQuiz(strings) {
    const UI = strings.ui;
    const DISTROS = strings.distros;
    const QUESTIONS = strings.questions;

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

      const kicker = UI.question_of
        .replace('{current}', step + 1)
        .replace('{total}', QUESTIONS.length);

      const wrap = document.createElement('div');
      wrap.className = 'quiz-step';
      wrap.innerHTML =
        '<div class="quiz-kicker">' + kicker + '</div>' +
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
      back.textContent = UI.back;
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
        '<div class="qr-eyebrow">' + UI.result_eyebrow + '</div>' +
        '<div class="qr-card" style="--c:' + col + '">' +
          '<div class="glow"></div>' +
          '<div class="qr-name">' + top.name + '</div>' +
          '<div class="qr-tags">' + tags + '</div>' +
          '<p class="qr-why">' + top.why + '</p>' +
          '<p class="qr-why" style="margin-top:10px;font-size:14px;color:var(--muted)">' + UI.compass_note + '</p>' +
          '<div class="qr-actions">' +
            '<a class="qr-link" href="#' + top.id + '">' + UI.see_full + '</a>' +
            '<button type="button" class="qr-restart">' + UI.restart + '</button>' +
          '</div>';
      if (runner) {
        html +=
          '<div class="qr-runner">' + UI.runner_prefix + ' <b>' + runner.name + '</b>. ' +
          '<a href="#' + runner.id + '">' + UI.runner_link + '</a>.</div>';
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
  }
})();
