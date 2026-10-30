-- ============================================================
-- AJUSTES DE CATÁLOGO — nomes de modelo e slugs
-- Data: 30/10/2026
-- ============================================================
-- Como aplicar: cole este arquivo inteiro no SQL Editor do
-- Supabase e rode UMA vez. Tudo roda numa transação: ou aplica
-- tudo, ou não aplica nada.
--
-- Depois de rodar, é preciso um deploy (push para o GitHub):
-- os HTMLs das fichas e o sitemap são gerados no build, então
-- as URLs novas só existem no ar depois da reconstrução.
-- Enquanto isso, os redirects de `vercel.json` e de
-- `public/_redirects` seguram os links antigos.
--
-- Por que slugs e nomes mudam aqui e não no painel: o painel
-- regenera slug só na criação (mantém o antigo ao editar, para
-- não perder a URL). Renomear à mão nos dois lados seria
-- trabalho duplicado e sujeito a erro de digitação.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- PARTE 1 — nomes de modelo
-- Só corrigem maiúscula e espaço. Nenhuma URL muda: o painel
-- mantém o slug salvo quando o dono edita uma moto.
-- O `where` aponta pelo slug, que é único — impossível acertar
-- a moto errada.
-- ------------------------------------------------------------
update public.motorcycles set modelo = 'Sahara 300'
  where slug = 'honda-sahara-300-2025';

update public.motorcycles set modelo = 'Start'
  where slug = 'honda-start-2024-2';

update public.motorcycles set modelo = 'Factor 150'
  where slug = 'yamaha-factor150-2025';

-- A cor no nome é o que distingue esta XRE 300 de 2017 da outra
-- de 2017, que já se chama "XRE 300". Só entra a maiúscula.
update public.motorcycles set modelo = 'XRE 300 Verde'
  where slug = 'honda-xre-300-preta-2018';

-- O ano já aparece embaixo do nome no card; no nome ele só
-- repetia — e o slug antigo (…-2022-2022) nem era o ano real.
update public.motorcycles set modelo = 'Titan'
  where slug = 'honda-titan-2022-2022';

-- ------------------------------------------------------------
-- PARTE 2 — slugs
-- Trocar slug muda a URL da ficha. Por isso:
--   1. cada troca primeiro confere se o slug de destino está
--      livre — se estiver ocupado, o `raise exception` aborta
--      a transação inteira e nada muda;
--   2. os redirects correspondentes já estão em `vercel.json`
--      (produção) e em `public/_redirects` (Netlify e
--      Cloudflare), para o link antigo não virar 404.
-- As pares `de → para` ficam numa tabela VALUES percorrida por
-- cursor: mais legível que array bidimensional, que o FOREACH
-- do PL/pgSQL nem aceita sem SLICE.
-- ------------------------------------------------------------
do $$
declare
  reg     record;
  ocupado text;
begin
  for reg in
    select * from (values
      ('honda-start-2024-2',       'honda-start-2024'),
      ('honda-titan-2022-2022',    'honda-titan-2024'),
      ('honda-xre-300-preta-2018', 'honda-xre-300-verde-2017'),
      ('yamaha-fezer-2024',        'yamaha-fazer-2024')
    ) as t(de, para)
  loop
    -- Vistoria: destino precisa estar livre antes de qualquer troca.
    select slug into ocupado from public.motorcycles where slug = reg.para;
    if ocupado is not null then
      raise exception 'Slug de destino ocupado: "%" já existe. Nada foi alterado.', reg.para;
    end if;

    -- Troca. `motorcycle_images` liga por motorcycle_id, não por
    -- slug, então as fotos acompanham a moto sozinhas.
    update public.motorcycles set slug = reg.para where slug = reg.de;
    if not found then
      raise exception 'Slug de origem não encontrado: "%". Nada foi alterado.', reg.de;
    end if;
  end loop;
end $$;

commit;

-- Conferência final: as 16 motos com os slugs novos. Roda junto
-- com o script e mostra a tabela na tela, para dar para bater o
-- olho antes de sair do SQL Editor.
select slug, modelo, ano, status
  from public.motorcycles
 order by marca, modelo;
