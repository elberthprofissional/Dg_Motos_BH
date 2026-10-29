# DG Motos BH

Site institucional, catálogo de motos seminovas e painel de gestão da
DG Motos, loja em Belo Horizonte (MG). A vitrine é um site estático que
qualquer navegador abre; o painel do dono é a mesma aplicação, em rota
restrita, que também se instala como app no celular.

- **Vitrine** — home, catálogo (`/estoque`), ficha de cada moto
  (`/moto/<slug>`), contato com WhatsApp e mapa.
- **Painel** (`/admin`) — estoque, preços, fotos, promoções, livro de
  saídas (vendas), mural de entregas, lixeira e configurações da loja.
- **Sem backend próprio** — React + Vite no front, Supabase (Postgres,
  Auth e Storage) nos dados. Sem Supabase configurado, o site ainda
  funciona com o catálogo de exemplo em `src/data/`.

## Stack

| Camada     | Escolha                                                     |
| ---------- | ----------------------------------------------------------- |
| App        | React 19 + TypeScript 6 + React Router 7                    |
| Build      | Vite 8 (code-split por rota, prerender das fichas no build) |
| Estilo     | Tailwind 4 + tokens próprios em `src/index.css`             |
| Dados      | Supabase (`@supabase/supabase-js`) + RLS no banco           |
| Qualidade  | oxlint, `tsc --strict`, Vitest (172 testes) + E2E de navegação |
| Entrega    | Vercel (produção); compatível com Netlify/Cloudflare Pages  |

## Rodando local

```bash
npm install
npm run dev      # http://localhost:5173
```

Sem vontade de abrir terminal? `launcher/iniciar-projeto.bat` instala as
dependências (na primeira vez) e abre o navegador.

