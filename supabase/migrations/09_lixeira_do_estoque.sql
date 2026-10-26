-- ============================================================
-- DG MOTOS — 0008: lixeira do estoque
-- ============================================================
-- Excluir uma moto deixa de ser definitivo na primeira ação: a ficha
-- ganha `lixeira_em` e sai do site/pátio, mas continua no painel até
-- o dono restaurar ou apagar de vez.
--
-- O anon não enxerga linhas na lixeira nem pelas fotos: a chave é
-- pública e uma moto excluída não pode voltar a ser lida pela API.
-- O usuário autenticado (o dono) continua vendo tudo no painel.

alter table public.motorcycles
  add column if not exists lixeira_em timestamptz;

comment on column public.motorcycles.lixeira_em is
  'Quando a moto foi movida para a lixeira. NULL = ativa no painel.';

create index if not exists idx_motorcycles_lixeira_em
  on public.motorcycles (lixeira_em)
  where lixeira_em is not null;

-- --- Leitura pública: só o que está fora da lixeira ----------------------
drop policy if exists "catalogo publico" on public.motorcycles;
create policy "catalogo publico"
  on public.motorcycles for select
  to anon
  using (lixeira_em is null);

drop policy if exists "catalogo admin leitura" on public.motorcycles;
create policy "catalogo admin leitura"
  on public.motorcycles for select
  to authenticated
  using (true);

-- As fotos seguem a mesma regra da moto a que pertencem.
drop policy if exists "imagens publicas" on public.motorcycle_images;
create policy "imagens publicas"
  on public.motorcycle_images for select
  to anon
  using (
    exists (
      select 1
      from public.motorcycles m
      where m.id = motorcycle_images.motorcycle_id
        and m.lixeira_em is null
    )
  );

drop policy if exists "imagens admin leitura" on public.motorcycle_images;
create policy "imagens admin leitura"
  on public.motorcycle_images for select
  to authenticated
  using (true);
