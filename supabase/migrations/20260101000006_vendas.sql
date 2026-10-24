-- ============================================================
-- 0006: VENDAS
--   Registrar a venda no dia em que ela acontece: quando o dono
--   marca uma moto como "vendida" no painel, o painel pergunta
--   quem comprou, como pagou e por quanto. A aba "Vendas" do
--   painel lista o histórico e soma o lucro.
--
--   Dados do comprador são pessoais: nada de leitura anônima.
--   O site público NÃO lê nada desta tabela.
--
--   A venda guarda uma FOTO DOS DADOS da moto na hora (marca,
--   modelo, ano, custo de compra e valor fechado): se a moto for
--   excluída do catálogo depois, o histórico de vendas continua
--   íntegro. O vínculo (motorcycle_id) é solto (SET NULL)
--   exatamente porque o histórico não depende dele para existir.
-- ============================================================

alter table public.motorcycles
  add column if not exists custo_compra numeric(12,2)
  check (custo_compra is null or custo_compra >= 0);

create table if not exists public.sales (
  id             uuid primary key default gen_random_uuid(),
  motorcycle_id  uuid references public.motorcycles(id) on delete set null,
  -- foto dos dados da moto na hora da venda
  marca          text not null,
  modelo         text not null,
  ano            integer not null,
  -- o fechamento
  valor          numeric(12,2) not null check (valor >= 0),
  forma_pagamento text not null default 'outra',
  -- comprador (opcional)
  comprador      text,
  telefone       text,
  -- custo de compra no dia da venda (para o lucro); null = sem custo
  custo          numeric(12,2) check (custo is null or custo >= 0),
  vendida_em     timestamptz not null default now(),

  created_at     timestamptz not null default now()
);

create index if not exists idx_sales_vendida_em
  on public.sales (vendida_em desc);

alter table public.sales enable row level security;

-- Sales é a única tabela SEM política para anon: comprador, telefone e
-- valores negociais ficam só no painel autenticado.
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
