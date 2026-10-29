-- ============================================================
-- DG MOTOS — aplicar todas as migrações de uma vez
-- ============================================================
-- Ordem (mesma dos arquivos numerados):
--   01 cria_esquema_inicial · 02 seguranca_rls_e_storage ·
--   03 dados_iniciais_estoque · 04 corrige_estrutura_estoque ·
--   05 configuracoes_da_loja · 06 promocoes_do_estoque ·
--   07 registro_de_vendas · 08 publicacoes_de_entregas ·
--   09 lixeira_do_estoque · 10 edicao_de_vendas ·
--   11 seguranca_e_transacoes (admins, grants de coluna e RPCs) ·
--   12 seguranca_site_settings (leitura do site_settings por papel).
-- O bloco de demo é opcional — cria 5 motos de demonstração.
-- O bloco final conserta banco que já tinha uma tabela `motorcycles`
-- incompleta e cria a config global da loja (site_settings).
-- ============================================================

-- ============================================================
-- 01: estrutura do catálogo (cria_esquema_inicial)
--   motorcycles       → a moto (dados comerciais e técnicos)
--   motorcycle_images → relação 1:N das fotos, com ordem (posicao)
-- ============================================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
  categoria      text not null default 'Street'
                   check (categoria in ('Street','Trail','Naked','Scooter','Esportiva','Custom')),
  descricao      text not null default '',
  especificacoes jsonb not null default '[]'::jsonb,
  -- Promoção: "de → por" na vitrine. preco_antes é o preço de referência
  -- (riscado no site); preco continua sendo o preço de venda.
  em_promocao    boolean not null default false,
  preco_antes    numeric(12,2)
                   check (preco_antes is null or preco_antes >= 0),
  status         text not null default 'disponivel'
                   check (status in ('disponivel','vendida','indisponivel')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint motorcycles_marca_nao_vazia  check (length(btrim(marca))  > 0),
  constraint motorcycles_modelo_nao_vazio check (length(btrim(modelo)) > 0),
  constraint motorcycles_slug_nao_vazio   check (length(btrim(slug))   > 0)
);

create table if not exists public.motorcycle_images (
  id            uuid primary key default gen_random_uuid(),
  motorcycle_id uuid not null references public.motorcycles(id) on delete cascade,
  src           text not null,
  alt           text not null default '',
  posicao       int  not null default 0,
  created_at    timestamptz not null default now(),
  constraint motorcycle_images_src_nao_vazio check (length(btrim(src)) > 0)
);

create index if not exists idx_motos_preco       on public.motorcycles (preco);
create index if not exists idx_motos_ano         on public.motorcycles (ano);
create index if not exists idx_motos_categoria   on public.motorcycles (categoria);
create index if not exists idx_motos_status      on public.motorcycles (status);
create index if not exists idx_motos_promocao  on public.motorcycles (em_promocao);

create index if not exists idx_motos_busca
  on public.motorcycles
  using gin (to_tsvector('portuguese', coalesce(marca,'') || ' ' || coalesce(modelo,'')));

create index if not exists idx_imagens_moto
  on public.motorcycle_images (motorcycle_id, posicao);

drop trigger if exists trg_motos_updated_at on public.motorcycles;
create trigger trg_motos_updated_at
  before update on public.motorcycles
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 02: RLS e Storage (seguranca_rls_e_storage)
--   Leitura do catálogo ...... liberada (a vitrine precisa)
--   Escrita no catálogo ...... apenas usuário autenticado (o dono)
--   Upload/remoção de foto ... apenas usuário autenticado
-- ============================================================

alter table public.motorcycles       enable row level security;
alter table public.motorcycle_images enable row level security;

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

-- Bucket público 'motos': as imagens são servidas direto no <img>.
insert into storage.buckets (id, name, public)
values ('motos', 'motos', true)
on conflict (id) do nothing;

drop policy if exists "fotos publicas" on storage.objects;
create policy "fotos publicas"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'motos');

drop policy if exists "dono sobe foto" on storage.objects;
create policy "dono sobe foto"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'motos');

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

-- ============================================================
-- 03: estoque de demonstração (dados_iniciais_estoque — OPCIONAL)
--   5 motos de demonstração. Preço/ano/descrição precisam ser
--   confirmados pelo proprietário (ver docs/PENDENCIAS-CLIENTE.md).
--   Só insere quando a tabela está vazia.
-- ============================================================

