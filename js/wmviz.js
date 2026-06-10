(function () {
  'use strict';

  const viz = document.getElementById('wm-viz');
  if (!viz) return;

  const APPS = [
    {n:'Terminal',  c:'#92e3a0'},
    {n:'Navegador', c:'#8ab4f8'},
    {n:'Editor',    c:'#c6a8f6'},
    {n:'Arquivos',  c:'#f2b35c'},
    {n:'Música',    c:'#f291bb'},
    {n:'Notas',     c:'#6dd3da'},
    {n:'Chat',      c:'#f08b8b'},
  ];

  const COPY = {
    stacking: {
      name:'Stacking / Floating',
      html:'Janelas <b>flutuam e se sobrepõem livremente</b>, como no Windows e no macOS. Abrir uma nova não mexe nas outras. É o comportamento padrão de qualquer Desktop Environment (GNOME, KDE, Cinnamon).',
      twin:''
    },
    i3: {
      name:'i3 / Sway — tiling manual',
      html:'As janelas <b>se dividem para preencher a tela inteira</b>, sem sobreposição e sem desperdício de espaço. Cada janela nova reparte o espaço da janela em foco. Tudo controlado por teclado. Visual seco e funcional.',
      twin:'// Sway = o mesmo i3, só que em Wayland'
    },
    hypr: {
      name:'Hyprland — tiling dinâmico',
      html:'<b>Mesma lógica de divisão do i3</b>, mas com a assinatura visual do Hyprland: espaçamentos (gaps) entre janelas, cantos arredondados, e brilho na janela em foco. Mesma produtividade do tiling, com a estética que domina o r/unixporn.',
      twin:'// repare: a arrumação é igual à do i3, o que muda é o acabamento'
    },
    niri: {
      name:'Niri — scrollable tiling',
      html:'Paradigma diferente: as janelas viram <b>colunas numa fita horizontal infinita</b>. Abrir uma janela nova <b>nunca redimensiona as outras</b>, ela só entra como mais uma coluna à direita. Ótimo pra fluxo sequencial e telas ultrawide.',
      twin:'// note como as janelas antigas mantêm o tamanho ao abrir novas'
    }
  };

  let mode = 'stacking';
  let wins = [];
  let nextId = 0;

  const stage   = viz.querySelector('.wmv-stage');
  const layer   = viz.querySelector('.wmv-layer');
  const monitor = viz.querySelector('.wmv-monitor');
  const explain = viz.querySelector('.wmv-explain');
  const countEl = viz.querySelector('.wmv-count');
  const modeLbl = viz.querySelector('.wmv-mode-label');

  function dwindle(n) {
    const rects = []; let x=0,y=0,w=100,h=100;
    for (let i=0; i<n; i++) {
      if (i===n-1) { rects.push({x,y,w,h}); break; }
      if (i%2===0) { const half=w/2; rects.push({x,y,w:half,h}); x+=half; w-=half; }
      else         { const half=h/2; rects.push({x,y,w,h:half}); y+=half; h-=half; }
    }
    return rects;
  }

  function render() {
    if (!stage || !layer || !monitor || !explain || !countEl || !modeLbl) return;
    countEl.textContent = wins.length + (wins.length===1 ? ' janela' : ' janelas');
    stage.className = 'wmv-stage wmv-' + mode;
    modeLbl.textContent = mode==='i3' ? 'i3 / sway' : mode==='hypr' ? 'hyprland' : mode;
    monitor.classList.remove('wmv-overflow');

    const oldHint = stage.querySelector('.wmv-scrollhint');
    if (oldHint) oldHint.remove();

    while (layer.children.length < wins.length) {
      const el = document.createElement('div');
      el.className = 'wmv-win';
      el.innerHTML = '<div class="wmv-bar"><i></i><i></i><i></i><span class="wmv-label"></span></div><div class="wmv-body"></div>';
      layer.appendChild(el);
    }
    while (layer.children.length > wins.length) layer.removeChild(layer.lastChild);

    const stageW = stage.clientWidth || 600;
    let rects = [];
    if (mode==='i3' || mode==='hypr') rects = dwindle(wins.length);

    const colW = Math.min(260, stageW*0.5);
    const gap  = mode==='hypr' ? 2.4 : 0;
    const stripW = wins.length * colW;
    const overflow = stripW > stageW;
    if (mode==='niri') {
      layer.style.width = stripW + 'px';
      layer.style.transform = overflow ? 'translateX(' + (stageW-stripW) + 'px)' : 'translateX(0)';
      if (overflow) monitor.classList.add('wmv-overflow');
    } else {
      layer.style.width = '';
      layer.style.transform = 'translateX(0)';
    }

    [...layer.children].forEach((el, i) => {
      const app = APPS[wins[i] % APPS.length];
      el.style.setProperty('--wc', app.c);
      el.querySelector('.wmv-label').textContent = app.n;
      el.classList.toggle('wmv-focus', i===wins.length-1);

      if (mode==='stacking') {
        const off = i*6;
        el.style.left = (8+off)+'%'; el.style.top = (8+off*1.1)+'%';
        el.style.width = '56%';      el.style.height = '58%';
        el.style.zIndex = 10+i;
      } else if (mode==='niri') {
        el.style.zIndex = 10;
        el.style.left   = (i*colW+6)+'px'; el.style.top = '3%';
        el.style.width  = (colW-12)+'px';  el.style.height = '94%';
      } else {
        const r = rects[i] || {x:0,y:0,w:100,h:100};
        el.style.zIndex  = 10;
        el.style.left    = (r.x+gap)+'%'; el.style.top    = (r.y+gap)+'%';
        el.style.width   = (r.w-gap*2)+'%'; el.style.height = (r.h-gap*2)+'%';
      }
    });

    if (mode==='niri') {
      const hint = document.createElement('div');
      hint.className = 'wmv-scrollhint';
      hint.textContent = '← rolável →';
      stage.appendChild(hint);
    }

    const c = COPY[mode];
    explain.innerHTML = '<span class="wmv-ename">' + c.name + '</span>' + c.html +
      (c.twin ? '<span class="wmv-etwin">' + c.twin + '</span>' : '');
  }

  viz.querySelector('[data-add]').addEventListener('click', () => {
    wins.push(nextId++);
    if (wins.length > 7) wins.shift();
    render();
  });
  viz.querySelector('[data-remove]').addEventListener('click', () => { wins.pop(); render(); });
  viz.querySelector('[data-reset]').addEventListener('click', () => { wins=[]; nextId=0; render(); });

  viz.querySelectorAll('.wmv-mode').forEach(b => {
    b.addEventListener('click', () => {
      viz.querySelectorAll('.wmv-mode').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      mode = b.dataset.mode;
      render();
    });
  });

  window.addEventListener('resize', render);

  wins = [0,1,2]; nextId = 3; render();
})();
