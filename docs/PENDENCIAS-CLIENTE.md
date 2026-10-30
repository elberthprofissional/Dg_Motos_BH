# Pendências a confirmar com o cliente — DG Motos

Antes de publicar, os itens abaixo precisam de confirmação do proprietário.
Todas as decisões técnicas foram tomadas; este documento lista apenas o que
**não pode ser inventado**.

> **Onde editar contato/Instagram/endereço/horários:** o padrão de fábrica
> vive em `src/data/site.ts` (itens 1–3 e 6 abaixo). O dono edita tudo isso
> na aba **Configurações** do `/admin`: no projeto com Supabase, o valor é
> salvo na tabela `site_settings` e vale para todos os visitantes na hora
> (sem rebuild) — o `localStorage` fica só como cache/fallback.
> Ver `docs/SUPABASE.md` e, em `supabase/migrations/`, `01_esquema.sql`
> (tabela) e `04_dados_iniciais.sql` (registro `loja`).

## 1. WhatsApp oficial (crítico)

- Arquivo: `src/data/site.ts` → `WHATSAPP_NUMBER`
- Está `null` de propósito. Preencher com o número oficial da loja, só
  dígitos, com DDI e DDD. Exemplo: `5531987654321`.
- Enquanto estiver nulo, todo CTA de WhatsApp cai para a página /contato.
- Nenhum telefone foi inventado.

## 2. Instagram oficial

- Arquivo: `src/data/site.ts` → `SITE.instagram`
- Placeholder atual: `@dgmotosbh` / `https://instagram.com/dgmotosbh`.
- Confirmar o handle real antes de publicar.

## 3. Endereço

- Arquivo: `src/data/site.ts` → `SITE.endereco`
- Usado: **Av. Basílio da Gama, 139 — Belo Horizonte, MG** (dado do briefing,
  sujeito a confirmação, conforme instruído).
- O link do Google Maps é gerado por busca; revisar após confirmar o endereço
  (ideal: trocar pelo link oficial do Google Meu Negócio).

## 4. Estoque (catálogo)

- Em produção, o catálogo vem do Supabase e é editado em `/admin → Estoque`.
- `src/data/motorcycles.ts` é o **fallback**: entra quando o Supabase não
  está configurado ou está fora do ar, e alimenta o prerender quando o build
  roda sem chaves. Um catálogo vazio no banco é respeitado.
- Os 5 registros do fallback vieram do site atual:
  - XRE 300 — 2021 — R$ 31.900
  - Fazer 150 — 2020 — R$ 13.900
  - Titan — 2022 — R$ 16.900
  - Lander — 2024 — R$ 26.900
  - Start — 2024 — R$ 16.900
- **Quilometragem**: `null` no fallback — o site mostra "Km a confirmar" até o
  cliente passar os valores reais (vale também para o cadastro no painel).
- Descrições e especificações são rascunho editorial; revisar antes de
  publicar (principalmente o câmbio da Start — o seed diz 4 marchas, mas a
  CG 160 usa 5 — e os detalhes da Lander).
- Confirmar se alguma das motos já foi vendida e usar
  `status: 'indisponivel' | 'vendida'` conforme o caso (só `disponivel`
  aparece no site).

## 5. Fotografias

**RESOLVIDO (parcialmente):** o cliente enviou a pasta `img/` com 1 foto por
moto + showroom + logo. Elas foram convertidas para WebP e já estão no site.

- Fontes em `img/`: `hero/` (home desktop e mobile), `login/` (entrada do
  painel), `troca/` (banner desktop, mobile e arte da troca), `logo/` e
  `marcas/`.
- Consumo no site: `public/hero/` (heróis e showroom), `src/assets/troca/`
  (arte da troca, com hash do Vite), `public/motos/` (catálogo) e
  `public/marcas/` (logos).
- Para converter/atualizar fotos: colocar os arquivos em `img/` (mesmos
  nomes-base) e rodar `npm run convert-images`. Ao trocar o hero, ajuste
  também `index.html`, `src/lib/schema.ts` e as listas do script.
- Os WebP atuais são leves (home desktop ~31 KB, home mobile ~58 KB,
  entrada do painel ~112 KB). Se um original novo for muito maior, exporte
  em WebP/AVIF antes de colocar no site.
- **Pendente:** o cliente enviou apenas **1 foto por moto** — o script gera
  2 recortes extras (02.webp, 03.webp) só para a galeria não ficar vazia.
  O ideal é receber 3–5 fotos reais por moto (frente, lateral, painel,
  motor, rabeta) e nomear como `01.jpg`, `02.jpg`... dentro de `img/`
  (o script pode ser ajustado para mapear várias fotos por moto).

## 6. Horários de atendimento

- Arquivo: `src/data/site.ts` → `SITE.horarios`
- Preenchidos com **Seg a Sex, 9h–18h** e **Sáb, 9h–13h**. Confirmar com o
  cliente antes de publicar; a edição também pode ser feita em
  `/admin → Configurações`.

## 7. Domínio (crítico)

- O site está publicado em `https://dg-motos-bh.vercel.app`, mas todos os
  endereços internos — sitemap, Open Graph, canonical e JSON-LD — apontam
  para `https://dgmotos.com.br`, definido em `src/data/site.ts` →
  `SITE_URL`.
- **`dgmotos.com.br` hoje serve outro site**: o sitemap de lá lista
  `/sobre-nos`, `/avaliacao` e `/financiamento`, páginas que não existem
  neste projeto. Enquanto o domínio não apontar para a Vercel, o Google
  lê os canonicals deste site e encontra conteúdo diferente no destino.
- Para resolver: painel da Vercel do projeto → **Settings → Domains** →
  adicionar `dgmotos.com.br` e seguir as instruções de DNS.
- `SITE_URL` já está com o valor certo; o que falta é o domínio chegar
  na Vercel.

---

## Como atualizar o estoque no dia a dia

Com o painel configurado (recomendado):

1. Entre em `/admin` com o e-mail do dono.
2. Aba **Estoque** → **Nova moto** (ou **Editar** numa existente).
3. Preencha os dados, arraste as fotos e salve.
4. Para contato, Instagram, endereço e horários: aba **Configurações**.
5. Faça o deploy pelo painel do host (um `git push` na Vercel já basta)
   para o Google e as páginas estáticas receberem a versão nova.

No celular, a aba **Configurações** também tem **Instalar o aplicativo**:
o painel vira um app em tela cheia, abrindo direto no login.

Sem Supabase, o caminho é pelo código:

1. Abra `src/data/motorcycles.ts`.
2. Cada moto é um objeto com `marca, modelo, ano, preco, quilometragem,
   cilindrada, descricao, especificacoes, imagens, emPromocao,
   precoAntes, status, slug`.
3. Para **adicionar**: copie um bloco existente, mude `id`, `slug`
   (formato `marca-modelo-ano`) e os dados.
4. Para **marcar como vendida**: `status: 'vendida'` (some do catálogo
   automaticamente).
5. Fotos: coloque os arquivos em `public/motos/<pasta>/` listados em
   `imagens[]` — a primeira é a capa.

## Como rodar o projeto

- Windows: dê dois cliques em `launcher\iniciar-projeto.bat`
  (instala dependências na 1ª vez, sobe o servidor em segundo plano e abre
  http://localhost:5173).
- Build de produção: `npm run build` (saída em `dist/`).
