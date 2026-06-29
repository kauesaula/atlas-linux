#!/usr/bin/env node
/* Atlas Linux — gerador de i18n (Node puro, sem dependências).
 *
 *   node scripts/build-i18n.js            → gera en/ a partir de i18n/en.json
 *   node scripts/build-i18n.js --extract  → gera i18n/_template.json (chaves + PT)
 *
 * O index.html PT-BR é a fonte única. As chaves traduzíveis são derivadas
 * da estrutura DOM real (sem data-i18n no HTML). Parsing por regex/string
 * ancorado nas estruturas consistentes do projeto (ver atlas-i18n-spec.md §8).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://kauesaula.github.io/atlas-linux/';
const P = (...p) => path.join(ROOT, ...p);

/* ============================================================
   1. Helpers de HTML — casamento de tags balanceado
   ============================================================ */

// índice do '>' que fecha a tag de abertura que começa em `i` ('<').
function openTagEnd(html, i) {
  let q = null;
  for (let j = i + 1; j < html.length; j++) {
    const c = html[j];
    if (q) { if (c === q) q = null; }
    else if (c === '"' || c === "'") q = c;
    else if (c === '>') return j;
  }
  return -1;
}

// innerHTML do elemento `tagName` cuja tag de abertura começa em openStart.
// Conta aninhamento do mesmo tagName e respeita self-closing. Retorna
// {innerStart, innerEnd, outerEnd} ou null.
function elementInner(html, openStart, tagName) {
  const otEnd = openTagEnd(html, openStart);
  if (otEnd < 0) return null;
  const selfClose = html[otEnd - 1] === '/';
  const innerStart = otEnd + 1;
  if (selfClose) return { innerStart, innerEnd: innerStart, outerEnd: otEnd + 1 };

  const re = new RegExp('<' + tagName + '\\b|</' + tagName + '\\s*>', 'gi');
  re.lastIndex = innerStart;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    if (m[0][1] === '/') {
      depth--;
      if (depth === 0) return { innerStart, innerEnd: m.index, outerEnd: re.lastIndex };
    } else {
      const oe = openTagEnd(html, m.index);
      if (oe >= 0 && html[oe - 1] !== '/') depth++;
      re.lastIndex = (oe >= 0 ? oe : m.index) + 1;
    }
  }
  return null;
}