with novas as (
  insert into public.motorcycles
    (slug, marca, modelo, ano, preco, quilometragem, cilindrada,
     categoria, descricao, especificacoes, em_promocao, preco_antes, status)
  select * from (values
    ('honda-xre-300-2021','Honda','XRE 300',2021::int,31900::numeric,NULL::int,291::int,'Trail',
     'Trail versátil para o dia a dia e para viagem: motor de um cilindro com boa resposta em baixa rotação, posição de pilotagem ereta e manutenção de custo previsível. Revisão e documentação em dia.',
     '[{"label":"Motor","value":"Mono OHC, 291,6 cc"},{"label":"Câmbio","value":"6 marchas"},{"label":"Freios","value":"ABS, disco nas duas rodas"},{"label":"Tanque","value":"16,7 L"}]'::jsonb,
     true,34900::numeric,'disponivel'),
    ('yamaha-lander-2024','Yamaha','Lander',2024::int,26900::numeric,NULL::int,250::int,'Trail',
     'Lander 2024 com suspensão dianteira invertida e freios ABS — seminova de pouca estrada. Conforto para o uso urbano e segurança para viagens.',
     '[{"label":"Motor","value":"Mono 250 cc"},{"label":"Suspensão","value":"Dianteira invertida"},{"label":"Freios","value":"ABS, disco nas duas rodas"},{"label":"Tanque","value":"12 L"}]'::jsonb,
     true,29900::numeric,'disponivel'),
    ('honda-titan-2022','Honda','Titan',2022::int,16900::numeric,NULL::int,162::int,'Street',
     'A referência de rua no Brasil: econômica, robusta e com ótima aceitação na revenda. Ideal para o uso diário na cidade e para o trabalho.',
     '[{"label":"Motor","value":"Mono OHC 162,7 cc"},{"label":"Câmbio","value":"5 marchas"},{"label":"Freios","value":"Disco dianteiro, tambor traseiro"},{"label":"Tanque","value":"16,5 L"}]'::jsonb,
     true,18900::numeric,'disponivel'),
    ('honda-start-2024','Honda','CG 160 Start',2024::int,16900::numeric,NULL::int,162::int,'Street',
     'Porta de entrada da linha CG: partida elétrica, freio CBS e custo de uso baixíssimo. Simples de pilotar e fácil de manter.',
     '[{"label":"Motor","value":"Mono OHC 162,7 cc"},{"label":"Câmbio","value":"4 marchas"},{"label":"Freios","value":"CBS, tambores"},{"label":"Tanque","value":"16,5 L"}]'::jsonb,
     false,NULL::numeric,'disponivel'),
    ('yamaha-fazer-150-2020','Yamaha','Fazer 150',2020::int,13900::numeric,NULL::int,149::int,'Street',
     'Street econômica da Yamaha, confortável para o trajeto diário e barata de manter. Uma das opções mais equilibradas do mercado na faixa de 150 cc.',
     '[{"label":"Motor","value":"Mono 149,8 cc"},{"label":"Câmbio","value":"5 marchas"},{"label":"Freios","value":"Disco dianteiro, tambor traseiro"},{"label":"Tanque","value":"12,4 L"}]'::jsonb,
     false,NULL::numeric,'disponivel')
  ) as v(slug,marca,modelo,ano,preco,quilometragem,cilindrada,categoria,descricao,especificacoes,em_promocao,preco_antes,status)
  where not exists (select 1 from public.motorcycles)
  returning id, slug
)
insert into public.motorcycle_images (motorcycle_id, src, alt, posicao)
select n.id, img.src, img.alt, img.posicao
from novas n
join (values
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
) as img(slug, src, alt, posicao) on img.slug = n.slug;

-- ============================================================
-- 04: correção de banco incompleto (corrige_estrutura_estoque)
-- ============================================================
-- Se `motorcycles` já existia sem a coluna `status` (create table if not
-- exists não altera tabela existente) e/ou `motorcycle_images` não existia,
-- as linhas abaixo consertam sem apagar dados.

alter table public.motorcycles
  add column if not exists status text not null default 'disponivel';

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
end $$;

create index if not exists idx_motos_status on public.motorcycles (status);

do $$
begin
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

-- ============================================================
-- 05: configurações globais da loja (configuracoes_da_loja)
--   WhatsApp, Instagram, endereço e horários editáveis pelo dono
--   em /admin → Configurações, sem rebuild. A vitrine lê daqui
--   (src/lib/configLoja.ts) com fallback para src/data/site.ts.
-- ============================================================

