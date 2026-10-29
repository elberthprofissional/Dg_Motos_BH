-- ============================================================
-- DG MOTOS — aplicar todas as migrações de uma vez
-- ============================================================
-- Concatenação dos 4 arquivos, nesta ordem:
--   01_esquema.sql              tabelas, constraints, índices e triggers
--   02_seguranca_e_storage.sql  admins, e_admin(), RLS e buckets
--   03_funcoes.sql              RPCs do painel + limpeza agendada (pg_cron)
--   04_dados_iniciais.sql       OPCIONAL: 5 motos de demonstração e a
--                               configuração global da loja
--
-- Rode o arquivo inteiro no SQL Editor do Supabase. É idempotente:
-- pode rodar de novo. Banco já atualizado pelas migrações antigas
-- (01–16) não precisa de nada; em dúvida, rodar este arquivo é seguro.
-- ============================================================

-- ============================================================
-- DG MOTOS — 01: ESQUEMA
-- ============================================================
-- Estrutura final do banco, consolidada a partir das migrações
-- 01, 03, 04, 05, 06, 07, 08, 09, 10, 13 e 16.
--
--   motorcycles               → a moto (dados comerciais e técnicos)
--   motorcycle_images         → relação 1:N das fotos, com ordem
--   site_settings             → configurações globais da loja
--   sales                     → histórico de vendas (foto dos dados)
--   entregas                  → mural "Sonhos realizados"
--   entregas_fotos_lixeira    → fotos do mural na lixeira (30 dias)
--
-- A separação das imagens existe para que uma foto possa ser
-- removida/substituída sem reescrever o registro inteiro e para que a
-- exclusão da moto leve as fotos junto (on delete cascade) — sem
-- linhas órfãs no banco.
--
-- Idempotente: pode rodar quantas vezes quiser. Os blocos de
-- compatibilidade no fim alinham bancos antigos (tabela criada por
-- uma versão incompleta do esquema) sem apagar dados.
--
-- Ordem de aplicação: 01 (este) → 02 → 03 → 04.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Trigger genérico de updated_at
-- ------------------------------------------------------------
-- Precisa existir ANTES do create trigger: o Postgres valida a função
-- no momento em que o trigger é criado.
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
-- 1. Tabela de motocicletas
-- ------------------------------------------------------------
create table if not exists public.motorcycles (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  marca          text not null,
  modelo         text not null,
  ano            int  not null check (ano between 1980 and 2100),
  -- Preço SEMPRE numérico (nunca texto formatado): é o que permite
  -- ordenar e filtrar por faixa no banco.
  preco          numeric(12,2) not null check (preco >= 0),
  quilometragem  int check (quilometragem is null or quilometragem >= 0),
  cilindrada     int check (cilindrada is null or cilindrada > 0),
  descricao      text not null default '',
  especificacoes jsonb not null default '[]'::jsonb,
  -- Promoção: "de → por" na vitrine. preco_antes é o preço de
  -- referência (riscado no site); preco continua sendo o de venda.
  em_promocao    boolean not null default false,
  preco_antes    numeric(12,2),
  -- Custo de compra nunca é lido pela API: sai por `custo_da_moto`
  -- (migração 03), restrita ao painel.
  custo_compra   numeric(12,2),
  status         text not null default 'disponivel',
  -- Quando a moto foi movida para a lixeira. NULL = ativa no painel.
  lixeira_em     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- Campos obrigatórios não podem ser vazios nem só espaços.
  constraint motorcycles_marca_nao_vazia  check (length(btrim(marca))  > 0),
  constraint motorcycles_modelo_nao_vazio check (length(btrim(modelo)) > 0),
  constraint motorcycles_slug_nao_vazio   check (length(btrim(slug))   > 0),
  constraint motorcycles_status_valido
    check (status in ('disponivel','vendida','indisponivel')),
  constraint motorcycles_preco_antes_valido
    check (preco_antes is null or preco_antes >= 0),
  constraint motorcycles_custo_compra_valido
    check (custo_compra is null or custo_compra >= 0),
  -- Promoção ligada exige um "de" maior que o "por", senão o selo de
  -- desconto sai negativo.
  constraint motorcycles_promocao_coerente
    check (not em_promocao or (preco_antes is not null and preco_antes > preco))
);

comment on column public.motorcycles.lixeira_em is
  'Quando a moto foi movida para a lixeira. NULL = ativa no painel.';

