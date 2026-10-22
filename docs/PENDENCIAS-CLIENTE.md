# Pendências a confirmar com o cliente — DG Motos

Antes de publicar, os itens abaixo precisam de confirmação do proprietário.
Todas as decisões técnicas foram tomadas; este documento lista apenas o que
**não pode ser inventado**.

> **Onde editar contato/Instagram/endereço/horários:** o padrão de fábrica
> vive em `src/data/site.ts` (itens 1–3 e 6 abaixo). O dono também pode
> editar tudo isso na aba **Configurações** do `/admin`, que salva no
> navegador e vale na hora — mas só naquele aparelho. Para valer para todos
> os visitantes, ou o valor entra em `src/data/site.ts` (exige build) ou a
> config migra para o Supabase (ver `docs/SUPABASE.md`).

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

- Hoje é seed/fallback: `src/data/motorcycles.ts`.
- Com o Supabase configurado (ver `docs/SUPABASE.md`), o mesmo conteúdo
  está no Postgres e passa a ser editável em `/admin` — sem tocar em
  código.
- Marca/modelo/ano/preço vieram do site atual:
  - XRE 300 — 2021 — R$ 31.900
  - Fazer 150 — 2020 — R$ 13.900
  - Titan — 2022 — R$ 16.900
  - Lander — 2024 — R$ 26.900
  - Start — 2024 — R$ 16.900
- **Quilometragem**: `null` em todas — o site mostra "Km a confirmar" até o
  cliente passar os valores reais.
- Descrições e especificações são rascunho editorial; revisar antes de
  publicar (principalmente o câmbio da Start — o seed diz 4 marchas, mas a
  CG 160 usa 5 — e os detalhes da Lander).
- Confirmar se alguma das motos já foi vendida e usar
  `status: 'indisponivel' | 'vendida'` conforme o caso (só `disponivel`
  aparece no site).

## 5. Fotografias

**RESOLVIDO (parcialmente):** o cliente enviou a pasta `img/` com 1 foto por
moto + showroom + favicon. Elas foram convertidas para WebP e já estão no site.

- Para converter/atualizar fotos: colocar os arquivos em `img/` (mesmos
  nomes-base) e rodar `npm run convert-images`.
- **Estado atual da fonte:** `img/` guarda `hero-desktop.png` (hero da home),
  `troca.png` (banner de troca), `hero-login-noite.jpg` (entrada do painel),
  `hero-showroom-2026-07.jfif`, `hero-showroom-2026-06.png` e `logo.webp`.
  Nenhum original do catálogo está mais ali; os WebP já convertidos
  continuam em `public/motos/<modelo>/` e no site. Para trocar a foto de uma
  moto, reponha o arquivo em `img/` com o nome-base esperado
  (`xre-300-2021`, `lander-2024`, `titan-2022`, `start-2024`,
  `fazer-150-2020`) e rode `npm run convert-images`.
- **Hero atual:** a home importa `img/hero-desktop.png` diretamente; o Vite
  publica o arquivo com hash em `dist/assets/`. Já os arquivos
  `public/hero/showroom-2026-07.webp` e `showroom-2026-07-hd.webp` atendem
  Open Graph, JSON-LD e o preload do `index.html`. Ao trocar a foto da home,
  substitua `img/hero-desktop.png` e rode o build; para atualizar também as
  metatags, ajuste `index.html`, `src/lib/schema.ts` e a lista `HERO_FONTES`
  em `scripts/convert-images.mjs`.
- **Peso dos novos assets:** `hero-desktop.png` tem ~1,8 MB e `troca.png`
  ~1,7 MB. Funcionam, mas o ideal antes de publicar é exportá-los em WebP
  (ou AVIF) e reduzir a largura para o tamanho real de exibição.
- **Pendente:** o cliente enviou apenas **1 foto por moto** — o script gera
  2 recortes extras (02.webp, 03.webp) só para a galeria não ficar vazia.
  O ideal é receber 3–5 fotos reais por moto (frente, lateral, painel,
  motor, rabeta) e nomear como `01.jpg`, `02.jpg`... dentro de `img/`
  (o script pode ser ajustado para mapear várias fotos por moto).

## 6. Horários de atendimento

- Arquivo: `src/data/site.ts` → `SITE.horarios`
- Está `null`; a página de contato exibe aviso discreto até confirmar.

## 7. Telefone fixo (opcional)

- Arquivo: `src/data/site.ts` → `SITE.telefoneExibicao`
- Exibir somente se o cliente tiver linha fixa e quiser publicá-la.

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
   cilindrada, categoria, descricao, especificacoes, imagens, destaque,
   status, slug`.
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
