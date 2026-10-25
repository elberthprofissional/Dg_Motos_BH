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

Naquela rodada, a conferência foi feita sobre o DOM renderizado (estrutura,
ARIA, estados, contraste medido, transbordo medido) e sobre as imagens do
código-fonte; as capturas não foram abertas. Elas ficaram preservadas e
foram conferidas visualmente na rodada de 25/10 (seção 8).

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

---

## 7. Atualização — 22/10/2026

Rodada focada em três telas e na coerência do catálogo. A lógica de rotas,
Supabase, autenticação e catálogo não mudou.

### 7.1 `/admin/login` (desktop)

- A tela virou um split 50/50 no `lg`: foto do showroom em `object-cover` na
  metade esquerda, com gradientes que fundem a borda direita no formulário.
- O texto "Realizando Sonhos" fica no canto inferior esquerdo, precedido do
  badge vermelho "PAINEL DO DONO / ADMIN".
- O formulário flutua num cartão `rounded-3xl` com fundo translúcido,
  `backdrop-blur`, borda sutil, padding amplo e sombra. Os campos têm 48 px,
  ícones de e-mail/cadeado e foco vermelho; o botão tem 48 px, raio de 12 px
  e sombra vermelha.
- **Mobile preservado:** a foto, o cartão, os ícones e os raios só existem a
  partir de `lg`. No celular continuam a logo, os campos diretos e o botão,
  sem cartão.
- O `data-tema="painel"` foi removido só desta tela: a regra global do painel
  zera os raios (`border-radius: 0 !important`) e impediria o cartão pedido.

### 7.2 `/moto/<slug>`

- Ordem vertical: topo com galeria + nome/preço/badges/WhatsApp → ficha
  técnica e descrição → motos recomendadas no fim da página.
- A galeria principal usa `aspect-[4/3]`, `rounded-2xl`, `overflow-hidden` e
  miniaturas arredondadas abaixo.
- Nome, preço, status e badges (Ano, KM, Cilindrada) ficam no bloco direito;
  no celular o nome e o preço continuam abrindo a página.
- As especificações viraram cards `rounded-xl` com fundo `bg-painel/80`
  (2 colunas no celular, 4 no desktop). A descrição fica num card limpo
  abaixo da ficha.
- As recomendadas usam os cards novos do catálogo e fecham a página antes do
  rodapé.

### 7.3 Marcas mais procuradas

- A seção deixou o fundo claro e passou a usar `bg-fundo` com
  `border-t border-borda`.
- Título em `text-texto`; link em vermelho da casa.
- Logos em flexbox centralizada com `gap-8` e cores originais, sem filtro
  de inversão (`brightness-0 invert`).

### 7.4 Catálogo, estoque e acessibilidade

- `BikeCard`: foto 4:3, `rounded-2xl`, hover com elevação, badges de ano/km/
  combustível, preço vermelho e CTA "Tenho interesse".
- `/estoque`: filtros em rascunho com "Aplicar filtros"/"Limpar filtros",
  sidebar em cartão arredondado, chips de categoria e etiquetas removíveis.
- Links do rodapé e do breadcrumb do estoque ganharam altura mínima de 24 px,
  eliminando os alvos de toque pequenos da auditoria.
- A auditoria CDP foi atualizada para o fundo real do menu do celular
  (`rgb(8, 8, 8)`).

### 7.5 Verificação

- `lint`: ok. `typecheck`: ok. `test`: 79/79.
- `build` + prerender: 4 fichas, sitemap com 7 URLs, robots bloqueando
  `/admin`.
- Auditoria CDP (1440 px e 390 px): 0 transbordo horizontal, 0 contraste
  abaixo de 4,5:1, 0 imagem quebrada, 0 id duplicado, 0 salto de título.
- Medições de layout: cartão do login centralizado (448×568 px em 1440),
  raio de 24 px, campos de 48 px; galeria da ficha em 792×594 px (4:3);
  ficha técnica em 4 colunas no desktop e 2 no celular.
- **Limitação daquela rodada:** as capturas de tela não foram abertas; a
  validação foi feita por geometria e estilos computados no DOM. As
  capturas foram preservadas para conferência posterior.

### 7.6 Nota de documentação

O relatório das seções 1–6 descreve uma iteração anterior e cita IBM Plex e
"canto reto" como regra absoluta. Da rodada de 22/10 até aqui, o corpo do
site usa **Lato** e admite superfícies arredondadas no catálogo e no login
desktop; o painel administrativo continua com a regra de canto reto. Na
home desktop, a partir de 25/10, o título editorial usa **Archivo**
(ver seção 8). Os tokens de cor vigentes são os de `src/index.css`
(`--cor-fundo: #0f0e0c`, `--cor-painel: #161513`,
`--cor-marca: #d91f26`).

---

## 8. Atualização — 25/10/2026: redesign desktop da home

Rodada desktop-first. **O catálogo e o estoque não foram tocados**, por
instrução do cliente: nenhum preço, quilometragem, modelo, card ou filtro
mudou nesta rodada. Também não mudaram rotas, consultas ao Supabase, busca,
fluxo de troca, links de contato ou os ramos mobile dos componentes.

### 8.1 Direção e referências

A direção escolhida foi **pinned poster** (seed `1647049801`): um título fixo
segura o palco enquanto as fotografias trocam sob ele. O assunto é uma
série — as entregas reais —, e o palco dá a cada foto o tempo de uma capa.
A tipografia de display é **Archivo variável** no eixo estreito (62%) e peso
800, em caixa alta, com Lato no texto; a paleta preto/branco/vermelho foi
mantida, com o vermelho reservado a ação, preço e sinal.

