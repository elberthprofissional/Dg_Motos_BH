# Banco de dados (Supabase)

Este diretório guarda o schema em **migrações versionadas**. Cada arquivo
em `migrations/` é aplicado uma vez, na ordem do nome.

| Arquivo | O que faz |
| --- | --- |
| `20260101000000_cria_esquema_inicial.sql` | Cria `motorcycles` e `motorcycle_images`, índices e o trigger de `updated_at`. |
| `20260101000001_seguranca_rls_e_storage.sql` | Liga o RLS, cria as políticas e o bucket público `motos` no Storage. |
| `20260101000002_dados_iniciais_estoque.sql` | Insere 5 motos de **demonstração** (só quando a tabela está vazia). |
| `20260101000003_corrige_estrutura_estoque.sql` | **Corrige um banco incompleto** (sem `status` / sem `motorcycle_images`). Rode se o `/admin` aparecer vazio. Idempotente. |
| `20260101000004_configuracoes_da_loja.sql` | Configurações públicas editáveis da loja. |
| `20260101000005_promocoes_do_estoque.sql` | Campos de preço promocional do estoque. |
| `20260101000006_registro_de_vendas.sql` | Histórico privado de vendas. |
| `20260101000007_publicacoes_de_entregas.sql` | Cria os registros de entregas, publicação moderada e fotos privadas para “Sonhos realizados”. |
| `20260101000008_lixeira_do_estoque.sql` | Cria a lixeira do estoque (`lixeira_em`) e impede que motos excluídas sejam lidas pela chave pública. |
| `20260101000009_edicao_de_vendas.sql` | Libera o `update` em `sales`: correção de venda em **Vendidas** e desvinculação ao reativar a moto. |

## Como aplicar

Não há CLI do Supabase configurada: as migrações são aplicadas pelo painel.

1. Abra o projeto em <https://supabase.com/dashboard> → **SQL Editor**.
2. Cole o conteúdo de `migrations/20260101000000_cria_esquema_inicial.sql` e execute.
3. Repita com `20260101000001_seguranca_rls_e_storage.sql`.
4. Opcional: rode `20260101000002_dados_iniciais_estoque.sql` para começar com o estoque de
   demonstração. Se preferir cadastrar tudo pelo `/admin`, pule este passo.

Em um projeto já atualizado até vendas, execute `migrations/20260101000007_publicacoes_de_entregas.sql`
para habilitar a aba **Publicações** e a galeria "Sonhos realizados". Em um
projeto novo, aplique as migrações numeradas em ordem; o seed 0002 é opcional.

A migração 0008 é necessária para a seção **Lixeira**, dentro de
**Configurações**. Sem ela, excluir uma moto mostra um aviso pedindo a migração
em vez de mover a ficha. A lixeira não
apaga nada: apenas marca `lixeira_em`, esconde a moto da vitrine e a mantém
disponível no painel para restaurar. O apagar definitivo continua sendo uma
ação separada, com confirmação, e remove as fotos do Storage.

A migração 0009 liga a edição de vendas: sem ela, o RLS de `sales` só aceita
insert/delete e o painel avisa "aplique a migração 0009" em vez de fingir que
salvou. É ela que permite corrigir quem comprou em **Vendidas** (linha
"Comprou: …") e desvincular a venda quando a moto volta pro pátio — nesse caso
o registro fica no histórico, só sem apontar para a moto ativa. Comprador,
telefone e valores continuam sem política para `anon`: o site público não lê
`sales`.

Os scripts são idempotentes (`create ... if not exists`, `drop policy if
exists`), então rodar de novo não quebra nem duplica.

A migração 0007 cria a tabela `entregas` e o bucket privado `entregas` no
Storage. Rascunhos e fotos não publicadas ficam acessíveis só pela sessão do
admin. A galeria lê apenas registros publicados. O painel não tem tela de
edição: no mural, **Nova publicação** sobe as fotos e a publicação já nasce no
ar, e cada quadro carrega o seu próprio apagar (tirar a última foto arquiva a
publicação). O banco continua exigindo foto e `autorizacao_publicacao`; é a
coluna que o painel grava sempre como confirmada — a confirmação saiu da
interface. O site recebe somente as fotos e a data — modelo da moto e nome do
cliente não saem do painel.

## Preços antigos gravados pela metade

O campo de preço antigo convertia "23.000" em 23. O formulário novo lê o
formato brasileiro, mas registros já salvos precisam ser corrigidos à mão.
`diagnostico-precos.sql` lista as motos abaixo de R$ 1.000 e o formulário
avisa ao salvar um preço abaixo desse piso.

## Banco incompleto (painel vazio)

Se a página inicial mostra as motos mas o painel `/admin` diz
"Nenhuma moto no estoque", o banco provavelmente ficou pela metade: uma
tabela `motorcycles` antiga (sem a coluna `status`) e nenhuma
`motorcycle_images`. Como `create table if not exists` **não** altera
tabela existente, reaplicar o esquema inicial não resolve.

Nesse caso, rode `20260101000003_corrige_estrutura_estoque.sql`: ele adiciona a
coluna que falta, cria a tabela de imagens com a FK e religa as fotos das
5 motos — sem apagar nada.

## Modelo de dados

```
motorcycles
  id, slug (único), marca, modelo, ano, preco, quilometragem, cilindrada,
  categoria, descricao, especificacoes (jsonb), destaque,
  status ('disponivel' | 'vendida' | 'indisponivel'),
  lixeira_em (NULL = ativa; data = na lixeira),
  created_at, updated_at

motorcycle_images
  id, motorcycle_id (FK → motorcycles, on delete cascade),
  src, alt, posicao, created_at
```

As fotos ficam em tabela própria, e não num campo `jsonb`, para que possam
ser reordenadas/removidas uma a uma e para que a exclusão da moto apague as
linhas automaticamente (`on delete cascade`). Os arquivos do Storage, que o
banco não apaga sozinho, são removidos pela aplicação ao excluir a moto.

## Segurança

- Leitura do catálogo e das fotos: pública (a vitrine precisa).
- Escrita nas duas tabelas e no bucket `motos`: só usuário autenticado.
- A chave anônima é pública por design; quem protege o banco é o RLS.

Qualquer conta autenticada edita o catálogo. Com uma única conta (o dono)
isso é suficiente. Para separar funcionários, veja a seção *Segurança* em
[`../docs/SUPABASE.md`](../docs/SUPABASE.md).