function slug(s) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// texto puro (sem tags), para derivar slugs de identificadores (h4 de WM, grp).
function plain(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// primeira tag de abertura que casa `re` dentro de [from, to).
function firstOpen(html, from, to, re) {
  re.lastIndex = from;
  const m = re.exec(html);
  if (m && m.index < to) return m;
  return null;
}

/* ============================================================
   2. Extração de edições do index.html
   ============================================================
   Cada "edit" = {innerStart, innerEnd, key}. As ranges nunca se
   sobrepõem (editamos folhas + o innerHTML inteiro de cada callout).
   A mesma travessia serve para --extract (coletar key→PT) e para
   geração (substituir innerHTML).
*/

function collectIndexEdits(html) {
  const edits = [];
  const order = [];
  const seen = new Set();

  function add(key, openStart, tagName) {
    const inner = elementInner(html, openStart, tagName);
    if (!inner) return;
    let k = key, n = 2;
    while (seen.has(k)) { k = key + '__' + n; n++; }
    seen.add(k);
    edits.push({ innerStart: inner.innerStart, innerEnd: inner.innerEnd, key: k });
    order.push(k);
  }

  // ---- HERO ----
  const heroOpen = html.indexOf('<header class="hero">');
  if (heroOpen >= 0) {
    const hero = elementInner(html, heroOpen, 'header');
    const a = hero.innerStart, b = hero.innerEnd;
    let m;
    if ((m = firstOpen(html, a, b, /<div class="eyebrow">/g))) add('hero.eyebrow', m.index, 'div');
    if ((m = firstOpen(html, a, b, /<p class="subtitle">/g)))  add('hero.subtitle', m.index, 'p');
    if ((m = firstOpen(html, a, b, /<p class="lede">/g)))      add('hero.lede', m.index, 'p');
  }

  // ---- NAV TOC ----
  const navOpen = html.indexOf('<nav class="toc">');
  if (navOpen >= 0) {
    const nav = elementInner(html, navOpen, 'nav');
    const a = nav.innerStart, b = nav.innerEnd;
    const reGrp = /<div class="grp">/g; reGrp.lastIndex = a;
    let m;
    while ((m = reGrp.exec(html)) && m.index < b) {
      const inner = elementInner(html, m.index, 'div');
      add('nav.grp.' + slug(plain(html.slice(inner.innerStart, inner.innerEnd))), m.index, 'div');
    }
    const reA = /<a href="#([^"]+)"[^>]*>/g; reA.lastIndex = a;
    while ((m = reA.exec(html)) && m.index < b) {
      add('nav.link.' + m[1], m.index, 'a');
    }
  }

  // ---- SECTIONS ----
  const sections = [];
  {
    const re = /<section\b[^>]*>/gi; let m;
    while ((m = re.exec(html))) {
      const inner = elementInner(html, m.index, 'section');
      if (!inner) continue;
      let key = null;
      const idm = /id="([^"]+)"/.exec(m[0]);
      if (idm) key = idm[1];
      else {
        // último comentário antes da section, se for adjacente (só espaço entre eles)
        const before = html.slice(0, m.index);
        const reC = /<!--([\s\S]*?)-->/g;
        let cm2, last = null, lastEnd = -1;
        while ((cm2 = reC.exec(before))) { last = cm2[1]; lastEnd = reC.lastIndex; }
        if (last !== null && before.slice(lastEnd).trim() === '') key = slug(last);
      }
      if (!key) key = 'sec_' + sections.length;
      sections.push({ key, start: m.index, innerStart: inner.innerStart, end: inner.innerEnd });
      re.lastIndex = inner.outerEnd;
    }
  }

  // ---- ARTICLES (distros) — para saber o que é "interno a card" ----
  const articles = [];
  {
    const re = /<article\b[^>]*\bclass="distro"[^>]*>/gi; let m;
    while ((m = re.exec(html))) {
      const inner = elementInner(html, m.index, 'article');
      if (!inner) continue;
      const idm = /id="([^"]+)"/.exec(m[0]);
      articles.push({ id: idm ? idm[1] : 'art_' + articles.length, start: m.index, innerStart: inner.innerStart, end: inner.innerEnd });
      re.lastIndex = inner.outerEnd;
    }
  }

  // ---- por SEÇÃO: sec-head, subheads, intros, callouts, ccards, tabelas ----
  for (const sec of sections) {
    const a = sec.innerStart, b = sec.end;
    let m;

    // sec-head
    const shOpen = firstOpen(html, a, b, /<div class="sec-head">/g);
    if (shOpen) {
      const sh = elementInner(html, shOpen.index, 'div');
      const ha = sh.innerStart, hb = sh.innerEnd;
      let e;
      if ((e = firstOpen(html, ha, hb, /<div class="sec-idx">/g)))        add(sec.key + '.sec_idx', e.index, 'div');
      if ((e = firstOpen(html, ha, hb, /<h2 class="sec-title">/g)))       add(sec.key + '.sec_title', e.index, 'h2');
      if ((e = firstOpen(html, ha, hb, /<p class="sec-intro"[^>]*>/g)))   add(sec.key + '.sec_intro', e.index, 'p');
    }

    // subheads (h3.subhead) — texto inclui o <span class="mk">
    let n = 0;
    const reSub = /<h3 class="subhead"[^>]*>/g; reSub.lastIndex = a;
    while ((m = reSub.exec(html)) && m.index < b) { add(sec.key + '.subhead.' + (n++), m.index, 'h3'); }

    // sec-intro fora do sec-head
    n = 0;
    const reIntro = /<p class="sec-intro"[^>]*>/g; reIntro.lastIndex = a;
    while ((m = reIntro.exec(html)) && m.index < b) {
      if (shOpen && m.index >= shOpen.index && m.index < elementInner(html, shOpen.index, 'div').innerEnd) continue;
      add(sec.key + '.intro.' + (n++), m.index, 'p');
    }

    // callouts — innerHTML inteiro (preserva <span class="tag"> + corpo)
    n = 0;
    const reCo = /<div class="callout[^"]*">/g; reCo.lastIndex = a;
    while ((m = reCo.exec(html)) && m.index < b) { add(sec.key + '.callout.' + (n++), m.index, 'div'); }

    // ccards — h4 / .term / p(.m) / .ana
    n = 0;
    const reCc = /<div class="ccard">/g; reCc.lastIndex = a;
    while ((m = reCc.exec(html)) && m.index < b) {
      const cc = elementInner(html, m.index, 'div');
      const ca = cc.innerStart, cb = cc.innerEnd;
      let e;
      if ((e = firstOpen(html, ca, cb, /<h4[^>]*>/g)))            add(sec.key + '.ccard.' + n + '.h4', e.index, 'h4');
      if ((e = firstOpen(html, ca, cb, /<div class="term">/g)))   add(sec.key + '.ccard.' + n + '.term', e.index, 'div');
      let pn = 0;
      const reP = /<p(?:\s[^>]*)?>/g; reP.lastIndex = ca;
      let pm;
      while ((pm = reP.exec(html)) && pm.index < cb) { add(sec.key + '.ccard.' + n + '.p.' + (pn++), pm.index, 'p'); }
      if ((e = firstOpen(html, ca, cb, /<div class="ana">/g)))    add(sec.key + '.ccard.' + n + '.ana', e.index, 'div');
      reCc.lastIndex = cc.outerEnd;
      n++;
    }

    // tabelas .cmp — th / td
    let t = 0;
    const reT = /<table class="cmp">/g; reT.lastIndex = a;
    while ((m = reT.exec(html)) && m.index < b) {
      const tb = elementInner(html, m.index, 'table');
      const ta = tb.innerStart, te = tb.innerEnd;
      let ci = 0;
      const reTh = /<th[^>]*>/g; reTh.lastIndex = ta;
      let cm;
      while ((cm = reTh.exec(html)) && cm.index < te) { add(sec.key + '.table.' + t + '.th.' + (ci++), cm.index, 'th'); }
      // linhas
      let ri = 0;
      const reTr = /<tr[^>]*>/g; reTr.lastIndex = ta;
      let rm;
      while ((rm = reTr.exec(html)) && rm.index < te) {
        const rb = elementInner(html, rm.index, 'tr');
        let cc2 = 0;
        const reTd = /<td[^>]*>/g; reTd.lastIndex = rb.innerStart;
        let dm;
        while ((dm = reTd.exec(html)) && dm.index < rb.innerEnd) { add(sec.key + '.table.' + t + '.r.' + ri + '.c.' + (cc2++), dm.index, 'td'); }
        if (cc2 > 0) ri++;
        reTr.lastIndex = rb.outerEnd;
      }
      reT.lastIndex = tb.outerEnd;
      t++;
    }

    // WM cards (.wm) dentro da seção — wm.{slug}.cfg / wm.{slug}.p
    const reWm = /<div class="wm"(?:\s+style="[^"]*")?>/g; reWm.lastIndex = a;
    while ((m = reWm.exec(html)) && m.index < b) {
      const wm = elementInner(html, m.index, 'div');
      const wa = wm.innerStart, wb = wm.innerEnd;
      const h4 = firstOpen(html, wa, wb, /<h4[^>]*>/g);
      let sl = 'wm_' + Math.floor(m.index);
      if (h4) { const hi = elementInner(html, h4.index, 'h4'); sl = slug(plain(html.slice(hi.innerStart, hi.innerEnd))); }
      let e;
      if ((e = firstOpen(html, wa, wb, /<div class="cfg">/g))) add('wm.' + sl + '.cfg', e.index, 'div');
      if ((e = firstOpen(html, wa, wb, /<p(?:\s[^>]*)?>/g)))          add('wm.' + sl + '.p', e.index, 'p');
      reWm.lastIndex = wm.outerEnd;
    }
  }

  // ---- ARTICLES (distros): tag / desc / ficha ----
  for (const ar of articles) {
    const a = ar.innerStart, b = ar.end;
    let e;
    if ((e = firstOpen(html, a, b, /<span class="d-tag">/g))) add(ar.id + '.tag', e.index, 'span');
    if ((e = firstOpen(html, a, b, /<p class="d-desc">/g)))   add(ar.id + '.desc', e.index, 'p');

    const fOpen = firstOpen(html, a, b, /<div class="ficha">/g);
    if (fOpen) {
      const fi = elementInner(html, fOpen.index, 'div');
      const fa = fi.innerStart, fb = fi.innerEnd;
      let normal = 0, wide = 0;
      const reRow = /<div class="frow( wide)?">/g; reRow.lastIndex = fa;
      let rm;
      while ((rm = reRow.exec(html)) && rm.index < fb) {
        const row = elementInner(html, rm.index, 'div');
        const isWide = !!rm[1];
        const prefix = isWide ? (ar.id + '.ficha_wide.' + (wide++)) : (ar.id + '.ficha.' + (normal++));
        let k2;
        if ((k2 = firstOpen(html, row.innerStart, row.innerEnd, /<span class="k">/g))) add(prefix + '.k', k2.index, 'span');
        if ((k2 = firstOpen(html, row.innerStart, row.innerEnd, /<span class="v">/g))) add(prefix + '.v', k2.index, 'span');
        reRow.lastIndex = row.outerEnd;
      }
    }
  }

  // ---- FOOTER ----
  const footOpen = html.indexOf('<footer');
  if (footOpen >= 0) {
    const ft = elementInner(html, footOpen, 'footer');
    const a = ft.innerStart, b = ft.innerEnd;
    let e;
    if ((e = firstOpen(html, a, b, /<div class="big">/g))) add('footer.big', e.index, 'div');
    let pn = 0;
    const reP = /<p(?:\s[^>]*)?>/g; reP.lastIndex = a;
    let m;
    while ((m = reP.exec(html)) && m.index < b) { add('footer.p.' + (pn++), m.index, 'p'); }
  }

  return { edits, order };
}

