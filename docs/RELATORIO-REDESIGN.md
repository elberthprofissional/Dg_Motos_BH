# Relatório de redesign — DG Motos BH

Data: 21/10/2026
Escopo: remake visual profundo da vitrine e alinhamento do painel do dono.
Nenhum dado comercial foi inventado; nenhuma seção nova de conteúdo foi criada.

---

## 1. Método

1. Auditar o código antes de tocar em qualquer arquivo (componentes, tokens,
   páginas, hooks e docs).
2. Remake da identidade visual — e só dela — preservando toda a lógica
   existente (rotas, catálogo, Supabase, painel, SEO).
3. Testar: `lint` → `typecheck` → `test` (73 testes) → `build` + prerender.
4. Auditar o DOM renderizado no Chrome via CDP (CDP sobre `npm run preview`),
   medindo overflow, contraste, alvos de toque, ids duplicados, saltos de
   título, imagens quebradas e erros de console — em 1440 px e 390 px.
5. Testar as interações que só existem depois do clique (menu do celular,
   filtros recolhidos, barra fixa de preço, teclado, botões flutuantes).

A auditoria dos passos 4 e 5 está versionada em
`scripts/auditar-navegador.mjs` (`npm run auditar`): ela precisa de um Chrome
com `--remote-debugging-port=9222` e do `npm run preview` no ar, e sai com
código de erro 1 se algo furar.

---

## 2. O sistema "BANCADA"

O site deixou de ser uma vitrine com cartões decorados e virou **documentação
técnica de oficina**: molduras de registro nos cantos, quadros de dados com
filete de 1 px, cantos retos, tipografia de placa e **um vermelho só** — o sinal.

### 2.1 Cor

| Token | Valor | Uso |
|---|---|---|
| `--cor-fundo` | `#0a0a0b` | fundo da vitrine |
| `--cor-painel` / `-2` / `-3` | `#111114` / `#19191d` / `#202026` | chapas de dado |
| `--cor-texto` / `-2` / `-3` | `#ffffff` / `#b6b6c0` / `#8a8a94` | texto |
| `--cor-marca` | `#e01b22` | sinal: preço, ação primária, canto de registro |
| `--cor-marca-texto` | `#ff4740` | vermelho sobre preto (contraste AA) |
| `--cor-foco` | `#ff5b52` | foco de teclado |
| `--cor-whatsapp` | `#25d366` | **exceção única**: o retângulo do CTA de WhatsApp |

Regra de uso do vermelho (aplicada em toda a vitrine): **texto vermelho só
onde é preço, ação principal ou marca de moto em destaque**. Nome de seção é
`.rotulo` — cinza com um quadrado vermelho ao lado. Etiqueta de dado é
`.etiqueta` — cinza, sem cor.

O painel do dono (`[data-tema='painel']`) é a mesma bancada com a luz de
serviço acesa: fundo `#08080a`, texto `#ffffff`/`#b2b2bd`/`#8a8a94`, mesmo
vermelho. Herda também o **canto reto** por regra global, sem reescrever
componente por componente.

### 2.2 Tipografia

- Display: **IBM Plex Sans Condensed** — a mesma superfamília do texto, mais
  estreita. Título de oficina: tem a cara de placa estampada sem precisar
  gritar em caixa alta.
- Texto/UI: **IBM Plex Sans** (números em `tabular-nums`).
- Caixa alta só onde é **estêncil de máquina**: `.etiqueta` (rótulo de dado),
  as placas sobre a foto (categoria, contador), a categoria na ficha, o
  endereço sob a marca e as colunas do rodapé. Título, botão, navegação e
  rótulo de campo são **caixa de sentença**.
- Escala de texto nomeada: `--text-micro` (10 px, selo de placa) e
  `--text-etiqueta` (11 px, rótulo de dado) entram no `@theme`; o resto usa
  os degraus do Tailwind (`text-xs` a `text-6xl`). Nenhum tamanho solto em
  px no código.

### 2.3 Componentes de base (`src/index.css`)

`.btn` (+ `btn-primary` / `btn-secondary` / `btn-danger` / `btn-sm`),
`.badge`, `.link-acao`, `.etiqueta`, `.rotulo`, `.selo`, `.quadro`,
`.quadro-celula`, `.moldura`, `.preco`, `.corpo`, `.display`, `.display-2`,
`.input`, `.select`, `.field-label`, `.surface`, `.pular-para-conteudo`,
`.menu-mobile` (dialog do menu do celular), `.dialogo` (dialog de confirmação),
`.btn-icone`, `.foco-painel`, `.nav-item`, `.item-linha`.

---

## 3. O que foi alterado

### 3.1 Vitrine

- **`Header.tsx`** — reescrito: faixa de dados (motos no estoque), barra
  principal, fio vermelho de 2 px, menu do celular em `<dialog>` nativo com
  `showModal()`, travamento da rolagem do fundo, foco preso e devolução do
  foco ao botão que abriu.