Para ver o site como ele vai ao ar: `npm run build && npm run preview`
(http://localhost:4173).

Variáveis de ambiente ficam em `.env` — copie `.env.example` e preencha
com a URL e a chave anônima do seu projeto Supabase. Sem essas
variáveis, o app entra no modo catálogo estático.

## Scripts

| Comando                  | O que faz                                             |
| ------------------------ | ----------------------------------------------------- |
| `npm run dev`            | Servidor de desenvolvimento com hot reload            |
| `npm run build`          | Typecheck + build + prerender (roda via `postbuild`)  |
| `npm run preview`        | Serve o `dist/` para conferir o resultado             |
| `npm run prerender`      | Só as fichas estáticas + sitemap + robots             |
| `npm run prerender:estatico` | Prerender determinístico, sem consultar o Supabase |
| `npm run csp`            | Confere o hash do script inline contra o CSP          |
| `npm run lint`           | Oxlint                                                |
| `npm run typecheck`      | TypeScript sem emitir arquivos                        |
| `npm test`               | Vitest (testes de `src/lib` e componentes)            |
| `npm run auditar`        | Auditoria de navegador via CDP (Chrome na 9222)       |
| `npm run e2e`            | E2E de navegação via CDP — rotas e guarda do `/admin`  |
| `npm run convert-images` | Converte fotos de `img/` para WebP em `public/`       |
| `npm run marcas`         | Baixa/converte logos das marcas para `public/marcas/` |
| `npm run icones-pwa`     | Gera os ícones do app em `public/icons/`              |

## Rotas

**Vitrine** (dentro do layout com cabeçalho e rodapé):

| Rota            | Página                                                    |
| --------------- | --------------------------------------------------------- |
| `/`             | Home (no app instalado, cai no login do painel)           |
| `/estoque`      | Catálogo com busca, filtros e ordenação                   |
| `/moto/:slug`   | Ficha da moto (também existe como HTML estático)          |
| `/contato`      | WhatsApp, Instagram, endereço, horários e mapa            |

**Painel** (fora do layout da vitrine, protegido por login):

| Rota                | Página                                             |
| ------------------- | -------------------------------------------------- |
| `/admin/login`      | Entrada (PWA abre aqui)                            |
| `/admin/esqueci`    | Recuperação de senha                               |
| `/admin/redefinir`  | Redefinição de senha (link do e-mail)              |
| `/admin/*`          | Painel: estoque, vendas, publicações, configurações |

## Como o catálogo se comporta

O site nunca fica sem vitrine:

1. `RootLayout` busca as motos no Supabase uma vez por sessão e as
   distribui por contexto (`useCatalogo`).
2. Enquanto o banco não responde — e se ele falhar — entra o catálogo
   de exemplo de `src/data/motorcycles.ts`.
3. Um catálogo **vazio** no banco é respeitado: se o dono removeu tudo
   de propósito, a vitrine fica vazia em vez de ressuscitar o exemplo.

O `/admin` sempre lê do banco. O fallback existe para o público, não
para gerenciar.

As fotos do catálogo moram no Storage do Supabase (tabela
`motorcycle_images`). Excluir uma moto apaga as imagens em cascata, sem
lixo acumulado no bucket.

## Configuração da loja — três níveis

WhatsApp, Instagram, endereço e horários são editáveis no painel
(Configurações) e valem para todos na hora, sem build:

1. **Banco** — tabela `site_settings` (fonte da verdade);
2. **`localStorage`** — cache local da visita;
3. **`src/data/site.ts`** — valores de fábrica quando nada veio do banco.

O layout lê tudo uma vez e distribui por contexto
(`SiteConfigProvider`). O número de WhatsApp também pode ser fixado em
`WHATSAPP_NUMBER` (`src/data/site.ts`); enquanto for `null`, os CTAs de
zap caem sozinhos para `/contato`.

## SEO e publicação

`npm run build` roda `scripts/prerender.mjs` no `postbuild` e gera:

- `dist/moto/<slug>/index.html` — título, descrição, preço, ficha
  técnica e JSON-LD **dentro do HTML**, sem depender de JavaScript;
- `dist/sitemap.xml` com as fichas disponíveis;
- `dist/robots.txt` bloqueando `/admin`.

Como o site é estático, **salvar no painel não publica os HTMLs** — o
deploy é feito no host (a Vercel reconstrói a cada push). A exceção são
os dados de `site_settings`, que valem para todos na hora.

Antes de publicar:

1. `npm run build` e `npm test` precisam passar.
2. Aplicar `supabase/migrations/_aplicar-tudo.sql` no SQL Editor (ou
   os arquivos 01–03, sem o seed opcional) — ver `supabase/README.md`.
3. Conferir o dono em `public.admins` (quem não está na tabela não
   entra no painel — `sou_admin()` faz o login checar isso).
4. Desativar o cadastro público em Authentication → Sign In / Providers
   ("Allow new users to sign up"). Sem isso, qualquer pessoa cria uma
   conta e chega até a porta do painel, mesmo sem entrar.
5. Preencher `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no host.
6. Cadastrar `/admin/redefinir` em Authentication → URL Configuration →
   Redirect URLs.
7. Conferir o domínio (`SITE_URL`), que aparece em `index.html`
   (Open Graph), `public/robots.txt` e `src/data/site.ts`.

Cabeçalhos de segurança (CSP, HSTS, X-Frame-Options etc.) já estão em
`vercel.json` e replicados em `public/_headers` para Netlify e
Cloudflare Pages. `/admin` sai dos buscadores no `robots.txt` **e** no
cabeçalho `X-Robots-Tag`.

O CSP libera o script inline do `index.html` por hash SHA-256. Esse
script precisa ficar **numa linha só** (quebra de linha muda entre
Windows e Linux) e o hash tem de bater nos dois arquivos de cabeçalho:
`npm run csp` confere isso e roda no CI.

## Segurança

- **A chave anônima do Supabase é pública por design.** Ela vai no
  bundle; a segurança do banco são as políticas RLS em
  `supabase/migrations/`. Escrita e leitura do painel exigem estar em
  `public.admins`; `custo_compra` e os dados pessoais das entregas não
  são legíveis pelo anon. A `service_role` nunca entra em `VITE_*`.
- **Login ≠ acesso ao painel.** A tela de entrada consulta
  `sou_admin()`: conta autenticada fora de `public.admins` é deslogada
  com aviso, e a guarda de rota mostra uma tela explicando o motivo. O
  RLS continua sendo a barreira final.
- **Lixeira de 30 dias.** O painel apaga o que venceu ao abrir; a
  limpeza agendada via `pg_cron` cumpre o prazo mesmo se o dono ficar
  sem entrar. Arquivos deixados pelo cron podem ser removidos pelo
  painel do Supabase.
- **O painel é PWA, não é segredo.** Instalável no celular do dono
  (`manifest.webmanifest` + `sw.js`, só em produção). Quem não tem
  login vê o `/admin/login`; o `RotaAdmin` bloqueia o resto no cliente
  e o RLS bloqueia no servidor.
- **Service worker de casca** — nunca cacheia HTML das fichas nem
  chamadas ao Supabase; rede primeiro, cache só como rede de segurança
  offline.
- **Keepalive do Supabase Free** — `cloudflare/` contém um Worker
  (publicado como `dg-motos-supabase`) que consulta o catálogo a cada
  6 horas para o projeto não pausar por inatividade. Detalhes em
  `cloudflare.md` e `docs/SUPABASE.md`.

## Identidade visual

"Bancada + ficha": a página é a bancada de oficina (fundo escuro
`#0f0e0c`) e as seções claras são o papel da ficha que deita sobre ela.
O vermelho é o único acento e funciona como carimbo — preço, ação
principal, estado disponível; nunca em rótulo miúdo ou decoração.

- **Lato** é a voz do site inteiro (texto, catálogo, celular).
- **Archivo** condensada entra só no desktop editorial (títulos de
  cartaz da home e do login).
- Tokens de cor, tipo e movimento vivem em `src/index.css`
  (`@theme` + `:root` + temas `folha`/`painel`/`publico`).
- Cantos retos são a regra do painel; os cartões da vitrine usam 16px.

Auditoria visual e de acessibilidade: `npm run auditar` sobe contra um
Chrome com CDP (porta 9222) e checa transbordo, contraste, alvo de
toque, foco de teclado, `dialog` do menu celular e mais — sai com código
1 se algo falhar, dá para pendurar em CI.

## Estrutura

```
supabase/
  migrations/     01..04 (esquema, segurança/storage, funções, seed)
                  + _aplicar-tudo.sql para aplicar de uma vez
docs/
  SUPABASE.md         passo a passo do banco e do painel
  SEO-DEPLOY.md       publicação, domínio e buscadores
  PENDENCIAS-CLIENTE.md  o que depende do proprietário
  RELATORIO-REDESIGN.md  histórico do redesign da interface
src/
  styles/       tokens, base, componentes e utilitários (index.css só importa)
  data/         site.ts (contato/endereço) e motorcycles.ts (exemplo)
  lib/          funções puras: catálogo, filtros, formatação, schema.org,
                config da loja, marcas, maps, supabase, placeholder
  hooks/        useCatalogo, useAuth, useWhatsappLink, usePageMeta,
                useJsonLd, useScroll, useInstalarPwa, SiteConfigProvider,
                VendasProvider e os contextos da vitrine e do painel
  components/
    layout/     Header, Footer, RootLayout
    home/       SonhosRealizados, GaleriaEntregasDesktop, MarcasProcuradas
    entregas/   CartaoEntrega, EsteiraFotos
    admin/      MotoForm, PhotoUploader, EstoqueTab, VendidasTab,
                PublicacoesTab, ConfiguracoesTab, LixeiraSecao,
                PreviaMoto, DialogoRegistrarVenda, InstalarApp,
                configuracoes/
    motorcycles/ BikeCard, BikeFilters, BikeGallery, LinhaEstoque,
                WhatsAppCTA
    ui/         Button, Badge, SectionHeading, EstadoVazio, Revelar,
                BotoesFlutuantes, CampoBusca, DialogoConfirmacao,
                Esqueleto, IconeWhatsapp, MapaLoja, SenhaInput, Toast…
  pages/        uma rota por arquivo, todas com React.lazy
public/
  hero/          banner da home e imagem do login
  manifest.webmanifest + sw.js   PWA do painel
  icons/ marcas/ motos/          ícones, logos e fotos locais
img/             fontes originais (hero, troca, login, logo, marcas)
scripts/
  lib/cdp.mjs             ponte CDP das auditorias
  prerender.mjs           HTML estático das fichas + sitemap + robots
  auditar-navegador.mjs   auditoria de DOM/responsivo via CDP
  verificar-csp.mjs       hash do script inline x cabeçalhos de produção
  convert-images.mjs      fotos de img/ para WebP
  gerar-icones-pwa.mjs    ícones do PWA a partir de public/logo.webp
  baixar-marcas.mjs       logos das marcas
cloudflare/       Worker keepalive do Supabase Free
launcher/         iniciar-projeto.bat para quem não usa terminal
```

## Documentação complementar

- [`docs/SUPABASE.md`](docs/SUPABASE.md) — criar o projeto, aplicar as
  migrações, cadastrar o dono e configurar o keepalive.
- [`docs/SEO-DEPLOY.md`](docs/SEO-DEPLOY.md) — domínio, OG tags,
  sitemap e publicação.
- [`docs/PENDENCIAS-CLIENTE.md`](docs/PENDENCIAS-CLIENTE.md) — o que
  ainda depende do proprietário (fotos reais, confirmações de estoque).
- [`docs/RELATORIO-REDESIGN.md`](docs/RELATORIO-REDESIGN.md) — por que
  a interface é assim.
- [`supabase/README.md`](supabase/README.md) — funções do banco e
  políticas de segurança.