/* ============================================================
   3. wm-viz.html — mapa literal → chave (namespace wm_viz.*)
   ============================================================ */

function wmVizLiterals() {
  // ordem importa na substituição: literais mais longos primeiro
  return [
    ['wm_viz.mode_stacking',     'Stacking <span class="tag">(empilhado)</span>'],
    ['wm_viz.mode_i3',           'i3 / Sway <span class="tag">(tiling)</span>'],
    ['wm_viz.mode_hypr',         'Hyprland <span class="tag">(tiling + gaps)</span>'],
    ['wm_viz.mode_niri',         'Niri <span class="tag">(scrollable)</span>'],
    ['wm_viz.stacking_name',     'Stacking / Floating'],
    ['wm_viz.stacking_html',     'Janelas <b>flutuam e se sobrepõem livremente</b>, como no Windows e no macOS. Abrir uma nova não mexe nas outras, ela só aparece por cima. É o comportamento padrão de qualquer Desktop Environment (GNOME, KDE, Cinnamon).'],
    ['wm_viz.i3_name',           'i3 / Sway — tiling manual'],
    ['wm_viz.i3_html',           'As janelas <b>se dividem para preencher a tela inteira</b>, sem sobreposição e sem desperdício de espaço. Cada janela nova reparte o espaço da janela em foco. Tudo é controlado por teclado. Visual seco e funcional: sem espaçamentos, sem cantos arredondados.'],
    ['wm_viz.i3_twin',           '// Sway = o mesmo i3, só que em Wayland'],
    ['wm_viz.hypr_name',         'Hyprland — tiling dinâmico'],
    ['wm_viz.hypr_html',         '<b>Mesma lógica de divisão do i3</b>, mas com a assinatura visual do Hyprland: espaçamentos (gaps) entre as janelas, cantos arredondados, e brilho/sombra na janela em foco. Mesma produtividade do tiling, com a estética que domina o r/unixporn.'],
    ['wm_viz.hypr_twin',         '// repare: a arrumação é igual à do i3, o que muda é o acabamento'],
    ['wm_viz.niri_name',         'Niri — scrollable tiling'],
    ['wm_viz.niri_html',         'Paradigma diferente: as janelas viram <b>colunas numa fita horizontal infinita</b>. Abrir uma janela nova <b>nunca redimensiona as outras</b>, ela só entra como mais uma coluna à direita, e a tela rola até ela. Ótimo pra fluxo sequencial e telas ultrawide.'],
    ['wm_viz.niri_twin',         '// note como as janelas antigas mantêm o tamanho ao abrir novas'],
    ['wm_viz.btn_add',           '+ abrir janela'],
    ['wm_viz.btn_remove',        '− fechar janela'],
    ['wm_viz.btn_reset',         'reset'],
    ['wm_viz.counter_plural',    ' janelas'],
    ['wm_viz.counter_singular',  ' janela'],
    ['wm_viz.scroll_hint',       '← rolável →'],
  ];
}