-- ------------------------------------------------------------
-- 2. Tabela de imagens (relacionamento com a moto)
-- ------------------------------------------------------------
create table if not exists public.motorcycle_images (
  id            uuid primary key default gen_random_uuid(),
  motorcycle_id uuid not null references public.motorcycles(id) on delete cascade,
  src           text not null,
  alt           text not null default '',
  -- Ordem de exibição; posicao 0 é a capa.
  posicao       int  not null default 0,
  created_at    timestamptz not null default now(),
  constraint motorcycle_images_src_nao_vazio check (length(btrim(src)) > 0)
);

-- ------------------------------------------------------------
-- 3. Configurações globais da loja
-- ------------------------------------------------------------
-- Permite que o dono altere WhatsApp, Instagram, endereço e horários
-- sem rebuild. O site lê do banco (fallback em src/data/site.ts).
create table if not exists public.site_settings (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- ------------------------------------------------------------
-- 4. Vendas
-- ------------------------------------------------------------
-- Registrar a venda no dia em que ela acontece, com uma FOTO DOS
-- DADOS da moto (marca, modelo, ano, custo e valor fechado): se a
-- moto for excluída do catálogo depois, o histórico continua íntegro.
-- O vínculo é solto (SET NULL) exatamente por isso.
--
-- Comprador, telefone e valores são pessoais: nada de leitura anônima.
create table if not exists public.sales (
  id              uuid primary key default gen_random_uuid(),
  motorcycle_id   uuid references public.motorcycles(id) on delete set null,
  marca           text not null,
  modelo          text not null,
  ano             integer not null,
  valor           numeric(12,2) not null check (valor >= 0),
  forma_pagamento text not null default 'outra',
  comprador       text,
  telefone        text,
  -- Custo de compra no dia da venda (para o lucro); null = sem custo.
  custo           numeric(12,2) check (custo is null or custo >= 0),
  vendida_em      timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. Entregas ("Sonhos realizados")
-- ------------------------------------------------------------
-- Cada linha é um post da Home, estilo mural fotográfico. O post
-- nasce de uma moto marcada como vendida (moto_id) ou é avulso
-- (moto_id nulo). `moto_nome` é a foto do nome na publicação: se a
-- moto sair do estoque, o post continua com o nome que foi ao ar.
create table if not exists public.entregas (
  id                     uuid primary key default gen_random_uuid(),
  moto_id                uuid references public.motorcycles (id) on delete set null,
  moto_nome              text not null default '',
  -- Array de caminhos no bucket privado 'entregas', na ordem de
  -- exibição do carrossel.
  fotos                  jsonb not null default '[]'::jsonb
                           check (jsonb_typeof(fotos) = 'array'),
  legenda                text,
  nome_cliente           text,
  entregue_em            date,
  autorizacao_publicacao boolean not null default false,
  status                 text not null default 'rascunho'
                           check (status in ('rascunho', 'publicada', 'arquivada')),
  ordem                  integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint entrega_publicada_autorizada check (
    status <> 'publicada'
    or (jsonb_array_length(fotos) >= 1 and autorizacao_publicacao)
  )
);

-- ------------------------------------------------------------
-- 6. Lixeira das fotos do mural
-- ------------------------------------------------------------
-- Apagar uma foto do mural não é definitivo no primeiro clique: o
-- arquivo fica guardado por 30 dias (mesmo prazo da lixeira do
-- estoque) até o dono restaurar ou apagar de vez. O caminho sai de
-- `entregas.fotos` e volta para lá na restauração (RPC na 03).
create table if not exists public.entregas_fotos_lixeira (
  id          uuid primary key default gen_random_uuid(),
  -- Some junto com a publicação: sem post de origem não há o que
  -- restaurar.
  entrega_id  uuid not null references public.entregas (id) on delete cascade,
  -- Caminho no bucket 'entregas' (pasta = id da publicação).
  caminho     text not null check (length(btrim(caminho)) > 0),
  apagada_em  timestamptz not null default now(),
  constraint entregas_fotos_lixeira_caminho_unico unique (entrega_id, caminho)
);

-- ------------------------------------------------------------
-- 7. Compatibilidade com bancos antigos
-- ------------------------------------------------------------
-- `create table if not exists` não altera tabela existente. Estes
-- blocos alinham bancos criados por uma versão incompleta do esquema
-- (sem `status`, sem `motorcycle_images`) sem apagar nada.

alter table public.motorcycles
  add column if not exists status text not null default 'disponivel';

alter table public.motorcycles
  add column if not exists em_promocao boolean not null default false;

alter table public.motorcycles
  add column if not exists preco_antes numeric(12,2)
  check (preco_antes is null or preco_antes >= 0);

alter table public.motorcycles
  add column if not exists custo_compra numeric(12,2)
  check (custo_compra is null or custo_compra >= 0);

alter table public.motorcycles
  add column if not exists lixeira_em timestamptz;

-- `add constraint` não tem "if not exists": cada bloco só cria a
-- constraint quando ela ainda não existir.
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

  if not exists (
    select 1 from pg_constraint
    where conname = 'motorcycles_promocao_coerente'
      and conrelid = 'public.motorcycles'::regclass
  ) then
    alter table public.motorcycles
      add constraint motorcycles_promocao_coerente
      check (not em_promocao or (preco_antes is not null and preco_antes > preco));
  end if;

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

-- Colunas aposentadas: `destaque` virou promoção de verdade
-- (em_promocao) e `categoria` era vocabulário de catálogo estrangeiro
-- que a loja nunca usou. O grant por coluna da 02 não precisa de
-- ajuste: o Postgres remove sozinho os privilégios de coluna apagada.
drop index if exists public.idx_motos_categoria;
drop index if exists public.idx_motos_destaque;

alter table public.motorcycles drop column if exists categoria;
alter table public.motorcycles drop column if exists destaque;

-- A publicação passou a ser só foto: o nome do modelo saiu do painel
-- (quem comprou já está em Vendidas). Posts novos gravam ''.
alter table public.entregas
  drop constraint if exists entregas_moto_nome_check;

-- ------------------------------------------------------------
-- 8. Índices
-- ------------------------------------------------------------
create index if not exists idx_motos_preco      on public.motorcycles (preco);
create index if not exists idx_motos_ano        on public.motorcycles (ano);
create index if not exists idx_motos_status     on public.motorcycles (status);
create index if not exists idx_motos_promocao   on public.motorcycles (em_promocao);

-- Busca textual por marca/modelo (usada pelo filtro do catálogo).
create index if not exists idx_motos_busca
  on public.motorcycles
  using gin (to_tsvector('portuguese', coalesce(marca,'') || ' ' || coalesce(modelo,'')));

create index if not exists idx_imagens_moto
  on public.motorcycle_images (motorcycle_id, posicao);

-- A lixeira só consulta linhas marcadas.
create index if not exists idx_motorcycles_lixeira_em
  on public.motorcycles (lixeira_em)
  where lixeira_em is not null;

create index if not exists idx_sales_vendida_em
  on public.sales (vendida_em desc);

create index if not exists idx_entregas_publicadas_ordem
  on public.entregas (ordem, entregue_em desc)
  where status = 'publicada';

create index if not exists idx_entregas_moto
  on public.entregas (moto_id)
  where moto_id is not null;

create index if not exists idx_entregas_fotos_lixeira_apagada_em
  on public.entregas_fotos_lixeira (apagada_em);

-- ------------------------------------------------------------
-- 9. updated_at automático
-- ------------------------------------------------------------
drop trigger if exists trg_motos_updated_at on public.motorcycles;
create trigger trg_motos_updated_at
  before update on public.motorcycles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_entregas_updated_at on public.entregas;
create trigger trg_entregas_updated_at
  before update on public.entregas
  for each row execute function public.touch_updated_at();

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

-- ============================================================
-- DG MOTOS — 04: DADOS INICIAIS (OPCIONAL)
-- ============================================================
-- Consolidado a partir das migrações 03, 04 (parte de fotos) e 05.
--
-- ATENÇÃO: as 5 motos abaixo são DADOS DE DEMONSTRAÇÃO, herdados do
-- site anterior. Preço, ano e descrição precisam ser confirmados pelo
-- proprietário antes de ir ao ar (ver docs/PENDENCIAS-CLIENTE.md).
--
-- Pode pular este arquivo e cadastrar as motos pelo painel /admin.
-- Se rodar depois de já ter estoque, nada muda: o bloco só insere
-- quando `motorcycles` está vazia. As fotos são ligadas por slug e só
-- entram quando a moto existe e ainda não tem aquela foto — reexecutar
-- não duplica.
--
-- Rodar depois da 01, 02 e 03. Idempotente.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Estoque de demonstração (só quando a tabela está vazia)
-- ------------------------------------------------------------
insert into public.motorcycles
  (slug, marca, modelo, ano, preco, quilometragem, cilindrada,
   descricao, especificacoes, em_promocao, preco_antes, status)
select * from (values
  ('honda-xre-300-2021','Honda','XRE 300',2021::int,31900::numeric,NULL::int,291::int,
   'Trail versátil para o dia a dia e para viagem: motor de um cilindro com boa resposta em baixa rotação, posição de pilotagem ereta e manutenção de custo previsível. Revisão e documentação em dia.',
   '[{"label":"Motor","value":"Mono OHC, 291,6 cc"},{"label":"Câmbio","value":"6 marchas"},{"label":"Freios","value":"ABS, disco nas duas rodas"},{"label":"Tanque","value":"16,7 L"}]'::jsonb,
   true,34900::numeric,'disponivel'),
  ('yamaha-lander-2024','Yamaha','Lander',2024::int,26900::numeric,NULL::int,250::int,
   'Lander 2024 com suspensão dianteira invertida e freios ABS — seminova de pouca estrada. Conforto para o uso urbano e segurança para viagens.',
   '[{"label":"Motor","value":"Mono 250 cc"},{"label":"Suspensão","value":"Dianteira invertida"},{"label":"Freios","value":"ABS, disco nas duas rodas"},{"label":"Tanque","value":"12 L"}]'::jsonb,
   true,29900::numeric,'disponivel'),
  ('honda-titan-2022','Honda','Titan',2022::int,16900::numeric,NULL::int,162::int,
   'A referência de rua no Brasil: econômica, robusta e com ótima aceitação na revenda. Ideal para o uso diário na cidade e para o trabalho.',
   '[{"label":"Motor","value":"Mono OHC 162,7 cc"},{"label":"Câmbio","value":"5 marchas"},{"label":"Freios","value":"Disco dianteiro, tambor traseiro"},{"label":"Tanque","value":"16,5 L"}]'::jsonb,
   true,18900::numeric,'disponivel'),
  ('honda-start-2024','Honda','CG 160 Start',2024::int,16900::numeric,NULL::int,162::int,
   'Porta de entrada da linha CG: partida elétrica, freio CBS e custo de uso baixíssimo. Simples de pilotar e fácil de manter.',
   '[{"label":"Motor","value":"Mono OHC 162,7 cc"},{"label":"Câmbio","value":"4 marchas"},{"label":"Freios","value":"CBS, tambores"},{"label":"Tanque","value":"16,5 L"}]'::jsonb,
   false,NULL::numeric,'disponivel'),
  ('yamaha-fazer-150-2020','Yamaha','Fazer 150',2020::int,13900::numeric,NULL::int,149::int,
   'Street econômica da Yamaha, confortável para o trajeto diário e barata de manter. Uma das opções mais equilibradas do mercado na faixa de 150 cc.',
   '[{"label":"Motor","value":"Mono 149,8 cc"},{"label":"Câmbio","value":"5 marchas"},{"label":"Freios","value":"Disco dianteiro, tambor traseiro"},{"label":"Tanque","value":"12,4 L"}]'::jsonb,
   false,NULL::numeric,'disponivel')
) as v(slug,marca,modelo,ano,preco,quilometragem,cilindrada,
       descricao,especificacoes,em_promocao,preco_antes,status)
where not exists (select 1 from public.motorcycles);

-- ------------------------------------------------------------
-- 2. Fotos das motos de demonstração
-- ------------------------------------------------------------
-- Ligadas por slug: funciona tanto para as motos recém-inseridas
-- quanto para bancos onde a moto já existia sem foto.
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

-- ------------------------------------------------------------
-- 3. Configuração global da loja
-- ------------------------------------------------------------
-- O dono ajusta pelo painel sem rebuild. Editar aqui só define o
-- estado inicial; `on conflict do nothing` preserva o que já existe.
insert into public.site_settings (key, value)
values (
  'loja',
  jsonb_build_object(
    'whatsapp', null,
    'instagramHandle', '@dgmotosbh',
    'instagramUrl', 'https://instagram.com/dgmotosbh',
    'telefoneExibicao', null,
    'enderecoRua', 'Av. Basílio da Gama, 139',
    'enderecoCidadeUf', 'Belo Horizonte, MG',
    'horarios', jsonb_build_array(
      jsonb_build_object('dias', 'Seg a Sex', 'horas', '9h–18h'),
      jsonb_build_object('dias', 'Sáb', 'horas', '9h–13h')
    )
  )
)
on conflict (key) do nothing;

