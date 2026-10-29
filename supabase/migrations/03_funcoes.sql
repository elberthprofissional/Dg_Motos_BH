-- ============================================================
-- DG MOTOS — 03: FUNÇÕES
-- ============================================================
-- Consolidado a partir das migrações 11, 13 e 15.
--
--   salvar_imagens_da_moto .... troca as fotos numa única transação
--   custo_da_moto ............. lê custo_compra só para o painel
--   mover_foto_entrega_para_lixeira / restaurar_foto_da_lixeira
--   limpar_lixeira_vencida .... prazo de 30 dias, agendado por pg_cron
--
-- Todas as funções checam public.e_admin() (criado na 02). Rodar
-- depois da 01 e da 02. Idempotente: pode rodar quantas vezes quiser.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Substituir as fotos da moto numa única transação
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 2. Custo de compra de UMA moto, só para o painel
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 3. Mover foto da publicação para a lixeira
-- ------------------------------------------------------------
-- Uma transação só: a foto sai de `fotos`, entra na lixeira e, se era
-- a última, a publicação é arquivada. O arquivo no Storage continua
-- onde está — quem apaga de verdade é a exclusão definitiva.
create or replace function public.mover_foto_entrega_para_lixeira(
  p_entrega_id uuid,
  p_caminho text
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_fotos jsonb;
  v_restantes jsonb;
  v_id uuid;
begin
  if not public.e_admin() then
    raise exception 'Acesso restrito ao painel.' using errcode = '42501';
  end if;

  if coalesce(btrim(p_caminho), '') = '' then
    raise exception 'Foto inválida.';
  end if;

  -- `for update` trava a linha: dois cliques ao mesmo tempo não podem
  -- duplicar a foto na lixeira nem perder a posição das restantes.
  select fotos into v_fotos
  from public.entregas
  where id = p_entrega_id
  for update;

  if v_fotos is null then
    raise exception 'Essa publicação não existe mais.';
  end if;

  if not (v_fotos ? p_caminho) then
    raise exception 'Essa foto não está mais no mural.';
  end if;

  select coalesce(jsonb_agg(foto order by posicao), '[]'::jsonb)
  into v_restantes
  from jsonb_array_elements_text(v_fotos) with ordinality as t (foto, posicao)
  where foto <> p_caminho;

  insert into public.entregas_fotos_lixeira (entrega_id, caminho)
  values (p_entrega_id, p_caminho)
  returning id into v_id;

  update public.entregas
  set fotos = v_restantes,
      status = case
        when jsonb_array_length(v_restantes) = 0 then 'arquivada'
        else status
      end
  where id = p_entrega_id;

  return v_id;
end;
$$;

revoke all on function public.mover_foto_entrega_para_lixeira(uuid, text) from public;
grant execute on function public.mover_foto_entrega_para_lixeira(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 4. Restaurar foto da lixeira
-- ------------------------------------------------------------
-- A foto volta para o fim da publicação. Se a publicação estava no ar
-- e autorizada, volta a ser pública; se não estava autorizada (caso de
-- posts antigos), continua fora do ar — o dono resolve pelo painel.
create or replace function public.restaurar_foto_da_lixeira(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_foto public.entregas_fotos_lixeira;
  v_autorizada boolean;
begin
  if not public.e_admin() then
    raise exception 'Acesso restrito ao painel.' using errcode = '42501';
  end if;

  select * into v_foto
  from public.entregas_fotos_lixeira
  where id = p_id
  for update;

  if v_foto.id is null then
    raise exception 'Essa foto já saiu da lixeira. Atualize o painel.';
  end if;

  select autorizacao_publicacao into v_autorizada
  from public.entregas
  where id = v_foto.entrega_id
  for update;

  if not found then
    raise exception 'A publicação dessa foto não existe mais.';
  end if;

  update public.entregas
  set fotos = fotos || to_jsonb(v_foto.caminho),
      status = case when v_autorizada then 'publicada' else status end
  where id = v_foto.entrega_id;

  delete from public.entregas_fotos_lixeira where id = p_id;
end;
$$;

revoke all on function public.restaurar_foto_da_lixeira(uuid) from public;
grant execute on function public.restaurar_foto_da_lixeira(uuid) to authenticated;

-- ------------------------------------------------------------
-- 5. Limpeza agendada da lixeira
-- ------------------------------------------------------------
-- O painel esvazia a lixeira quando abre (e remove os arquivos do
-- Storage). Este agendamento garante o prazo de 30 dias mesmo que o
-- dono não entre: o Postgres apaga as LINHAS vencidas uma vez por dia.
-- Arquivos de itens removidos pelo cron ficam órfãos no bucket e podem
-- ser apagados pelo painel do Supabase — a alternativa seria guardar
-- uma service_role num Worker, o que abriria mão do modelo de
-- segurança do projeto.
create or replace function public.limpar_lixeira_vencida()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  motos_apagadas integer;
begin
  delete from public.motorcycles
  where lixeira_em is not null
    and lixeira_em < now() - interval '30 days';
  get diagnostics motos_apagadas = row_count;

  delete from public.entregas_fotos_lixeira
  where apagada_em < now() - interval '30 days';

  return motos_apagadas;
end;
$$;

-- Sem grant: ninguém pela API precisa chamar isto. O agendador roda
-- como dono do banco, não como anon/authenticated.
revoke all on function public.limpar_lixeira_vencida() from public, anon, authenticated;

-- Agendamento diário (03:25, horário do servidor). Sem pg_cron, só
-- avisa: o comportamento antigo (limpeza ao abrir o painel) continua.
do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    raise notice 'pg_cron indisponível: a lixeira continua sendo limpa quando o painel abre.';
    return;
  end if;

  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'Não foi possível ativar o pg_cron (%): a lixeira continua sendo limpa quando o painel abre.', sqlerrm;
    return;
  end;

  -- Reexecutar a migração não pode criar um segundo agendamento.
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'limpar-lixeira-dg-motos';

  perform cron.schedule(
    'limpar-lixeira-dg-motos',
    '25 3 * * *',
    'select public.limpar_lixeira_vencida()'
  );
exception when others then
  raise notice 'Agendamento da lixeira não criado (%): a limpeza ocorre quando o painel abre.', sqlerrm;
end;
$$;
