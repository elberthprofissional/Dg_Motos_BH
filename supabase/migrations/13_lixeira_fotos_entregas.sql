-- ============================================================
-- DG MOTOS — 0013: lixeira das fotos de entregas
-- ============================================================
-- Apagar uma foto no mural ("Sonhos realizados") deixava de ser
-- definitivo no primeiro clique? Não: até aqui o arquivo era removido
-- do Storage na hora, sem volta. Agora a foto sai do mural e do site,
-- mas o arquivo fica guardado por 30 dias — o mesmo prazo da lixeira
-- do estoque — até o dono restaurar ou apagar de vez.
--
-- O caminho fica numa tabela própria (`entregas_fotos_lixeira`) com o
-- id da publicação de origem. A foto sai de `entregas.fotos` e volta
-- para lá na restauração; se era a última, a publicação é arquivada
-- (o check `entrega_publicada_autorizada` continua válido).
--
-- O arquivo permanece no bucket privado 'entregas'. A leitura anônima
-- só alcança fotos de publicações no ar, então a foto na lixeira some
-- do site mesmo com o arquivo ainda guardado.
--
-- As duas operações viram RPC para acontecerem numa transação só: não
-- existe momento em que a foto some da publicação sem estar na lixeira
-- (ou vice-versa).
-- ============================================================

-- A publicação passou a ser só foto: o nome do modelo saiu do painel
-- (quem comprou já está em Vendidas). Novos posts gravam '' — o check
-- antigo exigia texto e barrava o upload.
alter table public.entregas
  drop constraint if exists entregas_moto_nome_check;

create table if not exists public.entregas_fotos_lixeira (
  id uuid primary key default gen_random_uuid(),
  -- Some junto com a publicação: sem post de origem não há o que
  -- restaurar.
  entrega_id uuid not null references public.entregas (id) on delete cascade,
  -- Caminho no bucket 'entregas' (pasta = id da publicação).
  caminho text not null check (length(btrim(caminho)) > 0),
  apagada_em timestamptz not null default now(),
  constraint entregas_fotos_lixeira_caminho_unico unique (entrega_id, caminho)
);

create index if not exists idx_entregas_fotos_lixeira_apagada_em
  on public.entregas_fotos_lixeira (apagada_em);

alter table public.entregas_fotos_lixeira enable row level security;

-- Nenhum visitante lê a lixeira. O painel lê e apaga de vez; a
-- inserção acontece pela RPC abaixo, com a mesma barra de admin.
revoke all on table public.entregas_fotos_lixeira from anon;
grant select, insert, delete on table public.entregas_fotos_lixeira to authenticated;

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
-- Mover foto da publicação para a lixeira
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
-- Restaurar foto da lixeira
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
