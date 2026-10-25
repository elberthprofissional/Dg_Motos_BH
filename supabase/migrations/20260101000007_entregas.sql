-- ============================================================
-- DG MOTOS — 0007: vendidas (posts "Realizando Sonhos")
-- ============================================================
-- Cada linha é um post de publicação da Home, estilo mural
-- fotográfico. O post nasce de uma moto marcada como vendida no
-- estoque (moto_id) ou é avulso para uma venda fora do catálogo
-- (moto_id nulo + moto_nome digitado). Várias fotos por post.

create table if not exists public.entregas (
  id uuid primary key default gen_random_uuid(),
  moto_id uuid references public.motorcycles (id) on delete set null,
  -- Nome calcado por segurança: se a moto for excluída do estoque
  -- depois, o post continua com o nome que foi publicado.
  moto_nome text not null check (length(btrim(moto_nome)) > 0),
  -- Array de caminhos no bucket privado 'entregas', na ordem de
  -- exibição do carrossel.
  fotos jsonb not null default '[]'::jsonb
    check (jsonb_typeof(fotos) = 'array'),
  legenda text,
  nome_cliente text,
  entregue_em date,
  autorizacao_publicacao boolean not null default false,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'publicada', 'arquivada')),
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entrega_publicada_autorizada check (
    status <> 'publicada'
    or (jsonb_array_length(fotos) >= 1 and autorizacao_publicacao)
  )
);

create index if not exists idx_entregas_publicadas_ordem
  on public.entregas (ordem, entregue_em desc)
  where status = 'publicada';

create index if not exists idx_entregas_moto
  on public.entregas (moto_id)
  where moto_id is not null;

drop trigger if exists trg_entregas_updated_at on public.entregas;
create trigger trg_entregas_updated_at
  before update on public.entregas
  for each row execute function public.touch_updated_at();

alter table public.entregas enable row level security;
grant select on public.entregas to anon, authenticated;
grant insert, update on public.entregas to authenticated;

drop policy if exists "entregas_publicadas_leitura_publica" on public.entregas;
create policy "entregas_publicadas_leitura_publica"
  on public.entregas for select
  to anon
  using (status = 'publicada');

drop policy if exists "entregas_admin_leitura" on public.entregas;
create policy "entregas_admin_leitura"
  on public.entregas for select
  to authenticated
  using (true);

drop policy if exists "entregas_admin_criacao" on public.entregas;
create policy "entregas_admin_criacao"
  on public.entregas for insert
  to authenticated
  with check (true);

drop policy if exists "entregas_admin_edicao" on public.entregas;
create policy "entregas_admin_edicao"
  on public.entregas for update
  to authenticated
  using (true)
  with check (true);

-- Fotos privadas por padrão. Só linhas publicadas em entregas podem
-- gerar URL assinada anônima para as respectivas imagens (a pasta do
-- arquivo usa o id do post como primeiro nível).
insert into storage.buckets (id, name, public)
values ('entregas', 'entregas', false)
on conflict (id) do update set public = false;

drop policy if exists "entregas_publicadas_fotos_leitura" on storage.objects;
create policy "entregas_publicadas_fotos_leitura"
  on storage.objects for select
  to anon
  using (
    bucket_id = 'entregas'
    and exists (
      select 1 from public.entregas e
      where e.id::text = (storage.foldername(name))[1]
        and e.status = 'publicada'
    )
  );

drop policy if exists "entregas_admin_fotos_leitura" on storage.objects;
create policy "entregas_admin_fotos_leitura"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'entregas');

drop policy if exists "entregas_admin_fotos_upload" on storage.objects;
create policy "entregas_admin_fotos_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'entregas');

drop policy if exists "entregas_admin_fotos_update" on storage.objects;
create policy "entregas_admin_fotos_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'entregas')
  with check (bucket_id = 'entregas');

drop policy if exists "entregas_admin_fotos_remocao" on storage.objects;
create policy "entregas_admin_fotos_remocao"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'entregas');
