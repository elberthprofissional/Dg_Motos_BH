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
  migrations/       0001 schema, 0002 RLS+Storage, 0003 seed,
                    0004 corrige banco incompleto (rode em ordem)
docs/
  SUPABASE.md       passo a passo do painel do dono
  PENDENCIAS-CLIENTE.md
src/
  data/         site.ts (contato/endereço) e motorcycles.ts (fallback)
  lib/          funções puras: catálogo, filtros, formatação, schema.org,
                config da loja, marcas, maps, supabase
  hooks/        useCatalogo, useAuth, useWhatsappLink, usePageMeta,
                useJsonLd, useScroll, useInstalarPwa, contexto de config
  components/
    layout/     Header, Footer, RootLayout
    admin/      MotoForm, PhotoUploader, EstoqueTab, ConfiguracoesTab,
                InstalarApp, useInstalarApp, SeletorMarca
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
  prerender.mjs           HTML estático das fichas + sitemap + robots
  auditar-navegador.mjs   auditoria de DOM/responsivo via CDP
  convert-images.mjs      fotos de img/ para WebP em public/
  gerar-icones-pwa.mjs    ícones do PWA a partir de public/logo.webp
  baixar-marcas.mjs       logos das marcas para public/marcas/
```

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

Como o site é estático, **salvar no painel não publica**. Faça o deploy
pelo painel do host (a Vercel reconstrói a cada push). Os dados comerciais
da loja vivem em `src/data/site.ts` — alterá-los exige novo build.

## Decisões que valem saber

- **A chave anônima do Supabase é pública por design.** Ela fica no
  bundle; a segurança do banco depende das políticas RLS em
  `supabase/migrations/`. A `service_role` nunca entra em `VITE_*`.
- **Sem número de WhatsApp, todo CTA cai para `/contato`.** O hook
  `useWhatsappLink()` (`src/hooks/useWhatsappLink.ts`) devolve `null`
  enquanto `WHATSAPP_NUMBER` for `null`, e os componentes degradam
  sozinhos.
- **A config da loja tem dois níveis.** O padrão de fábrica vive em
  `src/data/site.ts`; o que o dono salva em `/admin` vai para o
  `localStorage` (`src/lib/configLoja.ts`) e a vitrine lê na hora via
  `useSiteConfig` — sem esperar um novo build. A config salva vale só no
  navegador onde foi gravada; os visitantes veem o padrão.
- **O app instalado abre no login, não na vitrine.** `src/pages/Entrada.tsx`
  checa o `display-mode: standalone`: no PWA instalado, `/` cai em
  `/admin/login`; no navegador, mostra o catálogo.
- **Fotos nunca são inventadas.** `img/` guarda só as fontes de hero/logo;
  as fotos do catálogo já convertidas vivem em `public/motos/`. O script de
  conversão gera WebP e crops; faltando foto, entra o placeholder local. O
  hero tem a versão no nome (`showroom-2026-07.webp` e
  `showroom-2026-07-hd.webp`): trocar só o conteúdo mantendo a URL faria o
  CDN servir a foto velha do cache.
- **A identidade visual entra pelo material, não por número decorativo.**
  A assinatura é a moldura de registro (cantos vermelhos), o quadro de dados
  com filete de 1 px e o canto reto. A Home não tem seção de estatísticas
  decorativas nem faixa de texto sobre a foto.
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