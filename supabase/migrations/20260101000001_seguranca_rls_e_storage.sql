-- ============================================================
-- DG MOTOS — Migração 0001: RLS e Storage
-- ============================================================
-- A chave anônima do Supabase é pública (vai no bundle do site). Por
-- isso a segurança real mora aqui: sem estas políticas, qualquer pessoa
-- com a chave conseguiria escrever no estoque.
--
--   Leitura do catálogo ...... liberada (a vitrine precisa)
--   Escrita no catálogo ...... apenas usuário autenticado (o dono)
--   Upload/remoção de foto ... apenas usuário autenticado
-- ============================================================

alter table public.motorcycles       enable row level security;
alter table public.motorcycle_images enable row level security;

-- --- Leitura pública ----------------------------------------------------
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

-- --- Escrita apenas para o dono autenticado -----------------------------
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

-- ------------------------------------------------------------
-- Storage das fotos
-- ------------------------------------------------------------
-- Bucket público: as imagens precisam ser servidas direto no <img> da
-- vitrine, sem autenticação.
insert into storage.buckets (id, name, public)
values ('motos', 'motos', true)
on conflict (id) do nothing;

-- Leitura pública das fotos
drop policy if exists "fotos publicas" on storage.objects;
create policy "fotos publicas"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'motos');

-- Upload, substituição e remoção apenas pelo dono autenticado
drop policy if exists "dono sobe foto" on storage.objects;
create policy "dono sobe foto"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'motos');

-- O uploader do /admin sobe com upsert=true. Sem esta policy, trocar a
-- foto mantendo o mesmo nome falha em vez de substituir o arquivo.
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