- **`RootLayout.tsx`** — skip link (`Pular para o conteúdo`), `main#conteudo`
  com alvo de foco, `CatalogoProvider` que respeita catálogo vazio do banco
  e só recorre ao seed quando a consulta falha.
- **`Home.tsx`** — hero limpo: só a foto do showroom sangrando na largura
  toda, com os cantos de registro e o fio vermelho no rodapé (o texto, os
  botões e o quadro de leitura saíram da fachada; sobrou o `h1` invisível
  para o leitor de tela e para o SEO), e a vitrine: grade de até 3 fichas em
  destaque, com o link para o estoque completo.
- **`Estoque.tsx`** — cabeçalho + quadro "Resultado", `MarcaGrid` em placas
  quadradas, filtros em `<details>` no celular e coluna fixa no desktop,
  grade de `BikeCard` 4:5, estado vazio com ações.
- **`BikeDetail.tsx`** — trilha, galeria com moldura, quadro de dados
  (ano / km / cc), checklist da loja, descrição e ficha técnica, barra de
  ação fixa no celular com preço e contato (`pb-28` no fim da página para a
  barra não cobrir texto).
- **`Contato.tsx`** — canais de atendimento, bloco de troca, painel de
  showroom com horários, mapa e rota.
- **`Footer.tsx`** — filete vermelho no topo, marca e slogan, colunas
  Navegar / Showroom / Atendimento, créditos com acesso restrito.
- **Foto do hero** — `img/hero-showroom-2026-03.jfif` (1024 × 434) vira duas
  saídas WebP em `public/hero/`: `showroom-2026-03.webp` (1024 × 434, 15 KB,
  tamanho natural) e `showroom-2026-03-hd.webp` (1920 × 814, 26 KB,
  reampliada com lanczos3) — a segunda é a que a home carrega, porque o hero
  entra de ponta a ponta da tela. As duas versões antigas
  (`showroom-2026-02.webp` e `showroom.webp`) foram apagadas de
  `public/hero/`. A referência da versão HD está no preload de `index.html`
  (é a imagem de LCP), no `og:image`, no JSON-LD (`src/lib/schema.ts`), no
  fallback do prerender e em `Home.tsx`; o `scripts/convert-images.mjs`
  continua reproduzindo as duas saídas.
- **`BotoesFlutuantes.tsx`** (novo) — contato vermelho sempre à mão e volta ao
  topo; na ficha da moto o contato flutuante some (a barra fixa já tem o
  CTA) e a seta sobe acima da barra, com a altura da barra medida em tempo
  real (`ResizeObserver` sobre `[data-barra-fixa]`), nunca chutada. Chapa
  reta: o contato é o sinal vermelho, a seta é placa de painel.
- **`IconeWhatsapp.tsx`** (novo) — glifo oficial do WhatsApp (SVG inline do
  Simple Icons). O botão de WhatsApp da ficha é o **retângulo verde** pedido
  pelo dono: precisa ser reconhecido de longe como "chama no zap". É a
  única cor fora da paleta, e o texto sobre ele é quase preto (10,6:1 de
  contraste) — branco sobre este verde daria 1,98:1 e reprovaria na WCAG.
  Chapa reta, como o resto da casa.

### 3.2 Componentes compartilhados

`Button`, `Badge`, `SectionHeading` (com ação opcional), `EstadoVazio`,
`DialogoConfirmacao` (dialog nativo, foco no cancelar), `Toast` (live region
persistente: `role="status"` para sucesso e `role="alert"` para erro),
`CampoBusca`, `MapaLoja`, `SenhaInput`, `SmartImage`, `WhatsAppCTA`.

### 3.3 Filtros

- `BikeFilters` ganhou `prefix` de `id`: a página desenha os filtros duas
  vezes (topo do celular + coluna do desktop) e, sem prefixo, os `id` se
  repetiam — o `label` do desktop acabava focando o campo invisível do
  celular.
- Chips de categoria com `aria-pressed`, altura mínima de 44 px; slider de
  preço/ano com polegar de 24 px.

### 3.4 Painel do dono

- Tokens do painel realinhados (microtexto `steel-500`/`steel-600`
  recalibrados para passar de 4,5:1).
