-- ============================================================
-- DG MOTOS — 02: SEGURANÇA E STORAGE
-- ============================================================
-- Consolidado a partir das migrações 02, 08, 09, 11, 12, 13 e 14.
--
-- A chave anônima do Supabase é pública (vai no bundle do site). A
-- segurança real mora aqui: lista explícita de administradores,
-- grants por coluna e políticas de RLS.
--
--   Vitrine ............ anon lê só o que precisa, e só fora da lixeira
--   Painel ............. authenticated + public.e_admin()
--   Vendas ............. nenhuma leitura anônima (dados do comprador)
--   Storage ............ bucket 'motos' público; 'entregas' privado
--
-- IMPORTANTE: depois de rodar, confira quem ficou na lista de admins
-- (o seed promove tudo que já existia em auth.users):
--
--   select a.user_id, u.email
--   from public.admins a join auth.users u on u.id = a.user_id;
--
-- Conta que não é da loja: delete a linha.
--
--   delete from public.admins where user_id = '<uuid>';
--
-- Desative também o cadastro público no painel do Supabase
-- (Authentication → Sign In / Providers → "Allow new users to sign up").
--
-- Idempotente: pode rodar quantas vezes quiser.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Lista de administradores
-- ------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Nenhuma política e nenhum grant: a tabela só é acessível pelo
-- service_role (painel do Supabase) e por funções security definer.
revoke all on table public.admins from anon, authenticated;

