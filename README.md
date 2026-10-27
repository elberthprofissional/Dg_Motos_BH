# DG Motos — site institucional, catálogo e painel

Loja de motocicletas seminovas em Belo Horizonte, MG. Site estático
(React + TypeScript + Vite) que também é **instalável como app** (PWA) no
celular do dono. O catálogo tem duas camadas:

- **sem configuração**, vem de `src/data/motorcycles.ts` (o site funciona
  sozinho, sem backend);
- **com Supabase configurado**, vem do Postgres e passa a ser gerenciado
  pelo dono em `/admin` — estoque, preços, fotos e status.

Stack: React 19, Vite 8, Tailwind 4, TypeScript 6, oxlint, Vitest,
`@supabase/supabase-js`.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
```

Atalho para quem não usa terminal: `launcher/iniciar-projeto.bat` — instala
as dependências na primeira vez e abre o navegador.

## Scripts

| Comando                 | O que faz                                                |
| ----------------------- | -------------------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento com hot reload               |
| `npm run build`         | Typecheck + build + prerender (roda `postbuild`)         |
| `npm run preview`       | Serve o `dist/` localmente para conferir o resultado     |
| `npm run prerender`     | Só as páginas estáticas das fichas + sitemap + robots     |
| `npm run lint`          | Oxlint                                                    |
| `npm run typecheck`     | TypeScript sem emitir arquivos                           |
| `npm test`              | Vitest (testes de `src/lib`)                             |
| `npm run auditar`       | Auditoria CDP contra o preview (Chrome na porta 9222)    |
| `npm run convert-images`| Converte fotos de `img/` para WebP em `public/`          |
| `npm run marcas`        | Baixa/converte os logos das marcas para `public/marcas/` |
| `npm run icones-pwa`    | Gera os ícones do app em `public/icons/`                 |

## Estrutura

```
supabase/
  migrations/       01 cria_esquema_inicial, 02 seguranca_rls_e_storage,
                    03 dados_iniciais_estoque, 04 corrige_estrutura_estoque,
                    05 configuracoes_da_loja, 06 promocoes_do_estoque,
                    07 registro_de_vendas, 08 publicacoes_de_entregas,
                    09 lixeira_do_estoque, 10 edicao_de_vendas
                    (aplicar em ordem pelo SQL Editor)
docs/
  SUPABASE.md       passo a passo do painel do dono
  PENDENCIAS-CLIENTE.md
src/
  data/         site.ts (contato/endereço) e motorcycles.ts (fallback)
  lib/          funções puras: catálogo, filtros, formatação, schema.org,
                config da loja, marcas, maps, supabase
  hooks/        useCatalogo, useAuth, useWhatsappLink, usePageMeta,
                useJsonLd, useScroll, useInstalarPwa, SiteConfigProvider,
                VendasProvider e os contextos consumidos pela vitrine/painel
  components/
    layout/     Header, Footer, RootLayout
    home/       SonhosRealizados, GaleriaEntregasDesktop, MarcasProcuradas
    entregas/   CartaoEntrega, EsteiraFotos
    admin/      MotoForm, PhotoUploader, EstoqueTab, ConfiguracoesTab,
                LixeiraSecao, InstalarApp, useInstalarApp, SeletorMarca,
                configuracoes/ (campos, prévia e pé da mesa)
    motorcycles/ BikeCard, BikeFilters, BikeGallery, LinhaEstoque,
                WhatsAppCTA
    ui/         Button, Badge, SectionHeading, EstadoVazio, Revelar,
                BotoesFlutuantes, CampoBusca, DialogoConfirmacao,
                Esqueleto, IconeWhatsapp, InstagramIcon, MapaLoja,
                SenhaInput, Toast
  pages/        rotas (uma por página, code-split com React.lazy)
public/
  hero/                          banner da home e imagem do login
  manifest.webmanifest + sw.js   PWA (app instalável)
  icons/                         ícones do app
  marcas/                        logos dos fabricantes
  motos/                         fotos WebP do catálogo
