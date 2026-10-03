-- ============================================================
-- DG MOTOS — esquema do banco
-- ============================================================
-- Como usar (leva uns 3 minutos):
--   1. Crie o projeto em https://supabase.com/dashboard
--   2. Abra o SQL Editor (ícone de Terminal / "SQL" no menu lateral)
--   3. Cole ESTE ARQUIVO INTEIRO e clique em "Run"
--   4. Vá em Authentication -> Users -> "Add user" e cadastre o dono
--      (o e-mail e a senha que ele usará para entrar em /admin)
--
-- Pode rodar tudo de novo sem quebrar: o script é idempotente.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Funções de "atualizado em"
-- ------------------------------------------------------------
-- IMPORTANTE: precisam existir ANTES de qualquer `create trigger`,
-- porque o Postgres valida a função já no momento em que o trigger
-- é criado. Criar o trigger antes da função quebra o script com:
--   ERROR: function public.touch_atualizado_em() does not exist

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Para a config (que não tem coluna updated_at, usa atualizado_em):
create or replace function public.touch_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 1. Tabela de catálogo
-- ------------------------------------------------------------
create table if not exists public.motorcycles (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  marca          text not null,
  modelo         text not null,
  ano            int  not null check (ano between 1980 and 2100),
  preco          numeric(12,2) not null check (preco >= 0),
  quilometragem  int check (quilometragem is null or quilometragem >= 0),
  cilindrada     int check (cilindrada is null or cilindrada > 0),
  categoria      text not null default 'Street'
                   check (categoria in ('Street','Trail','Naked','Scooter','Esportiva','Custom')),
  descricao      text not null default '',
  especificacoes  jsonb not null default '[]'::jsonb,
  imagens        jsonb not null default '[]'::jsonb,
  destaque       boolean not null default false,
  disponibilidade text not null default 'disponivel'
                   check (disponibilidade in ('disponivel','reservada','vendida')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Índices para os filtros da página /estoque
create index if not exists idx_motos_preco      on public.motorcycles (preco);
create index if not exists idx_motos_ano        on public.motorcycles (ano);
create index if not exists idx_motos_categoria  on public.motorcycles (categoria);
create index if not exists idx_motos_disponivel on public.motorcycles (disponibilidade);

-- Busca textual por marca/modelo
create index if not exists idx_motos_busca
  on public.motorcycles
  using gin (to_tsvector('portuguese', coalesce(marca,'') || ' ' || coalesce(modelo,'')));

-- updated_at automático do catálogo
drop trigger if exists trg_motos_updated_at on public.motorcycles;
create trigger trg_motos_updated_at
  before update on public.motorcycles
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- 1b. Configuração da loja (WhatsApp, Instagram, endereço...)
-- ------------------------------------------------------------
-- Uma linha só (id fixo = 1), editável pelo dono em /admin ->
-- Configurações. Enquanto não existir, o site usa os defaults
-- de src/data/site.ts.
create table if not exists public.config_loja (
  id            int primary key default 1 check (id = 1),
  whatsapp      text,
  instagram_handle text,
  instagram_url    text,
  telefone_exibicao text,
  endereco_rua   text,
  endereco_cidade_uf text,
  maps_url       text,
  horarios       jsonb not null default '[]'::jsonb,
  financiamento  jsonb not null default '{}'::jsonb,
  atualizado_em  timestamptz not null default now()
);

-- updated_at automático (usa atualizado_em na config)
drop trigger if exists trg_config_updated_at on public.config_loja;
drop trigger if exists trg_config_atualizado_em on public.config_loja;
create trigger trg_config_atualizado_em
  before update on public.config_loja
  for each row execute function public.touch_atualizado_em();

-- Migração para bases antigas: a coluna `financiamento` (conteúdo editável
-- da página /financiamento) não existia nas versões anteriores.
alter table public.config_loja add column if not exists financiamento jsonb not null default '{}'::jsonb;

-- ------------------------------------------------------------
-- 2. Tabela de leads (financiamento e troca)
-- ------------------------------------------------------------
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('financiamento','troca')),
  nome        text not null,
  telefone    text not null,
  -- Payload livre do formulário, para evoluir sem migrar a cada campo novo
  dados       jsonb not null default '{}'::jsonb,
  -- Página de origem, para saber de onde veio o lead
  origem      text,
  criado_em   timestamptz not null default now(),
  -- Mini-CRM: acompanhamento do dono (editáveis só pelo painel)
  status      text not null default 'novo'
              check (status in ('novo','negociando','fechado','nao_fechou')),
  nota        text not null default ''
);

create index if not exists idx_leads_criado_em on public.leads (criado_em desc);