-- Bootstrap: promove as contas que já existiam.
insert into public.admins (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- ------------------------------------------------------------
-- 2. Checagens usadas pelas políticas do painel
-- ------------------------------------------------------------
-- `e_admin()` vale para RLS e grants: true só para quem está em
-- public.admins; a tabela continua invisível pela API.
create or replace function public.e_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

revoke all on function public.e_admin() from public;
grant execute on function public.e_admin() to authenticated;

-- `sou_admin()` responde apenas sobre quem está chamando. O cliente
-- usa a resposta para fechar a porta no login; o RLS segue sendo a
-- barreira de verdade.
create or replace function public.sou_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

revoke all on function public.sou_admin() from public;
grant execute on function public.sou_admin() to authenticated;

-- ------------------------------------------------------------
-- 3. RLS ligada em todas as tabelas
-- ------------------------------------------------------------
alter table public.motorcycles            enable row level security;
alter table public.motorcycle_images      enable row level security;
alter table public.site_settings          enable row level security;
alter table public.sales                  enable row level security;
alter table public.entregas               enable row level security;
alter table public.entregas_fotos_lixeira enable row level security;

-- ------------------------------------------------------------
-- 4. Grants por coluna
-- ------------------------------------------------------------
-- RLS filtra LINHAS, não colunas. Estes grants definem o que a API
-- alcança: `custo_compra` nunca sai do banco por SELECT (o painel usa
-- `custo_da_moto`) e o anon não vê nome_cliente, legenda nem moto_id
-- das publicações.

revoke all on table public.motorcycles from anon, authenticated;
grant select (
  id, slug, marca, modelo, ano, preco,
  em_promocao, preco_antes, quilometragem, cilindrada,
  descricao, especificacoes, status,
  created_at, updated_at, lixeira_em
) on table public.motorcycles to anon, authenticated;
grant insert, update, delete on table public.motorcycles to authenticated;

revoke all on table public.motorcycle_images from anon, authenticated;
grant select (id, motorcycle_id, src, alt, posicao)
  on table public.motorcycle_images to anon, authenticated;
grant insert, update, delete on table public.motorcycle_images to authenticated;

revoke all on table public.site_settings from anon, authenticated;
-- Vitrine: só key/value. `updated_by` e `updated_at` são metadados.
grant select (key, value) on table public.site_settings to anon;
grant select on table public.site_settings to authenticated;
grant insert, update, delete on table public.site_settings to authenticated;

revoke all on table public.sales from anon;
grant select, insert, update, delete on table public.sales to authenticated;

revoke all on table public.entregas from anon, authenticated;
grant select (id, status, fotos, entregue_em, ordem) on table public.entregas to anon;
grant select, insert, update, delete on table public.entregas to authenticated;

revoke all on table public.entregas_fotos_lixeira from anon;
grant select, insert, delete on table public.entregas_fotos_lixeira to authenticated;

-- Cinto e suspensório: o anon não escreve em nenhuma tabela do
-- esquema public. As políticas já barram; o revoke deixa explícito.
revoke insert, update, delete, truncate
  on all tables in schema public
  from anon;

-- ------------------------------------------------------------
-- 5. Políticas do catálogo
-- ------------------------------------------------------------
-- Vitrine: só o que está fora da lixeira. O admin vê tudo.
drop policy if exists "catalogo publico" on public.motorcycles;
create policy "catalogo publico"
  on public.motorcycles for select
  to anon
  using (lixeira_em is null);

drop policy if exists "catalogo admin leitura" on public.motorcycles;
create policy "catalogo admin leitura"
  on public.motorcycles for select
  to authenticated
  using (public.e_admin());

drop policy if exists "dono insere moto" on public.motorcycles;
create policy "dono insere moto"
  on public.motorcycles for insert
  to authenticated
  with check (public.e_admin());

drop policy if exists "dono altera moto" on public.motorcycles;
create policy "dono altera moto"
  on public.motorcycles for update
  to authenticated
  using (public.e_admin())
  with check (public.e_admin());

drop policy if exists "dono remove moto" on public.motorcycles;
create policy "dono remove moto"
  on public.motorcycles for delete
  to authenticated
  using (public.e_admin());

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
  using (public.e_admin());

drop policy if exists "dono insere imagem" on public.motorcycle_images;
create policy "dono insere imagem"
  on public.motorcycle_images for insert
  to authenticated
  with check (public.e_admin());

drop policy if exists "dono altera imagem" on public.motorcycle_images;
create policy "dono altera imagem"
  on public.motorcycle_images for update
  to authenticated
  using (public.e_admin())
  with check (public.e_admin());

drop policy if exists "dono remove imagem" on public.motorcycle_images;
create policy "dono remove imagem"
  on public.motorcycle_images for delete
  to authenticated
  using (public.e_admin());

-- ------------------------------------------------------------
-- 6. Políticas das configurações da loja
-- ------------------------------------------------------------
drop policy if exists "site_settings_publico" on public.site_settings;
drop policy if exists "site_settings_leitura_publica" on public.site_settings;
create policy "site_settings_leitura_publica"
  on public.site_settings for select
  to anon
  using (true);

drop policy if exists "site_settings_leitura_admin" on public.site_settings;
create policy "site_settings_leitura_admin"
  on public.site_settings for select
  to authenticated
  using (public.e_admin());

drop policy if exists "site_settings_dono_insere" on public.site_settings;
create policy "site_settings_dono_insere"
  on public.site_settings for insert
  to authenticated
  with check (public.e_admin());

drop policy if exists "site_settings_dono_altera" on public.site_settings;
create policy "site_settings_dono_altera"
  on public.site_settings for update
  to authenticated
  using (public.e_admin())
  with check (public.e_admin());

drop policy if exists "site_settings_dono_remove" on public.site_settings;
create policy "site_settings_dono_remove"
  on public.site_settings for delete
  to authenticated
  using (public.e_admin());

-- ------------------------------------------------------------
-- 7. Políticas das vendas
-- ------------------------------------------------------------
-- Única tabela SEM política para anon: comprador, telefone e valores
-- negociais ficam só no painel autenticado.
drop policy if exists "sales_dono_le" on public.sales;
create policy "sales_dono_le"
  on public.sales for select
  to authenticated
  using (public.e_admin());

drop policy if exists "sales_dono_insere" on public.sales;
create policy "sales_dono_insere"
  on public.sales for insert
  to authenticated
  with check (public.e_admin());

drop policy if exists "sales_dono_atualiza" on public.sales;
create policy "sales_dono_atualiza"
  on public.sales for update
  to authenticated
  using (public.e_admin())
  with check (public.e_admin());

drop policy if exists "sales_dono_remove" on public.sales;
create policy "sales_dono_remove"
  on public.sales for delete
  to authenticated
  using (public.e_admin());

-- ------------------------------------------------------------
-- 8. Políticas das publicações ("Sonhos realizados")
-- ------------------------------------------------------------
drop policy if exists "entregas_publicadas_leitura_publica" on public.entregas;
create policy "entregas_publicadas_leitura_publica"
  on public.entregas for select
  to anon
  using (status = 'publicada');

drop policy if exists "entregas_admin_leitura" on public.entregas;
create policy "entregas_admin_leitura"
  on public.entregas for select
  to authenticated
  using (public.e_admin());

drop policy if exists "entregas_admin_criacao" on public.entregas;
create policy "entregas_admin_criacao"
  on public.entregas for insert
  to authenticated
  with check (public.e_admin());

drop policy if exists "entregas_admin_edicao" on public.entregas;
create policy "entregas_admin_edicao"
  on public.entregas for update
  to authenticated
  using (public.e_admin())
  with check (public.e_admin());

drop policy if exists "entregas_admin_remocao" on public.entregas;
create policy "entregas_admin_remocao"
  on public.entregas for delete
  to authenticated
  using (public.e_admin());

-- ------------------------------------------------------------
-- 9. Políticas da lixeira de fotos
-- ------------------------------------------------------------
-- Nenhum visitante lê a lixeira. O painel lê e apaga de vez; a
-- inserção acontece pela RPC da 03, com a mesma barra de admin.
drop policy if exists "entregas_fotos_lixeira_admin_leitura" on public.entregas_fotos_lixeira;
create policy "entregas_fotos_lixeira_admin_leitura"
  on public.entregas_fotos_lixeira for select
  to authenticated
  using (public.e_admin());

drop policy if exists "entregas_fotos_lixeira_admin_criacao" on public.entregas_fotos_lixeira;
create policy "entregas_fotos_lixeira_admin_criacao"
  on public.entregas_fotos_lixeira for insert
  to authenticated
  with check (public.e_admin());

drop policy if exists "entregas_fotos_lixeira_admin_remocao" on public.entregas_fotos_lixeira;
create policy "entregas_fotos_lixeira_admin_remocao"
  on public.entregas_fotos_lixeira for delete
  to authenticated
  using (public.e_admin());

-- ------------------------------------------------------------
-- 10. Storage
-- ------------------------------------------------------------
-- 'motos' é público: as imagens vão direto no <img> da vitrine.
-- 'entregas' é privado: a leitura anônima só alcança fotos de
-- publicações no ar (a pasta do arquivo usa o id do post).
insert into storage.buckets (id, name, public)
values ('motos', 'motos', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('entregas', 'entregas', false)
on conflict (id) do update set public = false;

drop policy if exists "fotos publicas" on storage.objects;
create policy "fotos publicas"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'motos');

drop policy if exists "dono sobe foto" on storage.objects;
create policy "dono sobe foto"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'motos' and public.e_admin());