scripts/
  lib/cdp.mjs             ponte CDP compartilhada pelas auditorias
  prerender.mjs           HTML estático das fichas + sitemap + robots
  auditar-navegador.mjs   auditoria de DOM/responsivo via CDP
  convert-images.mjs      fotos de img/ para WebP em public/
  gerar-icones-pwa.mjs    ícones do PWA a partir de public/logo.webp
  baixar-marcas.mjs       logos das marcas para public/marcas/
```

## Última rodada de layout (22/10/2026)

- **`/admin/login`** — no desktop, a foto do showroom ocupa a metade
  esquerda e o formulário flutua num cartão de vidro na metade direita. O
  acesso do celular permanece igual: logo, campos e botão direto no fundo,
  sem cartão.
- **`/moto/<slug>`** — a ordem agora é galeria + preço/ações, ficha técnica,
  descrição e, por fim, as motos recomendadas. As especificações viraram um
  grid de cartões (2 colunas no celular, 4 no desktop).
- **Home** — a seção "Marcas mais procuradas" usa o fundo escuro do site e
  mantém as cores originais dos logos, sem filtro de inversão.
- **Catálogo e estoque** — os cards de moto são a referência visual das
  demais telas: foto 4:3, superfície arredondada, badges de ano/km e CTA
  "Tenho interesse"; a página de estoque ganhou filtros em rascunho com
  "Aplicar" e "Limpar".

Verificação desta rodada: `lint`, `typecheck`, 109 testes, `build` com
prerender de 9 fichas e auditoria CDP sem transbordo, contraste baixo ou
imagem quebrada.

## Rodada de manutenção (26/10/2026)

- **`strict: true`** nos dois `tsconfig` — o app inteiro passa a contar
  com `strictNullChecks` e afins, sem exceções locais.
- **Configuração da loja virou provider** (`src/hooks/SiteConfigProvider.tsx`).
  Antes, cada `useSiteConfig` (cabeçalho, rodapé, home, contato e o hook
  de WhatsApp) disparava a própria consulta a `site_settings`; agora o
  layout lê uma vez e distribui por contexto.
- **Preload do LCP corrigido** — `index.html` injeta o preload de
  `home-desktop.webp`/`home-mobile.webp` só quando a rota é `/`, então
  painel, estoque e fichas não baixam uma imagem que não usam.
- **`ConfiguracoesTab` dividido** em `src/components/admin/configuracoes/`
  (regras puras, campos, prévia e pé). O orquestrador ficou com
  o estado, a gravação e os arranjos desktop/celular.
- **Lint sem avisos** — o tratador de mensagens CDP dos scripts de
  auditoria foi extraído para `scripts/lib/cdp.mjs`.

Verificação: `lint` sem avisos, `typecheck`, **109 testes** e `build` com
prerender das fichas + auditoria CDP sem transbordo, contraste baixo ou
imagem quebrada.

## Como o catálogo se comporta

O site **nunca fica sem vitrine**:

1. `RootLayout` busca as motos no Supabase uma vez por sessão e as
   distribui por contexto (`useCatalogo`).
2. Enquanto o banco não responde, e se ele falhar, entra
   `src/data/motorcycles.ts`.
3. Um catálogo **vazio** no banco é respeitado — se o owner removeu tudo
   de propósito, o site fica vazio em vez de ressuscitar as motos do seed.

O `/admin` sempre lê do banco: o fallback existe para o público, não para
gerenciar.

## SEO e publicação

`npm run build` roda `scripts/prerender.mjs` no `postbuild`, que gera:

- `dist/moto/<slug>/index.html` com título, descrição, preço, ficha
  técnica e JSON-LD **dentro do HTML** — sem depender de JavaScript;
- `dist/sitemap.xml` com as fichas disponíveis;
- `dist/robots.txt` bloqueando `/admin`.

Sem isso, o Google receberia a ficha `/moto/*` vazia.

Como o site é estático, **salvar no painel não publica os HTMLs
estáticos** — faça o deploy pelo painel do host (a Vercel reconstrói a
cada push). Exceção: WhatsApp, Instagram, endereço e horários ficam
no banco (`site_settings`) e valem para todos os visitantes na hora,
sem build.

## Decisões que valem saber

- **A chave anônima do Supabase é pública por design.** Ela fica no
  bundle; a segurança do banco depende das políticas RLS em
  `supabase/migrations/`. A `service_role` nunca entra em `VITE_*`.
- **Sem número de WhatsApp, todo CTA cai para `/contato`.** O hook
  `useWhatsappLink()` (`src/hooks/useWhatsappLink.ts`) devolve `null`
  enquanto `WHATSAPP_NUMBER` for `null`, e os componentes degradam
  sozinhos.
- **A config da loja tem três níveis.** Banco (tabela
  `site_settings`, editável em `/admin` → Configurações) vale para
todos os visitantes na hora; `localStorage` é cache local; o padrão
de fábrica vive em `src/data/site.ts`). A vitrine lê nessa ordem via
`useSiteConfig` (`src/hooks/siteConfigContexto.ts`) — sem esperar um
novo build.
- **O app instalado abre no login, não na vitrine.** `src/pages/Entrada.tsx`
  checa o `display-mode: standalone`: no PWA instalado, `/` cai em
  `/admin/login`; no navegador, mostra o catálogo.
- **Fotos nunca são inventadas.** `img/` guarda as fontes originais,
  organizadas por seção: `img/hero/` (home desktop e mobile, showroom),
  `img/troca/` (banner desktop e mobile), `img/login/` (entrada do painel) e
  `img/logo/`. Os assets que a vitrine importa vivem em `src/assets/` já em
  WebP — `src/assets/troca/` — e o Vite os serve com hash; os heros da home
  ficam em `public/hero/` para a URL do preload não depender do hash.
  As fotos do catálogo convertidas ficam em `public/motos/` e os logos de
  marca em `public/marcas/`. O script `convert-images` lê `img/` inteiro
  (recursivo) e gera WebP/crops; faltando foto, entra o placeholder local. Os
  arquivos `public/hero/showroom-2026-07*.webp` servem Open Graph, JSON-LD e
  o preload do `index.html`.
- **A identidade visual entra pelo material, não por número decorativo.**
  A base é a bancada escura com um único vermelho de sinal. No catálogo, as
  fichas de moto usam foto 4:3, cantos arredondados e CTA de WhatsApp; no
  desktop, o login vira uma porta de showroom com foto e cartão de vidro.
  O login do celular continua direto, sem cartão em volta.
- **As fotos ficam na tabela `motorcycle_images`.** Excluir uma moto
  apaga as linhas em cascata e remove os arquivos do Storage — sem lixo
  acumulado no bucket.
- **O `/admin` fica fora do `RootLayout` de propósito.** A vitrine e o painel
  são mundos separados: o dono não deve ver o menu da loja enquanto gerencia
  estoque. O link fica no rodapé, com cadeado, e o `robots.txt` bloqueia a rota.

## App instalável (PWA)

O painel pode ser instalado como aplicativo no celular do dono:

- `public/manifest.webmanifest` — `display: standalone`, ícones *any* e
  *maskable*; `start_url` aponta para `/admin/login`.
- `public/sw.js` — service worker de **casca**: nunca cacheia HTML das
  fichas nem chamadas ao Supabase, só o essencial do app. Registrado
  apenas em produção (`src/main.tsx`), para o HMR não brigar com cache.
- `src/components/admin/InstalarApp.tsx` — item nas Configurações com o
  modal de instalação. No Chrome/Edge usa o prompt nativo
  (`beforeinstallprompt`); no iOS mostra o passo a passo
  *Compartilhar → Adicionar à Tela de Início*.
- Ícones: `npm run icones-pwa` regenera a partir de `public/logo.webp`.

## Antes de publicar

1. `npm run build` e `npm test` precisam passar.
2. Preencher `WHATSAPP_NUMBER` e confirmar Instagram/endereço em
   `src/data/site.ts`.
3. Conferir `SITE_URL` — o domínio está replicado em `index.html`
   (Open Graph), `public/robots.txt` e `src/data/site.ts`.
4. `public/_redirects` (Netlify/Cloudflare) e `vercel.json` já tratam o
   fallback de SPA. Em Apache, configure o rewrite para `index.html`.

## Pendências abertas

`docs/PENDENCIAS-CLIENTE.md` lista o que ainda depende do proprietário:
número de WhatsApp, handle do Instagram, endereço definitivo, confirmações
do estoque e fotos reais (hoje o catálogo tem recortes da mesma foto).