Referências de mercado: a pesquisa foi feita, mas o acesso foi limitado e
precisa ser registrado como tal — a Ducati retornou **403**, a Honda
retornou **403**, a BMW Motorrad expirou por timeout e o Awwwards devolveu
apenas CSS, sem padrões úteis. A Triumph respondeu uma vez, com um resumo
curto (fotografia grande, tipografia branca pesada, navegação segmentada);
não houve inspeção visual do site. A decisão final veio do acervo de
direções da skill de design (pinned poster + Archivo comprimida) e das
fotos reais do projeto, não de uma cópia de layout de concorrente.

### 8.2 O que mudou

- **Hero desktop** (`Home.tsx`): foto do showroom em tela cheia, título
  Archivo em duas linhas, linha de apoio, CTA "Ver estoque" e dados da loja
  no rodapé do hero. O `h1` continua único e legível por leitor de tela.
  O mobile segue com o título menor em Lato e a foto em cartão, como estava.
- **Sonhos realizados** (`SonhosRealizados.tsx` + novo
  `GaleriaEntregasDesktop.tsx`): no desktop, palco `sticky` sob o cabeçalho,
  título fixo à esquerda e foto ativa à direita; a foto muda pelo scroll
  (sem autoplay), com contador `01 / 04` e o mês da entrega. Clique abre um
  `<dialog>` nativo em tela cheia com setas, teclado e devolução de foco.
  São usadas **todas as fotos publicadas**, até o limite de 6 — com os
  dados atuais, 4 fotos de 1 entrega, sem repetição artificial. Em
  `prefers-reduced-motion`, o palco vira grade estática.
- **Troca** (`Home.tsx`): bloco de papel claro em contraste com o preto,
  título Archivo, texto factual e CTA "Avaliar minha moto" com o mesmo link
  de WhatsApp/fallback de antes.
- **Marcas** (`MarcasProcuradas.tsx`): faixa escura integrada ao rodapé,
  8 logos estáticos, sem inversão de cor.
- **Cabeçalho e rodapé** (`Header.tsx`, `Footer.tsx`): no desktop, busca
  preenchida e CTA vermelho; fundo do rodapé alinhado ao breu da home. Os
  destinos e comportamentos dos links não mudaram; o menu mobile continua
  intacto.
- **Tipografia** (`index.css`, `index.html`): Archivo variável entra apenas
  no display do desktop; Lato continua no corpo, no painel, no catálogo e
  no mobile.

### 8.3 Validação

As capturas foram geradas por CDP em `npm run preview` e **inspecionadas
visualmente**. O script também mediu geometria e estilos computados.

| Largura | h1 | Cabeçalho | Hero | Palco | Foto | Transbordo |
|---|---|---|---|---|---|---|
| 1366×768 | 80,6 px · 2 linhas | 68 px | 740 px | 700 px | 544×588 | 0 px |
| 1440×900 | 85,0 px · 2 linhas | 68 px | 740 px | 832 px | 544×720 | 0 px |
| 1920×1080 | 110,4 px · 2 linhas | 68 px | 740 px | 1012 px | 544×720 | 0 px |
| 390×844 | 26 px · 2 linhas | 80 px | 526 px | — | esteira 358×210 | 0 px |

- **Galeria:** 4 fotos reais; contador e mês corretos; lightbox abre,
  prende o foco no fechar, trava o scroll do fundo, avança com seta,
  fecha com Esc, restaura o scroll e devolve o foco ao gatilho.
- **Mobile:** galeria desktop com `display: none`; hero, esteira, troca,
  marcas e rodapé comparados com as capturas anteriores e sem regressão.
- **Console:** 0 erros nas rotas e larguras testadas.
- **Contraste e alvos:** sem novas violações; os controles do lightbox têm
  rótulo acessível e alvos ≥ 44 px.

### 8.4 Testes e build

- `npm run lint`: 0 erros; permanecem 8 avisos pré-existentes (2 em
  `vendasContexto`, 6 em scripts `.mjs`).
- `npm run typecheck`: ok.
- `npm test`: 98 testes em 6 arquivos, todos passando.
- `npm run build`: ok; 2062 módulos; prerender de 4 fichas; sitemap com 8
  URLs; robots bloqueando `/admin`.

### 8.5 Migrações e documentação

As oito migrações foram renomeadas para nomes descritivos, mantendo a ordem
numérica: `cria_esquema_inicial`, `seguranca_rls_e_storage`,
`dados_iniciais_estoque`, `corrige_estrutura_estoque`, `configuracoes_da_loja`,
`promocoes_do_estoque`, `registro_de_vendas`, `publicacoes_de_entregas`.
Os cabeçalhos internos foram renumerados para coincidir com os arquivos, e
`README.md`, `supabase/README.md`, `docs/SUPABASE.md` e
`docs/PENDENCIAS-CLIENTE.md` apontam para os nomes novos.

### 8.6 Pendências e limitações

- **Preços do estoque:** três cards exibem R$ 30,90, R$ 27,90 e R$ 23,90
  (valores gravados pela metade), enquanto outro mostra R$ 15.999,00. O
  catálogo não foi alterado nesta rodada por instrução; a correção está em
  `supabase/diagnostico-precos.sql` e no aviso do README do Supabase.
- `WHATSAPP_NUMBER` continua nulo; os CTAs caem em `/contato`.
- A foto do hero tem 1024×434 px e é ampliada no desktop; para telas 1920
  o ideal é uma origem de 1920 px ou mais.
- A auditoria antiga `.taste-skill/inspect/auditar-sonhos-home.mjs` ainda
  descreve a esteira desktop que foi substituída; ela é um artefato local
  (gitignored) e foi substituída por `.taste-skill/inspect/validar-redesign.mjs`.
- As referências externas tiveram o acesso parcial descrito em 8.1; nenhuma
  tela de concorrente foi inspecionada visualmente.
