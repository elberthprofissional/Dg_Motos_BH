# Pendências a confirmar com o cliente — DG Motos

Antes de publicar, os itens abaixo precisam de confirmação do proprietário.
Todas as decisões técnicas foram tomadas; este documento lista apenas o que
**não pode ser inventado**.

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
  publicar (principalmente câmbio da Start e detalhes da Lander).
- Confirmar se alguma das motos já foi vendida e usar
  `disponibilidade: 'reservada' | 'vendida'` conforme o caso.

## 5. Fotografias

**RESOLVIDO (parcialmente):** o cliente enviou a pasta `img/` com 1 foto por
moto + showroom + favicon. Elas foram convertidas para WebP e já estão no site.

- Para converter/atualizar fotos: colocar os arquivos em `img/` (mesmos
  nomes) e rodar `npm run convert-images`.
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
4. Clique em **Publicar site** (ou faça deploy pelo painel do host) para
   o Google e as páginas estáticas receberem a versão nova.

Sem Supabase, o caminho é pelo código:

1. Abra `src/data/motorcycles.ts`.
2. Cada moto é um objeto com `marca, modelo, ano, preco, quilometragem,
   cilindrada, categoria, descricao, especificacoes, imagens, destaque,
   disponibilidade, slug`.
3. Para **adicionar**: copie um bloco existente, mude `id`, `slug`
   (formato `marca-modelo-ano`) e os dados.
4. Para **marcar como vendida**: `disponibilidade: 'vendida'` (some do
   catálogo automaticamente).
5. Fotos: coloque os arquivos em `public/motos/<pasta>/` listados em
   `imagens[]` — a primeira é a capa.

## Como rodar o projeto

- Windows: dê dois cliques em `launcher\iniciar-projeto.bat`
  (instala dependências na 1ª vez, sobe o servidor em segundo plano e abre
  http://localhost:5173).
- Linux/Mac: `bash launcher/iniciar-projeto.sh`
- Build de produção: `npm run build` (saída em `dist/`).
