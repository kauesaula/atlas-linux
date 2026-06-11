# 🐧 Atlas Linux

> Um guia de campo honesto do ecossistema Linux, organizado por **famílias**, das bases milenares aos compositores Wayland mais geniais do 'r/unixporn'.

Site estático, sem build e sem dependências. Abra o `index.html` ou acesse a versão publicada:

**🔗 [kauesaula.github.io/atlas-linux](https://kauesaula.github.io/atlas-linux/)**

---

## ✨ O que tem aqui

- **+20 distros** com ficha completa (público-alvo, casos de uso, dificuldade, sinergias).
- **6 window managers** + a nova geração de **shells Quickshell**.
- **7 conceitos-base** explicados sem dor (kernel, init, shell, package manager, DE, WM, dotfiles).
- Cores = **famílias** (Debian, Arch, Fedora/RHEL, SUSE, independentes, segurança, além do Linux).

### Recursos interativos

| Recurso | O que faz |
|---|---|
| 🏷️ **Filtro por família** | Chips coloridos isolam uma linhagem de cada vez. |
| 🔽 **Cards colapsáveis** | Recolha/expanda a ficha técnica de cada distro (e "recolher tudo"). |
| 🧭 **Quiz de decisão** | 5 perguntas → recomenda a distro ideal + uma reserva, com link pra ficha. |
| 📌 **Scroll-spy & reveal** | Índice lateral acompanha a leitura; seções aparecem ao rolar. |

---

## 🗂️ Estrutura do projeto

```
atlas-linux/
├── index.html              # markup (conteúdo do guia)
├── css/
│   ├── base.css            # design system original — tokens, layout, componentes
│   └── interactive.css     # estilos novos: toolbar, filtros, colapso, quiz
├── js/
│   ├── nav.js              # scroll-spy + reveal das seções
│   ├── collapse.js         # cards colapsáveis (ficha técnica)
│   ├── explorer.js         # filtro por família + busca
│   └── quiz.js             # quiz de decisão
├── o-grande-mapa-do-linux.md   # documento-fonte (versão longa em Markdown)
├── .github/workflows/pages.yml # deploy automático no GitHub Pages
├── .nojekyll               # serve arquivos como estão (sem processamento Jekyll)
├── LICENSE
└── README.md
```

O **design system** vive intacto em `css/base.css`; toda a camada interativa foi
adicionada por cima, sem alterar os tokens ou os componentes existentes.

---

## 🤝 Contribuindo

O ecossistema Linux se move rápido, então correções, novas distros e traduções são bem-vindas via issue ou pull request.

## 📄 Licença

[MIT](./LICENSE) © 2026 kauesaula.