-- ------------------------------------------------------------
-- 3. Row Level Security — a parte que realmente protege o banco
-- ------------------------------------------------------------
-- RLS SEM estas políticas = banco aberto para o mundo inteiro usando a
-- anon key (que está embutida no JavaScript do site). Não pule esta seção.
--
--   Leitura do catálogo .... liberada para todos (o site precisa)
--   Escrita no catálogo .... só usuário logado (o dono)
--   Inserir lead ........... liberada (o visitante preenche o formulário)
--   Ler leads .............. só usuário logado (o dono)

alter table public.motorcycles enable row level security;
alter table public.leads       enable row level security;
alter table public.config_loja enable row level security;

-- ------------------------------------------------------------
-- 3b. Migrações para bases antigas (o script pode rodar de novo)
-- ------------------------------------------------------------
-- Status do mini-CRM dos leads (ex.: 'fechado' vira ação no painel).
alter table public.leads
  add column if not exists status text not null default 'novo';
alter table public.leads
  add column if not exists nota text not null default '';

-- Preço que a loja PAGOU na moto e quando foi vendida: é o que
-- permite ao painel calcular lucro e tempo médio de venda.
alter table public.motorcycles
  add column if not exists preco_compra numeric(12,2) check (preco_compra is null or preco_compra >= 0);
alter table public.motorcycles
  add column if not exists vendido_em timestamptz;

-- --- Leituras públicas ---------------------------------------------------
drop policy if exists "catalogo publico" on public.motorcycles;
create policy "catalogo publico"
  on public.motorcycles for select
  to anon, authenticated
  using (true);

drop policy if exists "config publica" on public.config_loja;
create policy "config publica"
  on public.config_loja for select
  to anon, authenticated
  using (true);

-- --- Escritas só para o dono logado -------------------------------------
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

-- Config: o dono insere (primeira vez) e altera
drop policy if exists "dono insere config" on public.config_loja;
create policy "dono insere config"
  on public.config_loja for insert
  to authenticated
  with check (true);

drop policy if exists "dono altera config" on public.config_loja;
create policy "dono altera config"
  on public.config_loja for update
  to authenticated
  using (true)
  with check (true);

-- --- Leads: o visitante insere, o dono lê ---------------------------------
drop policy if exists "visitante cria lead" on public.leads;
create policy "visitante cria lead"
  on public.leads for insert
  to anon, authenticated
  with check (true);

drop policy if exists "dono le leads" on public.leads;
create policy "dono le leads"
  on public.leads for select
  to authenticated
  using (true);

-- Nenhuma policy de update/delete em leads: Leads são históricos.
-- Para apagar um lead é preciso entrar no SQL Editor.

-- ------------------------------------------------------------
-- 4. Storage para as fotos
-- ------------------------------------------------------------
-- Bucket público: as imagens precisam ser servidas direto no <img>
-- do site, sem passar por autenticação.
insert into storage.buckets (id, name, public)
values ('motos', 'motos', true)
on conflict (id) do nothing;

-- Leitura pública das fotos
drop policy if exists "fotos publicas" on storage.objects;
create policy "fotos publicas"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'motos');

-- Upload e remoção só pelo dono logado
drop policy if exists "dono sobe foto" on storage.objects;
create policy "dono sobe foto"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'motos');

-- O uploader do /admin sobe com upsert=true. Sem esta policy, trocar a
-- foto mantendo o mesmo nome falha com "new row violates row-level
-- security policy" em vez de substituir o arquivo.
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

-- ------------------------------------------------------------
-- 6. Estoque inicial (os 5 registros atuais)
-- ------------------------------------------------------------
-- Só entra se a tabela estiver vazia, então rodar de novo não duplica.
insert into public.motorcycles
  (slug, marca, modelo, ano, preco, quilometragem, cilindrada,
   categoria, descricao, especificacoes, imagens, destaque, disponibilidade)
