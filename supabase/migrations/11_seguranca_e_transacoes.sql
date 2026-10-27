-- ============================================================
-- 11: SEGURANÇA POR ADMIN E TRANSAÇÕES
-- ============================================================
-- Até aqui qualquer usuário autenticado podia escrever no banco: as
-- políticas eram `to authenticated using (true)`. Como o Supabase
-- permite criar conta (a menos que o cadastro esteja desativado no
-- painel), isso deixava a loja dependente de uma configuração externa.
--
-- Agora existe uma lista explícita de administradores:
--   public.admins  → quem pode escrever e ler dados do painel
--   public.e_admin() → true só para quem está nessa lista
--
-- Além disso, `custo_compra` deixa de ser legível pela API: o catálogo
-- público e o painel leem só as colunas da vitrine; o custo é obtido
-- por uma função restrita (`custo_da_moto`).
--
-- IMPORTANTE: rode esta migração ANTES de publicar o site novo — o
-- código passa a usar as funções `salvar_imagens_da_moto` e
-- `custo_da_moto`. Depois de rodar, confira a lista de admins com:
--
--   select a.user_id, u.email
--   from public.admins a join auth.users u on u.id = a.user_id;
--
-- O bloco de seed abaixo promove quem já existe em auth.users. Se
-- houver uma conta que não é do dono, remova-a da tabela:
--
--   delete from public.admins where user_id = '<uuid>';
-- ============================================================

-- ------------------------------------------------------------
-- Lista de administradores
-- ------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Nenhuma política e nenhum grant: a tabela só é acessível pelo
-- service_role (painel do Supabase) e por funções security definer.
revoke all on table public.admins from anon, authenticated;

-- Bootstrap: promove as contas que já existiam antes desta migração.
-- Num projeto recém-criado, é só a conta do dono.
insert into public.admins (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- ------------------------------------------------------------
-- Checagem usada por todas as políticas do painel
-- ------------------------------------------------------------
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

-- ============================================================
-- CATÁLOGO
-- ============================================================
-- `custo_compra` fica fora de qualquer leitura via API. O painel usa
-- a função `custo_da_moto` quando precisa desse número (diálogo da
-- venda). A coluna continua existindo e é preenchida por SQL/seed.
revoke select on table public.motorcycles from anon, authenticated;

grant select (
  id, slug, marca, modelo, ano, preco,
  em_promocao, preco_antes, quilometragem, cilindrada, categoria,
  descricao, especificacoes, status,
  created_at, updated_at, lixeira_em
) on table public.motorcycles to anon, authenticated;

revoke select on table public.motorcycle_images from anon, authenticated;
grant select (id, motorcycle_id, src, alt, posicao)
  on table public.motorcycle_images to anon, authenticated;

-- Leitura: a vitrine continua vendo só o que está fora da lixeira;
-- o admin vê tudo.
drop policy if exists "catalogo admin leitura" on public.motorcycles;
create policy "catalogo admin leitura"
  on public.motorcycles for select
  to authenticated
  using (public.e_admin());

drop policy if exists "imagens admin leitura" on public.motorcycle_images;
create policy "imagens admin leitura"
  on public.motorcycle_images for select
  to authenticated
  using (public.e_admin());

-- Escrita: só administradores.
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

-- ============================================================
-- CONFIGURAÇÕES DA LOJA
-- ============================================================
-- A vitrine só lê `key` e `value`; `updated_by` e `updated_at` são
-- metadados do painel.
revoke select on table public.site_settings from anon, authenticated;
grant select (key, value) on table public.site_settings to anon;
grant select on table public.site_settings to authenticated;

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

-- ============================================================
-- VENDAS
-- ============================================================
revoke all on table public.sales from anon;

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

-- ============================================================
-- ENTREGAS ("Realizando Sonhos")
-- ============================================================
-- RLS filtra LINHAS, não colunas: dar SELECT na tabela inteira ao anon
-- expunha nome_cliente e legenda. A vitrine passa a ter grant apenas
-- nas colunas que realmente mostra.
revoke select on table public.entregas from anon, authenticated;
grant select (id, status, fotos, entregue_em, ordem) on table public.entregas to anon;
grant select on table public.entregas to authenticated;
grant insert, update, delete on table public.entregas to authenticated;

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

-- ============================================================
-- STORAGE
-- ============================================================
drop policy if exists "dono sobe foto" on storage.objects;
create policy "dono sobe foto"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'motos' and public.e_admin());

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

-- ============================================================
-- FUNÇÕES DO PAINEL
-- ============================================================

-- Substitui as fotos da moto numa única transação.
--
-- Antes o cliente apagava todas as linhas e inseria a lista nova em
-- duas requisições: se a inserção falhasse (rede, validação), a moto
-- ficava sem foto nenhuma. Aqui o delete e o insert acontecem juntos
-- ou não acontecem.
create or replace function public.salvar_imagens_da_moto(
  p_moto_id uuid,
  p_imagens jsonb
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if not public.e_admin() then
    raise exception 'Acesso restrito ao painel.' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_imagens, '[]'::jsonb)) <> 'array' then
    raise exception 'Lista de fotos inválida.';
  end if;

  delete from public.motorcycle_images where motorcycle_id = p_moto_id;

  with brutas as (
    select
      ordem,
      btrim(coalesce(item ->> 'src', '')) as src,
      btrim(coalesce(item ->> 'alt', ''))  as alt
    from jsonb_array_elements(coalesce(p_imagens, '[]'::jsonb))
      with ordinality as t (item, ordem)
  ),
  validas as (
    select
      src,
      alt,
      (row_number() over (order by ordem) - 1)::int as posicao
    from brutas
    where src <> ''
  )
  insert into public.motorcycle_images (motorcycle_id, src, alt, posicao)
  select p_moto_id, src, alt, posicao
  from validas;
end;
$$;

revoke all on function public.salvar_imagens_da_moto(uuid, jsonb) from public;
grant execute on function public.salvar_imagens_da_moto(uuid, jsonb) to authenticated;

-- Custo de compra de UMA moto, só para o painel.
--
-- A coluna saiu do SELECT do catálogo; o diálogo de venda continua
-- precisando do número para gravar o lucro. `security definer` lê a
-- coluna ignorando o grant, e a checagem de admin impede que um
-- usuário autenticado qualquer descubra o custo do estoque.
create or replace function public.custo_da_moto(p_moto_id uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.e_admin() then
    raise exception 'Acesso restrito ao painel.' using errcode = '42501';
  end if;

  return (
    select custo_compra
    from public.motorcycles
    where id = p_moto_id
  );
end;
$$;

revoke all on function public.custo_da_moto(uuid) from public;
grant execute on function public.custo_da_moto(uuid) to authenticated;
