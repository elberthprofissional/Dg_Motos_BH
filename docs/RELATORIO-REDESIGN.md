# Relatório de redesign — DG Motos BH

Data: 20/10/2026
Escopo: auditoria visual e de copy da vitrine, identidade, acessibilidade e
estados de interface. Nenhum dado comercial foi inventado; nenhuma seção nova
foi criada.

## 1. Método

1. Auditar o código antes de tocar em qualquer arquivo (componentes, tokens,
   páginas, hooks e docs).
2. Refinar a vitrine e a identidade dentro da paleta e tipografia já existentes.
3. Testar: `lint` -> `typecheck` -> `test` (73 testes) -> `build` + prerender.
4. Validar o HTML renderizado (DOM pós-JS) com Chrome headless contra o
   `npm run preview`.

## 2. O que foi alterado

### 2.1 Detectores de procedência (copy factual)
Removidos os claims não comprováveis de "procedência conferida/verificada" que
existiam em pontos de copy institucional. Trocados por descrição factual:

- `index.html` — `description` e `og:description`.
- `src/pages/Home.tsx` — `usePageMeta` da Home e subtítulo da vitrine.
- `src/components/layout/Footer.tsx` — frase institucional do rodapé.

Motivo: o brief proíbe afirmar garantia/procedência sem comprovação do cliente.

### 2.2 Filtro de categoria (chips derivados do estoque real)
- Novo helper `categoriasDisponiveis(motos)` em `src/lib/filters.ts`, no mesmo
  padrão de `marcasDisponiveis`.
- `src/components/motorcycles/BikeFilters.tsx`: o `<select>` de categoria (que
  listava 6 categorias fixas, 4 delas inexistentes no estoque, sempre levando ao
  estado vazio) foi substituído por chips.
- Chips mostram "Todas" + apenas categorias com moto no catálogo, na ordem
  canônica de `CATEGORIAS`.
- Ativo com `aria-pressed` e vermelho da marca (`border-brand-500`,
  `bg-brand-500/15`, `text-brand-500`); inativos em carvão/branco.
- O controle some quando há menos de duas categorias distintas — filtro
  decorativo não ajuda ninguém.

### 2.3 Carrossel (Home)
- `src/pages/Home.tsx`: as setas agora refletem o estado real da trilha via
  `scroll`/`resize`; ficam `disabled` e visualmente apagadas nas pontas.
- Rolagem respeita `prefers-reduced-motion`: salto (`auto`) para quem pediu
  menos movimento, `smooth` para os demais.

### 2.4 Endereço do drawer mobile
- `src/components/layout/Header.tsx`: endereço deixa de ser hard-coded e passa a
  vir de `config` (`enderecoRua` + `enderecoCidadeUf`), igual ao rodapé. Uma
  fonte de verdade só.

## 3. Verificação

- `lint`: ok (oxlint).
- `typecheck`: ok (tsc).
- `test`: 73/73.
- `build` + prerender: 5 fichas estáticas, sitemap 8 URLs, robots bloqueia
  `/admin`.
- DOM renderizado (Chrome headless, `--dump-dom`):
  - Estoque: 8 chips de categoria (Todas/Street/Trail nos dois layouts), 1
    `aria-pressed="true"` por layout, 5 cards, nenhum `<select>` de categoria.
  - Home: 2 setas de carrossel, a "anterior" `disabled` no início da trilha, 3
    itens de destaque, 1 único `h1`.
  - Home/Estoque/Contato: 0 ocorrências de "procedência".

## 4. Limitação

Este modelo não lê imagens. As capturas de tela foram geradas, mas a inspeção
visual pixel a pixel não foi feita por IA — a validação foi feita sobre o DOM
renderizado (estrutura, ARIA, estados e contagens). Recomenda-se uma conferência
visual humana das telas de destaque da vitrine.

## 5. Pendências do cliente (sem alteração nesta rodada)

- `WHATSAPP_NUMBER` continua nulo; CTA cai em `/contato` até o número real.
- Demais itens em `docs/PENDENCIAS-CLIENTE.md`.