select * from (values
  ('honda-xre-300-2021','Honda','XRE 300',2021::int,31900::numeric,NULL::int,291::int,'Trail',
   'Trail versátil para o dia a dia e para viagem: motor de um cilindro com boa resposta em baixa rotação, posição de pilotagem ereta e manutenção de custo previsível. Revisão e documentação em dia.',
   '[{"label":"Motor","value":"Mono OHc, 291,6 cc"},{"label":"Câmbio","value":"6 marchas"},{"label":"Freios","value":"ABS, disco nas duas rodas"},{"label":"Tanque","value":"16,7 L"}]'::jsonb,
   '[{"src":"/motos/honda-xre-300-2021/01.webp","alt":"Honda XRE 300 2021 — vista frontal"},{"src":"/motos/honda-xre-300-2021/02.webp","alt":"Honda XRE 300 2021 — vista lateral"},{"src":"/motos/honda-xre-300-2021/03.webp","alt":"Honda XRE 300 2021 — painel"}]'::jsonb,
   true,'disponivel'),

  ('yamaha-lander-2024','Yamaha','Lander',2024::int,26900::numeric,NULL::int,250::int,'Trail',
   'Lander 2024 com suspensão dianteira invertida e freios ABS — seminova de pouca estrada. Conforto para o uso urbano e segurança para viagens.',
   '[{"label":"Motor","value":"Mono 250 cc"},{"label":"Suspensão","value":"Dianteira invertida"},{"label":"Freios","value":"ABS, disco nas duas rodas"},{"label":"Tanque","value":"12 L"}]'::jsonb,
   '[{"src":"/motos/yamaha-lander-2024/01.webp","alt":"Yamaha Lander 2024 — vista frontal"},{"src":"/motos/yamaha-lander-2024/02.webp","alt":"Yamaha Lander 2024 — vista lateral"},{"src":"/motos/yamaha-lander-2024/03.webp","alt":"Yamaha Lander 2024 — detalhe"}]'::jsonb,
   true,'disponivel'),

  ('honda-titan-2022','Honda','Titan',2022::int,16900::numeric,NULL::int,162::int,'Street',
   'A referência de rua no Brasil: econômica, robusta e com ótima aceitação na revenda. Ideal para o uso diário na cidade e para o trabalho.',
   '[{"label":"Motor","value":"Mono OHC 162,7 cc"},{"label":"Câmbio","value":"5 marchas"},{"label":"Freios","value":"Disco dianteiro, tambor traseiro"},{"label":"Tanque","value":"16,5 L"}]'::jsonb,
   '[{"src":"/motos/honda-titan-2022/01.webp","alt":"Honda Titan 2022 — vista frontal"},{"src":"/motos/honda-titan-2022/02.webp","alt":"Honda Titan 2022 — vista lateral"},{"src":"/motos/honda-titan-2022/03.webp","alt":"Honda Titan 2022 — detalhe"}]'::jsonb,
   true,'disponivel'),

  ('honda-start-2024','Honda','CG 160 Start',2024::int,16900::numeric,NULL::int,162::int,'Street',
   'Porta de entrada da linha CG: partida elétrica, freio CBS e custo de uso baixíssimo. Simples de pilotar e fácil de manter.',
   '[{"label":"Motor","value":"Mono OHC 162,7 cc"},{"label":"Câmbio","value":"4 marchas"},{"label":"Freios","value":"CBS, tambores"},{"label":"Tanque","value":"16,5 L"}]'::jsonb,
   '[{"src":"/motos/honda-start-2024/01.webp","alt":"Honda CG 160 Start 2024 — vista frontal"},{"src":"/motos/honda-start-2024/02.webp","alt":"Honda CG 160 Start 2024 — vista lateral"},{"src":"/motos/honda-start-2024/03.webp","alt":"Honda CG 160 Start 2024 — detalhe"}]'::jsonb,
   false,'disponivel'),

  ('yamaha-fazer-150-2020','Yamaha','Fazer 150',2020::int,13900::numeric,NULL::int,149::int,'Street',
   'Street econômica da Yamaha, confortável para o trajeto diário e barata de manter. Uma das opções mais equilibradas do mercado na faixa de 150 cc.',
   '[{"label":"Motor","value":"Mono 149,8 cc"},{"label":"Câmbio","value":"5 marchas"},{"label":"Freios","value":"Disco dianteiro, tambor traseiro"},{"label":"Tanque","value":"12,4 L"}]'::jsonb,
   '[{"src":"/motos/yamaha-fazer-150-2020/01.webp","alt":"Yamaha Fazer 150 2020 — vista frontal"},{"src":"/motos/yamaha-fazer-150-2020/02.webp","alt":"Yamaha Fazer 150 2020 — vista lateral"},{"src":"/motos/yamaha-fazer-150-2020/03.webp","alt":"Yamaha Fazer 150 2020 — detalhe"}]'::jsonb,
   false,'disponivel')
) as v(slug,marca,modelo,ano,preco,quilometragem,cilindrada,categoria,descricao,especificacoes,imagens,destaque,disponibilidade)
where not exists (select 1 from public.motorcycles);

-- ============================================================
-- PRONTO. Checklist:
--   [ ] Authentication -> Users -> Add user (criar o login do dono)
--   [ ] Copiar Project URL e a publishable key para o .env
--   [ ] Testar em /admin
-- ============================================================
