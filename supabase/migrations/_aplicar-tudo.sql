-- ============================================================
-- DG MOTOS — aplicar todas as migrações de uma vez
-- ============================================================
-- Ordem: 0000 init · 0001 RLS/Storage · 0002 demo · 0003 correção ·
--         0004 site_settings · 0005 promoção.
-- O bloco de demo é opcional — cria 5 motos de demonstração.
-- O bloco final conserta banco que já tinha uma tabela `motorcycles`
-- incompleta e cria a config global da loja (site_settings).
-- ============================================================

-- ============================================================
-- 0001: estrutura do catálogo
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
-- 0002: RLS e Storage
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
-- 0003: estoque de demonstração (OPCIONAL)
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
-- 0004: correção de banco incompleto (ver arquivo dedicado)
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
-- 0004: configurações globais da loja (site_settings)
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
-- 0005: promoção — em_promocao + preco_antes (ver arquivo dedicado)
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
