-- ============================================================
-- DG MOTOS — 0007: entregas e publicações da Home
-- ============================================================

create table if not exists public.entregas (
  id uuid primary key default gen_random_uuid(),
  moto text not null check (length(btrim(moto)) > 0),
  foto_path text,
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
    status <> 'publicada' or (foto_path is not null and autorizacao_publicacao)
  )
);

create index if not exists idx_entregas_publicadas_ordem
  on public.entregas (ordem, entregue_em desc)
  where status = 'publicada';

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

-- Fotos privadas por padrão. Só uma linha publicada em entregas pode
-- gerar URL assinada anônima para a respectiva imagem.
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