/* ============================================================
   4. quiz-strings.json — flatten dos campos traduzíveis (quiz.*)
   ============================================================ */

function flattenQuiz(qs) {
  const out = {};
  if (qs.ui) for (const k of Object.keys(qs.ui)) out['quiz.ui.' + k] = qs.ui[k];
  if (qs.distros) for (const id of Object.keys(qs.distros)) {
    const d = qs.distros[id];
    out['quiz.distros.' + id + '.name'] = d.name;
    out['quiz.distros.' + id + '.why'] = d.why;
    (d.tags || []).forEach((t, i) => { out['quiz.distros.' + id + '.tags.' + i] = t; });
  }
  if (qs.questions) qs.questions.forEach((q, i) => {
    out['quiz.questions.' + i + '.q'] = q.q;
    (q.opts || []).forEach((o, j) => {
      out['quiz.questions.' + i + '.opts.' + j + '.t'] = o.t;
      out['quiz.questions.' + i + '.opts.' + j + '.d'] = o.d;
    });
  });
  return out;
}

function setPath(obj, dotted, value) {
  const parts = dotted.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!(p in cur) || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

// reconstrói quiz-strings.json EN: clona PT e sobrescreve com quiz.* de en.json
function mergeQuiz(ptQuiz, translations) {
  const merged = JSON.parse(JSON.stringify(ptQuiz));
  for (const key of Object.keys(translations)) {
    if (!key.startsWith('quiz.')) continue;
    const rest = key.slice('quiz.'.length); // ex.: distros.mint.why
    setPath(merged, rest, translations[key]);
  }
  return merged;
}

/* ============================================================
   5. Aplicação de traduções no index.html (geração)
   ============================================================ */

function applyEdits(html, edits, translations, missing, keySet) {
  const sorted = edits.slice().sort((x, y) => y.innerStart - x.innerStart);
  let out = html;
  for (const e of sorted) {
    keySet.add(e.key);
    const t = translations[e.key];
    if (t === undefined || t === null || t === '') {
      missing.push({ key: e.key, value: html.slice(e.innerStart, e.innerEnd) });
      continue; // fallback: mantém PT
    }
    out = out.slice(0, e.innerStart) + t + out.slice(e.innerEnd);
  }
  return out;
}

function langSwitch(activeLang) {
  const pt = '<a href="/atlas-linux/"' + (activeLang === 'pt' ? ' class="active"' : '') + '>PT</a>';
  const en = '<a href="/atlas-linux/en/"' + (activeLang === 'en' ? ' class="active"' : '') + '>EN</a>';
  return '<div class="lang-switch">' + pt + en + '</div>';
}

function injectLangSwitch(html, activeLang) {
  const open = html.indexOf('<div class="topbar">');
  if (open < 0) return html;
  const tb = elementInner(html, open, 'div');
  // insere antes do fechamento da topbar
  return html.slice(0, tb.innerEnd) + '\n  ' + langSwitch(activeLang) + html.slice(tb.innerEnd);
}

function hreflangBlock() {
  return [
    '<link rel="alternate" hreflang="pt-BR" href="' + SITE + '">',
    '<link rel="alternate" hreflang="en" href="' + SITE + 'en/">',
    '<link rel="alternate" hreflang="x-default" href="' + SITE + '">',
  ].join('\n');
}

function injectHreflang(html) {
  if (html.includes('hreflang="pt-BR"')) return html; // idempotente
  return html.replace('</head>', hreflangBlock() + '\n</head>');
}

/* ============================================================
   6. Geração de um idioma
   ============================================================ */

function generateLang(lang, translations, srcIndex, srcWm, ptQuiz, report) {
  const meta = translations._meta || {};
  const dir = P(lang);
  const missing = [];
  const keySet = new Set();

  // ---- index.html ----
  const { edits } = collectIndexEdits(srcIndex);
  let out = applyEdits(srcIndex, edits, translations, missing, keySet);

  // <html lang>
  if (meta.html_lang) out = out.replace(/<html lang="[^"]*">/, '<html lang="' + meta.html_lang + '">');
  // <title>
  if (meta.title) out = out.replace(/<title>[\s\S]*?<\/title>/, '<title>' + meta.title + '</title>');
  // meta description
  if (meta.description) {
    if (/<meta name="description"/.test(out)) out = out.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + meta.description + '">');
    else out = out.replace('</title>', '</title>\n<meta name="description" content="' + meta.description + '">');
  }
  // paths de assets: css → ../css; nav/collapse → ../js; quiz.js fica relativo (en/js/quiz.js)
  out = out.replace(/href="css\//g, 'href="../css/');
  out = out.replace(/src="js\/nav\.js"/g, 'src="../js/nav.js"');
  out = out.replace(/src="js\/collapse\.js"/g, 'src="../js/collapse.js"');
  // (src="js/quiz.js" permanece → resolve para en/js/quiz.js)
  // hreflang + seletor de idioma
  out = injectHreflang(out);
  out = injectLangSwitch(out, lang === 'pt' ? 'pt' : 'en');

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), out);

  // ---- wm-viz.html ----
  let wm = srcWm;
  for (const [key, lit] of wmVizLiterals()) {
    keySet.add(key);
    const t = translations[key];
    if (t === undefined || t === null || t === '') { missing.push({ key, value: lit }); continue; }
    wm = wm.split(lit).join(t);
  }
  if (meta.html_lang) wm = wm.replace(/<html lang="[^"]*">/, '<html lang="' + meta.html_lang + '">');
  fs.writeFileSync(path.join(dir, 'wm-viz.html'), wm);

  // ---- js/quiz-strings.json (merge) + cópia do quiz.js ----
  const jsDir = path.join(dir, 'js');
  fs.mkdirSync(jsDir, { recursive: true });
  const mergedQuiz = mergeQuiz(ptQuiz, translations);
  // contabiliza cobertura das chaves quiz.*
  for (const k of Object.keys(flattenQuiz(ptQuiz))) {
    keySet.add(k);
    if (translations[k] === undefined || translations[k] === '') missing.push({ key: k, value: flattenQuiz(ptQuiz)[k] });
  }
  fs.writeFileSync(path.join(jsDir, 'quiz-strings.json'), JSON.stringify(mergedQuiz, null, 2) + '\n');
  fs.copyFileSync(P('js', 'quiz.js'), path.join(jsDir, 'quiz.js'));

  // ---- PT in-place: hreflang + seletor ----
  let ptHtml = injectHreflang(srcIndex);
  ptHtml = injectLangSwitch(ptHtml, 'pt');
  fs.writeFileSync(P('index.html'), ptHtml);

  report.push({ lang, total: keySet.size, missing });
}

