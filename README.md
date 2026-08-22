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
├── index.html
├── wm-viz.html
├── css/
│   ├── base.css
│   └── interactive.css
├── js/
│   ├── nav.js
│   ├── collapse.js
│   ├── quiz.js
    ├── quiz-strings.js
    └── wm-viz.js
├── i18n/
    └── _template.json
├── scripts/
│   └── build-i18n.js
├── mapa-linux.md
├── LICENSE
├── LICENSE-CONTENT
├── CREDITOS.md
├── README.md
└── .nojekyll
```

O **design system** vive intacto em `css/base.css`; toda a camada interativa foi
adicionada por cima, sem alterar os tokens ou os componentes existentes.

---

## Autoria e licenciamento

O **Atlas Linux** é um projeto pessoal e independente, criado e mantido por
**kauesaula**, iniciado em **junho de 2026**.

Todo o código e todo o conteúdo foram concebidos e escritos exclusivamente
pelo autor, em equipamento próprio e em tempo próprio. O projeto não possui
vínculo, patrocínio, afiliação ou relação de qualquer natureza com nenhum
empregador, cliente ou organização, presente ou futura, e não incorpora
recursos, informações ou materiais de terceiros além das tipografias
listadas em [CREDITOS.md](CREDITOS.md).

O histórico completo de autoria está registrado nos commits deste
repositório.

### Licença dupla

O projeto reúne duas naturezas distintas e cada uma tem a sua licença.

| Camada | O que inclui | Licença |
|---|---|---|
| **Código** | Marcação HTML, CSS e design system, JavaScript, scripts de build (Node.js) e de validação (Python), arquivos de configuração | [MIT](LICENSE) |
| **Conteúdo** | Perfis de distribuições, textos do guia, enunciados e resultados do quiz, arquivos Markdown de conteúdo, valores de tradução em `i18n/*.json`, curadoria e organização editorial | [CC BY 4.0](LICENSE-CONTENT) |

**Regra de fronteira.** Vários arquivos misturam as duas camadas. Nesses
casos vale o critério do continente e do conteúdo: a estrutura que envolve
o texto (tags, atributos, classes, estilos, scripts) é código sob MIT; o
texto em linguagem natural que ela envolve é conteúdo sob CC BY 4.0. Nos
arquivos de tradução, as chaves são código e os valores são conteúdo.

Identificador SPDX do projeto: `MIT AND CC-BY-4.0`

### O que você pode fazer

Usar, estudar, modificar, redistribuir e adaptar, inclusive para fins
comerciais, nas duas camadas.

A única condição é a **atribuição**. Em qualquer redistribuição ou
adaptação, mantenha o aviso de copyright e o texto da licença MIT nas
porções de código, e credite a autoria original nas porções de conteúdo,
com link para a licença e indicação de que houve modificação.

Modelo de atribuição para o conteúdo:

> "Atlas Linux" por kauesaula, licenciado sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
> Fonte: https://github.com/kauesaula/atlas-linux — material modificado.

### Direitos morais

Nos termos do art. 27 da Lei nº 9.610/98, os direitos morais de autor são
inalienáveis e irrenunciáveis. As licenças acima concedem direitos
patrimoniais de uso; nada nelas implica renúncia ao direito de
reivindicação de autoria.

---

### 🤝 Contribuições
O ecossistema Linux se move rápido, então correções, novas distros e traduções são bem-vindas via issue ou pull request.

Ao enviar um pull request, você concorda em licenciar sua contribuição sob
os mesmos termos: MIT para código e CC BY 4.0 para conteúdo.


Código sob [MIT](./LICENSE) · Conteúdo sob [CC BY 4.0](./LICENSE-CONTENT) · © 2026 kauesaula
