-- ============================================================
-- 12: SITE_SETTINGS — LEITURA RESTRITA AOS PAPEIS CERTOS
-- ============================================================
-- A migração 05 criou a política "site_settings_publico" para
-- `anon, authenticated using (true)`, e a 11 apertou os grants por
-- coluna — mas nunca derrubou essa política. O efeito residual: uma
-- conta autenticada que NÃO está em public.admins lia a tabela
-- inteira de configurações, incluindo `updated_by` (o UUID de quem
-- editou por último).
--
-- A vitrine lê como `anon` (só key+value, pelos grants da 11); o
-- painel lê como admin. Esta migração fecha o meio-termo: a política
-- pública sai, e a leitura de `authenticated` passa a ter a mesma
-- barra das políticas de escrita da 11 — public.e_admin().
--
-- IMPORTANTE: depois de rodar, confira quem ficou na lista de admins
-- (a 11 promoveu tudo que já existia em auth.users):
--
--   select a.user_id, u.email
--   from public.admins a join auth.users u on u.id = a.user_id;
--
-- Conta que não é da loja: delete a linha.
--
--   delete from public.admins where user_id = '<uuid>';
-- ============================================================

-- A política da 05 saída como estava: SELECT para anon E
-- authenticated, usando (true).
drop policy if exists "site_settings_publico" on public.site_settings;

-- Vitrine: qualquer visitante lê as chaves públicas. Os grants da 11
-- já limitam o anon a (key, value) — as colunas de metadado não saem.
drop policy if exists "site_settings_leitura_publica" on public.site_settings;
create policy "site_settings_leitura_publica"
  on public.site_settings for select
  to anon
  using (true);

-- Painel: mesma barra das políticas de escrita da 11. Quem está
-- autenticado mas fora de public.admins não vê nenhuma linha.
drop policy if exists "site_settings_leitura_admin" on public.site_settings;
create policy "site_settings_leitura_admin"
  on public.site_settings for select
  to authenticated
  using (public.e_admin());

-- Cinto e suspensório: o anon não escreve em nenhuma tabela do
-- esquema public. As políticas da RLS já barram; o revoke deixa isso
-- explícito nos grants. Os grants de SELECT da vitrine (motorcycles,
-- motorcycle_images, entregas e site_settings) ficam intactos —
-- este revoke tira só escrita.
revoke insert, update, delete, truncate
  on all tables in schema public
  from anon;

-- Relatório ao aplicar: quantos admins existem. Se o número não for
-- o esperado (dono + funcionários de verdade), rode o select do
-- cabeçalho e apague o que não pertence à loja.
do $$
declare
  n integer;
begin
  select count(*) into n from public.admins;
  raise notice
    'DG MOTOS 12: % administrador(es) em public.admins — se algum não for da loja, delete a linha (ver supabase/README.md).',
    n;
end $$;
