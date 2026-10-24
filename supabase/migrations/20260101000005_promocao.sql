-- ============================================================
-- 0005: promoção — em_promocao + preco_antes
--   O antigo "destaque" vira PROMOÇÃO de verdade: a moto marcada
--   ganha no site o selo circular de desconto e o preço "de → por",
--   e sai na frente na vitrine (Home e estoque em "Relevância").
--
--   preco_antes = o preço de referência ("de"), riscado no site.
--   preco       continua sendo o preço de venda ("por").
-- ============================================================

alter table public.motorcycles
  add column if not exists em_promocao boolean not null default false;

alter table public.motorcycles
  add column if not exists preco_antes numeric(12,2)
  check (preco_antes is null or preco_antes >= 0);

-- Regra do formulário: promoção ligada exige um "de" informado e maior
-- que o "por" (senão o desconto sai negativo no selo).

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'motorcycles_promocao_coerente'
      and conrelid = 'public.motorcycles'::regclass
  ) then
    alter table public.motorcycles
      add constraint motorcycles_promocao_coerente
      check (
        not em_promocao
        or (preco_antes is not null and preco_antes > preco)
      );
  end if;
end $$;

create index if not exists idx_motos_promocao on public.motorcycles (em_promocao);

-- Aposenta a coluna antiga: nenhum dado real era guardado nela além do
-- ajuste de ordem, que agora é responsabilidade de em_promocao.
alter table public.motorcycles drop column if exists destaque;
drop index if exists public.idx_motos_destaque;
