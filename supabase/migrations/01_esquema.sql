-- ============================================================
-- DG MOTOS — 01: ESQUEMA
-- ============================================================
-- Estrutura final do banco, consolidada a partir das migrações
-- 01, 03, 04, 05, 06, 07, 08, 09, 10, 13 e 16.
--
--   motorcycles               → a moto (dados comerciais e técnicos)
--   motorcycle_images         → relação 1:N das fotos, com ordem
--   site_settings             → configurações globais da loja
--   sales                     → histórico de vendas (foto dos dados)
--   entregas                  → mural "Sonhos realizados"
--   entregas_fotos_lixeira    → fotos do mural na lixeira (30 dias)
--
-- A separação das imagens existe para que uma foto possa ser
-- removida/substituída sem reescrever o registro inteiro e para que a
-- exclusão da moto leve as fotos junto (on delete cascade) — sem
-- linhas órfãs no banco.
--
-- Idempotente: pode rodar quantas vezes quiser. Os blocos de
-- compatibilidade no fim alinham bancos antigos (tabela criada por
-- uma versão incompleta do esquema) sem apagar dados.
--
-- Ordem de aplicação: 01 (este) → 02 → 03 → 04.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Trigger genérico de updated_at
-- ------------------------------------------------------------
-- Precisa existir ANTES do create trigger: o Postgres valida a função
-- no momento em que o trigger é criado.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 1. Tabela de motocicletas
-- ------------------------------------------------------------
create table if not exists public.motorcycles (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  marca          text not null,
  modelo         text not null,
  ano            int  not null check (ano between 1980 and 2100),
  -- Preço SEMPRE numérico (nunca texto formatado): é o que permite
  -- ordenar e filtrar por faixa no banco.
  preco          numeric(12,2) not null check (preco >= 0),
  quilometragem  int check (quilometragem is null or quilometragem >= 0),
  cilindrada     int check (cilindrada is null or cilindrada > 0),
  descricao      text not null default '',
  especificacoes jsonb not null default '[]'::jsonb,
  -- Promoção: "de → por" na vitrine. preco_antes é o preço de
  -- referência (riscado no site); preco continua sendo o de venda.
  em_promocao    boolean not null default false,
  preco_antes    numeric(12,2),
  -- Custo de compra nunca é lido pela API: sai por `custo_da_moto`
  -- (migração 03), restrita ao painel.
  custo_compra   numeric(12,2),
  status         text not null default 'disponivel',
  -- Quando a moto foi movida para a lixeira. NULL = ativa no painel.
  lixeira_em     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- Campos obrigatórios não podem ser vazios nem só espaços.
  constraint motorcycles_marca_nao_vazia  check (length(btrim(marca))  > 0),
  constraint motorcycles_modelo_nao_vazio check (length(btrim(modelo)) > 0),
  constraint motorcycles_slug_nao_vazio   check (length(btrim(slug))   > 0),
  constraint motorcycles_status_valido
    check (status in ('disponivel','vendida','indisponivel')),
  constraint motorcycles_preco_antes_valido
    check (preco_antes is null or preco_antes >= 0),
  constraint motorcycles_custo_compra_valido
    check (custo_compra is null or custo_compra >= 0),
  -- Promoção ligada exige um "de" maior que o "por", senão o selo de
  -- desconto sai negativo.
  constraint motorcycles_promocao_coerente
    check (not em_promocao or (preco_antes is not null and preco_antes > preco))
);

comment on column public.motorcycles.lixeira_em is
  'Quando a moto foi movida para a lixeira. NULL = ativa no painel.';

-- ------------------------------------------------------------
-- 2. Tabela de imagens (relacionamento com a moto)
-- ------------------------------------------------------------
create table if not exists public.motorcycle_images (
  id            uuid primary key default gen_random_uuid(),
  motorcycle_id uuid not null references public.motorcycles(id) on delete cascade,
  src           text not null,
  alt           text not null default '',
  -- Ordem de exibição; posicao 0 é a capa.
  posicao       int  not null default 0,
  created_at    timestamptz not null default now(),
  constraint motorcycle_images_src_nao_vazio check (length(btrim(src)) > 0)
);

