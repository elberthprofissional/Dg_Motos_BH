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