create table if not exists public.site_settings (
  id        uuid primary key default gen_random_uuid(),
  key       text not null unique,
  value     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

alter table public.site_settings enable row level security;

-- Leitura pública (vitrine precisa)
drop policy if exists "site_settings_publico" on public.site_settings;
create policy "site_settings_publico"
  on public.site_settings for select
  to anon, authenticated
  using (true);

-- Escrita apenas para o dono autenticado
drop policy if exists "site_settings_dono_insere" on public.site_settings;
create policy "site_settings_dono_insere"
  on public.site_settings for insert
  to authenticated
  with check (true);

drop policy if exists "site_settings_dono_altera" on public.site_settings;
create policy "site_settings_dono_altera"
  on public.site_settings for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "site_settings_dono_remove" on public.site_settings;
create policy "site_settings_dono_remove"
  on public.site_settings for delete
  to authenticated
  using (true);

-- Chave única para as configurações da loja
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

-- ============================================================
-- 06: promoção — em_promocao + preco_antes (promocoes_do_estoque)
--   O antigo "destaque" vira promoção: selo de desconto e preço
--   "de → por" no site, e a moto sai na frente da vitrine.
-- ============================================================

alter table public.motorcycles
  add column if not exists em_promocao boolean not null default false;

alter table public.motorcycles
  add column if not exists preco_antes numeric(12,2)
  check (preco_antes is null or preco_antes >= 0);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'motorcycles_promocao_coerente'
      and conrelid = 'public.motorcycles'::regclass
  ) then
    alter table public.motorcycles
      add constraint motorcycles_promocao_coerente
      check (not em_promocao or (preco_antes is not null and preco_antes > preco));
  end if;
end $$;

create index if not exists idx_motos_promocao on public.motorcycles (em_promocao);

alter table public.motorcycles drop column if exists destaque;
drop index if exists public.idx_motos_destaque;

-- ============================================================
-- 07: vendas — histórico de vendas + custo de compra (registro_de_vendas).
--   Quando o dono marca uma
--   moto como vendida, o painel registra quem comprou, como pagou
--   e por quanto; a aba "Vendas" lista e soma o lucro.
-- ============================================================

alter table public.motorcycles
  add column if not exists custo_compra numeric(12,2)
  check (custo_compra is null or custo_compra >= 0);

create table if not exists public.sales (
  id             uuid primary key default gen_random_uuid(),
  motorcycle_id  uuid references public.motorcycles(id) on delete set null,
  marca          text not null,
  modelo         text not null,
  ano            integer not null,
  valor          numeric(12,2) not null check (valor >= 0),
  forma_pagamento text not null default 'outra',
  comprador      text,
  telefone       text,
  custo          numeric(12,2) check (custo is null or custo >= 0),
  vendida_em     timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create index if not exists idx_sales_vendida_em
  on public.sales (vendida_em desc);

alter table public.sales enable row level security;

drop policy if exists "sales_dono_le" on public.sales;
create policy "sales_dono_le"
  on public.sales for select
  to authenticated
  using (true);

drop policy if exists "sales_dono_insere" on public.sales;
create policy "sales_dono_insere"
  on public.sales for insert
  to authenticated
  with check (true);

drop policy if exists "sales_dono_remove" on public.sales;
create policy "sales_dono_remove"
  on public.sales for delete
  to authenticated
  using (true);

-- ============================================================
-- 08: entregas e publicações da Home (publicacoes_de_entregas)
-- ============================================================

create table if not exists public.entregas (
  id uuid primary key default gen_random_uuid(),
  moto_id uuid references public.motorcycles (id) on delete set null,
  moto_nome text not null check (length(btrim(moto_nome)) > 0),
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

-- ============================================================
-- 09: lixeira do estoque (lixeira_do_estoque)
-- ============================================================
-- Excluir passa a ser reversível: a moto sai da vitrine e do pátio,
-- mas fica no painel até restaurar ou apagar de vez.

alter table public.motorcycles
  add column if not exists lixeira_em timestamptz;

comment on column public.motorcycles.lixeira_em is
  'Quando a moto foi movida para a lixeira. NULL = ativa no painel.';

create index if not exists idx_motorcycles_lixeira_em
  on public.motorcycles (lixeira_em)
  where lixeira_em is not null;

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

-- ============================================================
-- 10: EDIÇÃO DE VENDAS
-- ============================================================
drop policy if exists "sales_dono_atualiza" on public.sales;
create policy "sales_dono_atualiza"
  on public.sales for update
  to authenticated
  using (true)
  with check (true);


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
-- ============================================================

-- A política da 05 saiu como estava: SELECT para anon E
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
-- explícito nos grants. Os grants de SELECT da vitrine ficam intactos.
revoke insert, update, delete, truncate
  on all tables in schema public
  from anon;

-- Relatório ao aplicar: quantos admins existem.
do $$
declare
  n integer;
begin
  select count(*) into n from public.admins;
  raise notice
    'DG MOTOS 12: % administrador(es) em public.admins — se algum não for da loja, delete a linha (ver supabase/README.md).',
    n;
end $$;
