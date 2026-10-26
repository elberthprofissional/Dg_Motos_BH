-- ============================================================
-- 10: EDIÇÃO DE VENDAS
--
--   Até aqui o painel só inseria e apagava vendas: a política de
--   `sales` não tinha `update`, então corrigir o nome ou o telefone
--   de quem comprou era recusado pelo banco.
--
--   Agora a ficha da venda pode ser corrigida depois de lançada
--   (aba Vendidas → clicar em "Comprou…"), e a venda se desvincula
--   da moto quando ela volta pro pátio — o registro continua no
--   histórico com a foto dos dados do dia, só sem apontar para a
--   moto que está à venda de novo.
--
--   Nada muda para o site: `sales` continua SEM política para anon.
--   Comprador, telefone e valores siguem saindo só do painel.
-- ============================================================

drop policy if exists "sales_dono_atualiza" on public.sales;

create policy "sales_dono_atualiza"
  on public.sales for update
  to authenticated
  using (true)
  with check (true);
