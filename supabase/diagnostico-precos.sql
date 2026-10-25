-- ============================================================
-- DIAGNÓSTICO — PREÇOS PROVAVELMENTE DIGITADOS PELA METADE
-- ============================================================
-- O campo antigo de preço era numérico e convertia "23.000" em 23.
-- Este script apenas LISTA as motos suspeitas; revise uma a uma no
-- painel (Estoque > Editar) antes de qualquer alteração em massa.
-- Não toca em `sales` nem em qualquer histórico financeiro.

-- 1. Motos anunciadas por menos de R$ 1.000 (inclui zero/negativo).
select
  id,
  marca,
  modelo,
  ano,
  preco,
  preco_antes,
  em_promocao,
  status,
  updated_at
from public.motorcycles
where preco < 1000
order by preco asc, updated_at desc;

-- 2. Preço promocional "de" também suspeito.
select
  id,
  marca,
  modelo,
  ano,
  preco,
  preco_antes,
  status,
  updated_at
from public.motorcycles
where preco_antes is not null
  and preco_antes < 1000
order by preco_antes asc;

-- 3. Depois de conferir cada ficha no painel, se ainda restar alguma
--    correção em massa, descomente e ajuste os valores manualmente.
--    Exemplo: multiplicar por 1.000 somente as motos de uma lista.
--
-- update public.motorcycles
-- set preco = preco * 1000,
--     preco_antes = case when preco_antes is not null then preco_antes * 1000 end,
--     updated_at = now()
-- where id in ('COLE-O-ID-AQUI', 'COLE-O-ID-AQUI');