- Canto reto herdado por regra global.
- Telas de acesso com `h1` ("Acesso restrito", "Recuperar acesso", "Criar
  senha nova") e alvos de toque ≥ 24 px.

### 3.5 Copy

Continua valendo a regra do briefing: **nada de origem, garantia ou
procedência sem comprovação**. Onde havia claim, há descrição factual.
Nenhum telefone, número de WhatsApp, endereço ou handle foi inventado.

### 3.6 Passagem "sem cara de IA" (medida, não por opinião)

O pedido foi tirar a cara de página gerada. Em vez de opinar, a interface
foi **medida no DOM renderizado** (Chrome via CDP, 1440 px e 390 px, 4 rotas
públicas) antes e depois. O que a medição acusou, e o que foi feito:

| Tell medido | Antes | Depois | O que mudou |
|---|---|---|---|
| Tamanhos de fonte distintos na home | 11 (incl. 10/13/17/24/30/36/48 px soltos) | 9, todos em degrau nomeado | `--text-micro`, `--text-etiqueta` + degraus do Tailwind; zero `text-[Npx]` no código público |
| Strings em caixa alta na home | ~25 | 13, e todas são estêncil de máquina | `text-transform: uppercase` saiu de `.display`, `.display-2`, `.h-display`, `.btn`, `.badge`, `.field-label`, `.rotulo` e do link de escape |
| Transição em elemento sem ação | `ARTICLE` e `IMG` com transição | só `A` e `BUTTON` | zoom da foto e fade de borda do card saíram; o card só muda a borda e o título no hover |
| Ponto médio como cola | "HONDA · TRAIL" | 0 na vitrine | marca e categoria viraram duas etiquetas com hierarquia própria |
| Rótulo repetindo o título | "O QUE ESTÁ NO ESTOQUE" + "EM DESTAQUE" | "Catálogo" + "Motos em destaque" | o eyebrow só aparece quando nomeia algo que o título não diz |
| Sombra difusa | 1 (só os botões flutuantes) | 1 | inalterado por decisão: sombra só onde o elemento flutua |
| Raio arredondado | 0 | 0 | inalterado |
| Animações de entrada | 0 | 0 | o hook de revelação por rolagem foi removido |

O resto do sistema continua igual: **preto, branco, um vermelho só, canto
reto**. A mudança foi de **hierarquia**, não de decoração: título em caixa de
sentença com a condensada, dado em estêncil, botão curto e sem tracking de
0,16 em, e ritmo de seção em dois degraus (`.section` e `.section-alta`).

Conferência de fonte: `document.fonts.check` confirma
`IBM Plex Sans Condensed` 600/700 e `IBM Plex Sans` 400/500/600/700
carregadas nas quatro rotas.

---

## 4. Verificação

- `lint`: ok (oxlint, sem avisos).
- `typecheck`: ok (tsc).
- `test`: 73/73.
- `build` + prerender: 3 fichas estáticas, sitemap com 6 URLs, robots
  bloqueia `/admin`.

**Auditoria no navegador (Chrome via CDP, `npm run preview`), 5 rotas × 2
larguras:**

| Verificação | Resultado |
|---|---|
| Rolagem horizontal | 0 px de transbordo em todas as rotas |
| Erros de console | 0 |
| Imagens quebradas | 0 |
| Contraste abaixo de 4,5:1 | 0 |
| Alvos de toque < 24 px | 0 |
| `id` duplicados no DOM | 0 |
| Saltos de nível de título | 0 |
| `alt` ausente em imagem de conteúdo | 0 |
| `label` sem `for` | 0 |

**Testes de interação (33 checagens, todas passando):**

- Menu do celular: abre em tela cheia, trava a rolagem do fundo, prende o
  foco, fecha com Esc e devolve o foco ao botão.
- Filtros: `<details>` abre, ids únicos, `label` do desktop aponta para o
  campo do desktop.
- Ficha da moto: barra fixa visível, com preço e CTA, e **nenhum texto
  escondido sob ela** (folga de 113 px).
- Teclado: skip link aparece ao receber foco, foco visível com contorno de
  2 px, `main#conteudo` com alvo de foco.
- Flutuantes: seta oculta e fora do Tab até a rolagem, volta ao topo, canto
  reto, vermelho da casa; na ficha some o contato e a seta sobe acima da
  barra fixa.

---

## 5. Limitação

Este modelo não lê imagens. A conferência foi feita sobre o DOM renderizado
(structura, ARIA, estados, contraste medido, transbordo medido) e sobre as
imagens do código-fonte. **Recomenda-se uma conferência visual humana** das
telas de destaque antes de publicar.

A foto nova do hero (`img/hero-showroom-2026-03.jfif`) tem **1024 × 434 px**:
em tela cheia ela é ampliada e fica suave. O site já serve uma versão
reampliada para 1920 px (`showroom-2026-03-hd.webp`), que evita a ampliação
brutal do navegador, mas não cria detalhe novo. Para o hero ocupando a tela
inteira, o ideal é uma exportação com 1920 px de largura ou mais.

---

## 6. Pendências do cliente (sem alteração nesta rodada)

- `WHATSAPP_NUMBER` continua nulo; todo CTA cai em `/contato` até o número
  real existir.
- Instagram, endereço e horários: ver `docs/PENDENCIAS-CLIENTE.md`.
