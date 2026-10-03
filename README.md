# DG Motos — site institucional e catálogo

Loja de motocicletas seminovas em Belo Horizonte, MG. Site estático
(React + TypeScript + Vite). O catálogo tem duas camadas:

- **sem configuração**, vem de `src/data/motorcycles.ts` (o site funciona
  sozinho, sem backend);
- **com Supabase configurado**, vem do Postgres e passa a ser gerenciado
  pelo dono em `/admin` — estoque, preços, fotos e leads.

Stack: React 19, Vite 8, Tailwind 4, TypeScript 6, oxlint, Vitest,
`@supabase/supabase-js`.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
```

Atalho para quem não usa terminal: `launcher/iniciar-projeto.bat` (Windows)
ou `bash launcher/iniciar-projeto.sh` (Linux/Mac). Instala as dependências
na primeira vez e abre o navegador.

## Scripts

| Comando                 | O que faz                                                |
| ----------------------- | -------------------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento com hot reload               |
| `npm run build`         | Typecheck + build + prerender (roda `postbuild`)         |
| `npm run preview`       | Serve o `dist/` localmente para conferir o resultado     |
| `npm run prerender`     | Só as páginas estáticas das fichas + sitemap + robots     |
| `npm run lint`          | Oxlint                                                    |
| `npm run typecheck`     | TypeScript sem emitir arquivos                           |
| `npm test`              | Vitest (89 testes de `src/lib`)                          |
| `npm run convert-images`| Converte fotos de `img/` para WebP em `public/`          |

## Estrutura

```
supabase/
  schema.sql        tabelas, RLS, Storage e seed (rode no SQL Editor)
docs/
  SUPABASE.md       passo a passo do painel do dono
  PENDENCIAS-CLIENTE.md
src/
  data/         site.ts (contato/endereço) e motorcycles.ts (fallback)
  lib/          filtros, formatação, parcelas, schema.org, catálogo, leads, painel, supabase
  hooks/        usePageMeta, useCompare, useJsonLd, useCatalogo, auth
  components/
    layout/     Header, Footer, RootLayout
    admin/      MotoForm, PhotoUploader
    motorcycles/ BikeCard, BikeFilters, BikeGallery, comparador
    forms/      Financiamento, Troca, SimuladorParcelas
    ui/         Button, SmartImage, SectionHeading
  pages/        rotas (uma por página, code-split com React.lazy)
scripts/
  prerender.mjs  HTML estático das fichas + sitemap + robots
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

Como o site é estático, **salvar no painel não publica**. Use o botão
*Publicar site* (requer `VITE_DEPLOY_HOOK_URL`) ou faça deploy pelo painel
do host. Detalhes em [`docs/SUPABASE.md`](docs/SUPABASE.md).

## Decisões que valem saber

- **A chave anônima do Supabase é pública por design.** Ela fica no
  bundle; a segurança do banco depende das políticas RLS em
  `supabase/schema.sql`. A `service_role` nunca entra em `VITE_*`.
- **Sem número de WhatsApp, todo CTA cai para `/contato`.** O helper
  `whatsappLink()` (`src/lib/format.ts`) devolve `null` enquanto
  `WHATSAPP_NUMBER` for `null`, e os componentes degradam sozinhos.
- **Fotos nunca são inventadas.** `img/` é a fonte; o script de conversão
  gera WebP e crops. Faltando foto, entra o placeholder local.
- **`lib/finance.ts` é puro de propósito.** A fórmula de Price é testada
  sem React no meio.
- **O `/admin` fica fora do `RootLayout` de propósito.** A vitrine e o painel
  são mundos separados: o dono não deve ver o menu da loja enquanto gerencia
  estoque. O link fica no rodapé, com cadeado, e o `robots.txt` bloqueia a rota.

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