/* ============================================================
   7. Modo --extract
   ============================================================ */

function runExtract(srcIndex, srcWm, ptQuiz) {
  const { edits, order } = collectIndexEdits(srcIndex);
  const map = {};
  for (const e of edits) map[e.key] = srcIndex.slice(e.innerStart, e.innerEnd);

  const tpl = {};
  // _meta com placeholders (title/description em PT como referência)
  const titleM = /<title>([\s\S]*?)<\/title>/.exec(srcIndex);
  const descM = /<meta name="description" content="([^"]*)"/.exec(srcIndex);
  tpl._meta = {
    lang: '', label: '', html_lang: '',
    title: titleM ? titleM[1] : '',
    description: descM ? descM[1] : '',
  };
  for (const k of order) tpl[k] = map[k];
  for (const [k, v] of wmVizLiterals()) tpl[k] = v;
  Object.assign(tpl, flattenQuiz(ptQuiz));

  fs.mkdirSync(P('i18n'), { recursive: true });
  fs.writeFileSync(P('i18n', '_template.json'), JSON.stringify(tpl, null, 2) + '\n');

  const count = Object.keys(tpl).filter(k => k !== '_meta').length;
  console.log('✓ i18n/_template.json gerado com ' + count + ' chaves (+ _meta).');
}

