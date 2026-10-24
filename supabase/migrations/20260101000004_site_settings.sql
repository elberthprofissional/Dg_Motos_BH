-- ============================================================
-- DG MOTOS — Migração 0004: configurações globais da loja
-- ============================================================
-- Permite que o dono altere WhatsApp, Instagram, endereço e horários
-- sem precisar fazer rebuild. O site lê do banco (com fallback para
-- src/data/site.ts e localStorage para compatibilidade).
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