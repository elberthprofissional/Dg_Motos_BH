-- ============================================================
-- DG MOTOS — Migração 0000: estrutura do catálogo
-- ============================================================
-- Aplicar em ordem numérica no SQL Editor do Supabase
-- (ver supabase/README.md). O script é idempotente: pode rodar de novo.
--
-- Modelo de dados:
--   motorcycles        → a moto (dados comerciais e técnicos)
--   motorcycle_images  → relação 1:N das fotos, com ordem (posicao)
--
-- A separação das imagens existe para que uma foto possa ser
-- removida/substituída sem reescrever o registro inteiro e para que a
-- exclusão da moto leve as fotos junto (on delete cascade) — sem linhas
-- órfãs no banco.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Trigger genérico de updated_at
-- ------------------------------------------------------------
-- Precisa existir ANTES do create trigger: o Postgres valida a função no
-- momento em que o trigger é criado.
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
  categoria      text not null default 'Street'
                   check (categoria in ('Street','Trail','Naked','Scooter','Esportiva','Custom')),
  descricao      text not null default '',
  especificacoes jsonb not null default '[]'::jsonb,
  destaque       boolean not null default false,
  -- Status permitido, validado também no banco.
  status         text not null default 'disponivel'
                   check (status in ('disponivel','vendida','indisponivel')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- Campos obrigatórios não podem ser vazios nem só espaços.
  constraint motorcycles_marca_nao_vazia  check (length(btrim(marca))  > 0),
  constraint motorcycles_modelo_nao_vazio check (length(btrim(modelo)) > 0),
  constraint motorcycles_slug_nao_vazio   check (length(btrim(slug))   > 0)
);

-- 2. Tabela de imagens (relacionamento com a moto)
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
-- 3. Índices
-- ------------------------------------------------------------
create index if not exists idx_motos_preco       on public.motorcycles (preco);
create index if not exists idx_motos_ano         on public.motorcycles (ano);
create index if not exists idx_motos_categoria   on public.motorcycles (categoria);
create index if not exists idx_motos_status      on public.motorcycles (status);
create index if not exists idx_motos_destaque    on public.motorcycles (destaque);

-- Busca textual por marca/modelo (usada pelo filtro do catálogo).
create index if not exists idx_motos_busca
  on public.motorcycles
  using gin (to_tsvector('portuguese', coalesce(marca,'') || ' ' || coalesce(modelo,'')));

create index if not exists idx_imagens_moto
  on public.motorcycle_images (motorcycle_id, posicao);

-- ------------------------------------------------------------
-- 4. updated_at automático
-- ------------------------------------------------------------
drop trigger if exists trg_motos_updated_at on public.motorcycles;
create trigger trg_motos_updated_at
  before update on public.motorcycles
  for each row execute function public.touch_updated_at();