/* ============================================================
   8. Modo geração + relatório
   ============================================================ */

function runGenerate(srcIndex, srcWm, ptQuiz) {
  const i18nDir = P('i18n');
  let files = [];
  if (fs.existsSync(i18nDir)) {
    files = fs.readdirSync(i18nDir).filter(f => f.endsWith('.json') && f !== '_template.json');
  }
  if (files.length === 0) {
    console.log('Nenhum idioma em i18n/ (esperado: i18n/en.json). Nada gerado.');
    console.log('Dica: rode "node scripts/build-i18n.js --extract" para criar o template de tradução.');
    return;
  }

  const report = [];
  for (const f of files) {
    const lang = path.basename(f, '.json');
    const translations = JSON.parse(fs.readFileSync(path.join(i18nDir, f), 'utf8'));
    generateLang(lang, translations, srcIndex, srcWm, ptQuiz, report);
  }

  // relatório de cobertura
  console.log('\n═══ Atlas i18n — Coverage Report ═══\n');
  for (const r of report) {
    const total = r.total;
    const miss = r.missing.length;
    const covered = total - miss;
    const pct = total ? (covered / total * 100).toFixed(1) : '0.0';
    console.log('  Language: ' + r.lang);
    console.log('  Coverage: ' + covered + '/' + total + ' keys (' + pct + '%)\n');
    if (miss) {
      console.log('  Missing keys:');
      for (const m of r.missing.slice(0, 60)) {
        const preview = plain(m.value).slice(0, 48);
        console.log('    ' + m.key.padEnd(34) + ' "' + preview + (preview.length >= 48 ? '…' : '') + '"');
      }
      if (miss > 60) console.log('    … (+' + (miss - 60) + ' mais)');
      console.log('\n  ⚠ ' + miss + ' keys fell back to PT-BR content.\n');
    } else {
      console.log('  ✓ Cobertura total.\n');
    }
  }
}

/* ============================================================
   main
   ============================================================ */

function main() {
  const srcIndex = fs.readFileSync(P('index.html'), 'utf8');
  const srcWm = fs.readFileSync(P('wm-viz.html'), 'utf8');
  const ptQuiz = JSON.parse(fs.readFileSync(P('js', 'quiz-strings.json'), 'utf8'));

  if (process.argv.includes('--extract')) runExtract(srcIndex, srcWm, ptQuiz);
  else runGenerate(srcIndex, srcWm, ptQuiz);
}

main();