-- O uploader do /admin sobe com upsert=true. Sem esta policy, trocar a
-- foto mantendo o mesmo nome falha em vez de substituir o arquivo.
drop policy if exists "dono troca foto" on storage.objects;
create policy "dono troca foto"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'motos' and public.e_admin())
  with check (bucket_id = 'motos' and public.e_admin());

drop policy if exists "dono apaga foto" on storage.objects;
create policy "dono apaga foto"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'motos' and public.e_admin());

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
  using (bucket_id = 'entregas' and public.e_admin());

drop policy if exists "entregas_admin_fotos_upload" on storage.objects;
create policy "entregas_admin_fotos_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'entregas' and public.e_admin());

drop policy if exists "entregas_admin_fotos_update" on storage.objects;
create policy "entregas_admin_fotos_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'entregas' and public.e_admin())
  with check (bucket_id = 'entregas' and public.e_admin());

drop policy if exists "entregas_admin_fotos_remocao" on storage.objects;
create policy "entregas_admin_fotos_remocao"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'entregas' and public.e_admin());

-- ------------------------------------------------------------
-- 11. Relatório ao aplicar
-- ------------------------------------------------------------
do $$
declare
  n integer;
begin
  select count(*) into n from public.admins;
  raise notice
    'DG MOTOS 02: % administrador(es) em public.admins — se algum não for da loja, delete a linha (ver supabase/README.md).',
    n;
end $$;
