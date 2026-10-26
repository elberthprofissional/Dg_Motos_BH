-- ============================================================
-- DG MOTOS — Migração 0003: correção do esquema incompleto
-- ============================================================
-- Por que existe: em alguns bancos a tabela `motorcycles` foi criada por
-- uma versão ANTIGA do schema (sem a coluna `status`) e a tabela
-- `motorcycle_images` nunca foi criada. Como `create table if not exists`
-- não altera tabela já existente, reaplicar o esquema inicial
-- (`01_cria_esquema_inicial.sql`) não conserta.
--
-- Sintoma: o painel /admin mostra "Nenhuma moto no estoque" (a consulta
-- com join falha) enquanto a home mostra as motos (usa o fallback estático).
--
-- Este arquivo alinha o banco existente SEM apagar nada:
--   1. adiciona a coluna `status` (se faltar)
--   2. cria `motorcycle_images` com a FK (se faltar)
--   3. recria índices e o trigger de updated_at
--   4. reaplica RLS, políticas e o bucket 'motos'
--   5. preenche as fotos das 5 motos de demonstração (se ainda não tiverem)
--
-- Idempotente: pode rodar quantas vezes quiser.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Trigger genérico de updated_at
-- ------------------------------------------------------------
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
-- 1. Coluna `status` em motorcycles (banco antigo pode não ter)
-- ------------------------------------------------------------
alter table public.motorcycles
  add column if not exists status text not null default 'disponivel';

-- O check precisa existir, mas `add constraint` não tem "if not exists":
-- o bloco só cria quando ainda não houver.
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
end $$;

-- ------------------------------------------------------------
-- 2. Tabela de imagens (pode não existir neste banco)
-- ------------------------------------------------------------
create table if not exists public.motorcycle_images (
  id            uuid primary key default gen_random_uuid(),
  motorcycle_id uuid not null references public.motorcycles(id) on delete cascade,
  src           text not null,
  alt           text not null default '',
  posicao       int  not null default 0,
  created_at    timestamptz not null default now(),
  constraint motorcycle_images_src_nao_vazio check (length(btrim(src)) > 0)
);

-- Garante a FK mesmo se a tabela já existia sem ela (create table if not
-- exists não adiciona constraint a tabela existente).
do $$
begin
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

-- ------------------------------------------------------------
-- 3. Índices
-- ------------------------------------------------------------
create index if not exists idx_motos_preco     on public.motorcycles (preco);
create index if not exists idx_motos_ano       on public.motorcycles (ano);
create index if not exists idx_motos_categoria on public.motorcycles (categoria);
create index if not exists idx_motos_status    on public.motorcycles (status);
create index if not exists idx_motos_destaque  on public.motorcycles (destaque);

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

-- ------------------------------------------------------------
-- 5. RLS e Storage
-- ------------------------------------------------------------
alter table public.motorcycles       enable row level security;
alter table public.motorcycle_images enable row level security;

drop policy if exists "catalogo publico" on public.motorcycles;
create policy "catalogo publico"
  on public.motorcycles for select
  to anon, authenticated
  using (true);

drop policy if exists "imagens publicas" on public.motorcycle_images;
create policy "imagens publicas"
  on public.motorcycle_images for select
  to anon, authenticated
  using (true);

drop policy if exists "dono insere moto" on public.motorcycles;
create policy "dono insere moto"
  on public.motorcycles for insert
  to authenticated
  with check (true);

drop policy if exists "dono altera moto" on public.motorcycles;
create policy "dono altera moto"
  on public.motorcycles for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "dono remove moto" on public.motorcycles;
create policy "dono remove moto"
  on public.motorcycles for delete
  to authenticated
  using (true);

drop policy if exists "dono insere imagem" on public.motorcycle_images;
create policy "dono insere imagem"
  on public.motorcycle_images for insert
  to authenticated
  with check (true);

drop policy if exists "dono altera imagem" on public.motorcycle_images;
create policy "dono altera imagem"
  on public.motorcycle_images for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "dono remove imagem" on public.motorcycle_images;
create policy "dono remove imagem"
  on public.motorcycle_images for delete
  to authenticated
  using (true);

insert into storage.buckets (id, name, public)
values ('motos', 'motos', true)
on conflict (id) do nothing;

drop policy if exists "fotos publicas" on storage.objects;
create policy "fotos publicas"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'motos');

drop policy if exists "dono sobe foto" on storage.objects;
create policy "dono sobe foto"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'motos');

drop policy if exists "dono troca foto" on storage.objects;
create policy "dono troca foto"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'motos')
  with check (bucket_id = 'motos');

drop policy if exists "dono apaga foto" on storage.objects;
create policy "dono apaga foto"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'motos');

-- ------------------------------------------------------------
-- 6. Fotos das motos de demonstração (só se a moto ainda não tiver foto)
-- ------------------------------------------------------------
-- As motos já existem no banco, então o seed 0003 original não inseriria
-- as imagens (o join depende das linhas recém-criadas). Aqui ligamos as
-- fotos por slug, sem duplicar as que já existirem.
insert into public.motorcycle_images (motorcycle_id, src, alt, posicao)
select m.id, img.src, img.alt, img.posicao
from (values
  ('honda-xre-300-2021','/motos/honda-xre-300-2021/01.webp','Honda XRE 300 2021 — vista frontal',0),
  ('honda-xre-300-2021','/motos/honda-xre-300-2021/02.webp','Honda XRE 300 2021 — vista lateral',1),
  ('honda-xre-300-2021','/motos/honda-xre-300-2021/03.webp','Honda XRE 300 2021 — painel',2),
  ('yamaha-lander-2024','/motos/yamaha-lander-2024/01.webp','Yamaha Lander 2024 — vista frontal',0),
  ('yamaha-lander-2024','/motos/yamaha-lander-2024/02.webp','Yamaha Lander 2024 — vista lateral',1),
  ('yamaha-lander-2024','/motos/yamaha-lander-2024/03.webp','Yamaha Lander 2024 — detalhe',2),
  ('honda-titan-2022','/motos/honda-titan-2022/01.webp','Honda Titan 2022 — vista frontal',0),
  ('honda-titan-2022','/motos/honda-titan-2022/02.webp','Honda Titan 2022 — vista lateral',1),
  ('honda-titan-2022','/motos/honda-titan-2022/03.webp','Honda Titan 2022 — detalhe',2),
  ('honda-start-2024','/motos/honda-start-2024/01.webp','Honda CG 160 Start 2024 — vista frontal',0),
  ('honda-start-2024','/motos/honda-start-2024/02.webp','Honda CG 160 Start 2024 — vista lateral',1),
  ('honda-start-2024','/motos/honda-start-2024/03.webp','Honda CG 160 Start 2024 — detalhe',2),
  ('yamaha-fazer-150-2020','/motos/yamaha-fazer-150-2020/01.webp','Yamaha Fazer 150 2020 — vista frontal',0),
  ('yamaha-fazer-150-2020','/motos/yamaha-fazer-150-2020/02.webp','Yamaha Fazer 150 2020 — vista lateral',1),
  ('yamaha-fazer-150-2020','/motos/yamaha-fazer-150-2020/03.webp','Yamaha Fazer 150 2020 — detalhe',2)
) as img(slug, src, alt, posicao)
join public.motorcycles m on m.slug = img.slug
where not exists (
  select 1 from public.motorcycle_images mi
  where mi.motorcycle_id = m.id and mi.src = img.src
);
