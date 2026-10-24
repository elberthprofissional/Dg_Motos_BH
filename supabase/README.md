# Banco de dados (Supabase)

Este diretório guarda o schema em **migrações versionadas**. Cada arquivo
em `migrations/` é aplicado uma vez, na ordem do nome.

| Arquivo | O que faz |
| --- | --- |
| `20260101000000_init_schema.sql` | Cria `motorcycles` e `motorcycle_images`, índices e o trigger de `updated_at`. |
| `20260101000001_rls_storage.sql` | Liga o RLS, cria as políticas e o bucket público `motos` no Storage. |
| `20260101000002_seed.sql` | Insere 5 motos de **demonstração** (só quando a tabela está vazia). |
| `20260101000003_corrige_esquema.sql` | **Corrige um banco incompleto** (sem `status` / sem `motorcycle_images`). Rode se o `/admin` aparecer vazio. Idempotente. |
| `20260101000004_site_settings.sql` | Configurações públicas editáveis da loja. |
| `20260101000005_promocao.sql` | Campos de preço promocional do estoque. |
| `20260101000006_vendas.sql` | Histórico privado de vendas. |
| `20260101000007_entregas.sql` | Cria os registros de entregas, publicação moderada e fotos privadas para “Sonhos realizados”. |

## Como aplicar

Não há CLI do Supabase configurada: as migrações são aplicadas pelo painel.

1. Abra o projeto em <https://supabase.com/dashboard> → **SQL Editor**.
2. Cole o conteúdo de `migrations/20260101000000_init_schema.sql` e execute.
3. Repita com `20260101000001_rls_storage.sql`.
4. Opcional: rode `20260101000002_seed.sql` para começar com o estoque de
   demonstração. Se preferir cadastrar tudo pelo `/admin`, pule este passo.

Em um projeto já atualizado até vendas, execute `migrations/20260101000007_entregas.sql`
para habilitar a aba **Entregas** e o mural da Home. Em um projeto novo, aplique
as migrações numeradas em ordem; o seed 0002 é opcional.

Os scripts são idempotentes (`create ... if not exists`, `drop policy if
exists`), então rodar de novo não quebra nem duplica.

A migração 0007 cria a tabela `entregas` e o bucket privado `entregas` no
Storage. Rascunhos e fotos não publicadas ficam acessíveis só pela sessão do
admin. A Home lê apenas registros publicados; a publicação exige foto e a
confirmação de autorização para o material escolhido.

## Banco incompleto (painel vazio)

Se a página inicial mostra as motos mas o painel `/admin` diz
"Nenhuma moto no estoque", o banco provavelmente ficou pela metade: uma
tabela `motorcycles` antiga (sem a coluna `status`) e nenhuma
`motorcycle_images`. Como `create table if not exists` **não** altera
tabela existente, reaplicar o `init_schema` não resolve.

Nesse caso, rode `20260101000003_corrige_esquema.sql`: ele adiciona a
coluna que falta, cria a tabela de imagens com a FK e religa as fotos das
5 motos — sem apagar nada.

## Modelo de dados

```
motorcycles
  id, slug (único), marca, modelo, ano, preco, quilometragem, cilindrada,
  categoria, descricao, especificacoes (jsonb), destaque,
  status ('disponivel' | 'vendida' | 'indisponivel'),
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