-- ------------------------------------------------------------
-- 3. Configurações globais da loja
-- ------------------------------------------------------------
-- Permite que o dono altere WhatsApp, Instagram, endereço e horários
-- sem rebuild. O site lê do banco (fallback em src/data/site.ts).
create table if not exists public.site_settings (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- ------------------------------------------------------------
-- 4. Vendas
-- ------------------------------------------------------------
-- Registrar a venda no dia em que ela acontece, com uma FOTO DOS
-- DADOS da moto (marca, modelo, ano, custo e valor fechado): se a
-- moto for excluída do catálogo depois, o histórico continua íntegro.
-- O vínculo é solto (SET NULL) exatamente por isso.
--
-- Comprador, telefone e valores são pessoais: nada de leitura anônima.
create table if not exists public.sales (
  id              uuid primary key default gen_random_uuid(),
  motorcycle_id   uuid references public.motorcycles(id) on delete set null,
  marca           text not null,
  modelo          text not null,
  ano             integer not null,
  valor           numeric(12,2) not null check (valor >= 0),
  forma_pagamento text not null default 'outra',
  comprador       text,
  telefone        text,
  -- Custo de compra no dia da venda (para o lucro); null = sem custo.
  custo           numeric(12,2) check (custo is null or custo >= 0),
  vendida_em      timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. Entregas ("Sonhos realizados")
-- ------------------------------------------------------------
-- Cada linha é um post da Home, estilo mural fotográfico. O post
-- nasce de uma moto marcada como vendida (moto_id) ou é avulso
-- (moto_id nulo). `moto_nome` é a foto do nome na publicação: se a
-- moto sair do estoque, o post continua com o nome que foi ao ar.
create table if not exists public.entregas (
  id                     uuid primary key default gen_random_uuid(),
  moto_id                uuid references public.motorcycles (id) on delete set null,
  moto_nome              text not null default '',
  -- Array de caminhos no bucket privado 'entregas', na ordem de
  -- exibição do carrossel.
  fotos                  jsonb not null default '[]'::jsonb
                           check (jsonb_typeof(fotos) = 'array'),
  legenda                text,
  nome_cliente           text,
  entregue_em            date,
  autorizacao_publicacao boolean not null default false,
  status                 text not null default 'rascunho'
                           check (status in ('rascunho', 'publicada', 'arquivada')),
  ordem                  integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint entrega_publicada_autorizada check (
    status <> 'publicada'
    or (jsonb_array_length(fotos) >= 1 and autorizacao_publicacao)
  )
);

-- ------------------------------------------------------------
-- 6. Lixeira das fotos do mural
-- ------------------------------------------------------------
-- Apagar uma foto do mural não é definitivo no primeiro clique: o
-- arquivo fica guardado por 30 dias (mesmo prazo da lixeira do
-- estoque) até o dono restaurar ou apagar de vez. O caminho sai de
-- `entregas.fotos` e volta para lá na restauração (RPC na 03).
create table if not exists public.entregas_fotos_lixeira (
  id          uuid primary key default gen_random_uuid(),
  -- Some junto com a publicação: sem post de origem não há o que
  -- restaurar.
  entrega_id  uuid not null references public.entregas (id) on delete cascade,
  -- Caminho no bucket 'entregas' (pasta = id da publicação).
  caminho     text not null check (length(btrim(caminho)) > 0),
  apagada_em  timestamptz not null default now(),
  constraint entregas_fotos_lixeira_caminho_unico unique (entrega_id, caminho)
);

-- ------------------------------------------------------------
-- 7. Compatibilidade com bancos antigos
-- ------------------------------------------------------------
-- `create table if not exists` não altera tabela existente. Estes
-- blocos alinham bancos criados por uma versão incompleta do esquema
-- (sem `status`, sem `motorcycle_images`) sem apagar nada.

alter table public.motorcycles
  add column if not exists status text not null default 'disponivel';

alter table public.motorcycles
  add column if not exists em_promocao boolean not null default false;

alter table public.motorcycles
  add column if not exists preco_antes numeric(12,2)
  check (preco_antes is null or preco_antes >= 0);

alter table public.motorcycles
  add column if not exists custo_compra numeric(12,2)
  check (custo_compra is null or custo_compra >= 0);

alter table public.motorcycles
  add column if not exists lixeira_em timestamptz;

-- `add constraint` não tem "if not exists": cada bloco só cria a
-- constraint quando ela ainda não existir.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'motorcycles_status_valido'
      and conrelid = 'public.motorcycles'::regclass
  ) then
    alter table public.motorcycles
      add constraint motorcycles_status_valido
      check (status in ('disponivel','vendida','indisponivel'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'motorcycles_promocao_coerente'
      and conrelid = 'public.motorcycles'::regclass
  ) then
    alter table public.motorcycles
      add constraint motorcycles_promocao_coerente
      check (not em_promocao or (preco_antes is not null and preco_antes > preco));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'motorcycle_images_motorcycle_id_fkey'
      and conrelid = 'public.motorcycle_images'::regclass
  ) then
    alter table public.motorcycle_images
      add constraint motorcycle_images_motorcycle_id_fkey
      foreign key (motorcycle_id) references public.motorcycles(id)
      on delete cascade;
  end if;
end $$;

-- Colunas aposentadas: `destaque` virou promoção de verdade
-- (em_promocao) e `categoria` era vocabulário de catálogo estrangeiro
-- que a loja nunca usou. O grant por coluna da 02 não precisa de
-- ajuste: o Postgres remove sozinho os privilégios de coluna apagada.
drop index if exists public.idx_motos_categoria;
drop index if exists public.idx_motos_destaque;

alter table public.motorcycles drop column if exists categoria;
alter table public.motorcycles drop column if exists destaque;

-- A publicação passou a ser só foto: o nome do modelo saiu do painel
-- (quem comprou já está em Vendidas). Posts novos gravam ''.
alter table public.entregas
  drop constraint if exists entregas_moto_nome_check;

-- ------------------------------------------------------------
-- 8. Índices
-- ------------------------------------------------------------
create index if not exists idx_motos_preco      on public.motorcycles (preco);
create index if not exists idx_motos_ano        on public.motorcycles (ano);
create index if not exists idx_motos_status     on public.motorcycles (status);
create index if not exists idx_motos_promocao   on public.motorcycles (em_promocao);

-- Busca textual por marca/modelo (usada pelo filtro do catálogo).
create index if not exists idx_motos_busca
  on public.motorcycles
  using gin (to_tsvector('portuguese', coalesce(marca,'') || ' ' || coalesce(modelo,'')));

create index if not exists idx_imagens_moto
  on public.motorcycle_images (motorcycle_id, posicao);

-- A lixeira só consulta linhas marcadas.
create index if not exists idx_motorcycles_lixeira_em
  on public.motorcycles (lixeira_em)
  where lixeira_em is not null;

create index if not exists idx_sales_vendida_em
  on public.sales (vendida_em desc);

create index if not exists idx_entregas_publicadas_ordem
  on public.entregas (ordem, entregue_em desc)
  where status = 'publicada';

create index if not exists idx_entregas_moto
  on public.entregas (moto_id)
  where moto_id is not null;

create index if not exists idx_entregas_fotos_lixeira_apagada_em
  on public.entregas_fotos_lixeira (apagada_em);

-- ------------------------------------------------------------
-- 9. updated_at automático
-- ------------------------------------------------------------
drop trigger if exists trg_motos_updated_at on public.motorcycles;
create trigger trg_motos_updated_at
  before update on public.motorcycles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_entregas_updated_at on public.entregas;
create trigger trg_entregas_updated_at
  before update on public.entregas
  for each row execute function public.touch_updated_at();
