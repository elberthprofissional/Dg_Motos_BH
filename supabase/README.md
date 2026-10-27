# Banco de dados (Supabase)

Este diretório guarda as migrações do Postgres. Elas são a fonte de
verdade do esquema, das políticas RLS e das funções usadas pelo site.

## Ordem

| # | Arquivo | O que faz |
| - | --- | --- |
| 01 | `01_cria_esquema_inicial.sql` | tabelas `motorcycles` e `motorcycle_images`, índices e trigger de `updated_at` |
| 02 | `02_seguranca_rls_e_storage.sql` | RLS, políticas iniciais e bucket público `motos` |
| 03 | `03_dados_iniciais_estoque.sql` | (opcional) 5 motos de demonstração |
| 04 | `04_corrige_estrutura_estoque.sql` | conserta bancos criados com a tabela antiga |
| 05 | `05_configuracoes_da_loja.sql` | tabela `site_settings` e o registro `loja` |
| 06 | `06_promocoes_do_estoque.sql` | `em_promocao` e `preco_antes` |
| 07 | `07_registro_de_vendas.sql` | `custo_compra` e a tabela `sales` |
| 08 | `08_publicacoes_de_entregas.sql` | galeria de entregas e bucket privado `entregas` |
| 09 | `09_lixeira_do_estoque.sql` | `lixeira_em` e leitura pública sem os itens da lixeira |
| 10 | `10_edicao_de_vendas.sql` | edição de vendas já lançadas |
| 11 | `11_seguranca_e_transacoes.sql` | lista de admins, grants por coluna e RPCs transacionais |

## Como aplicar

**Projeto novo:** abra o SQL Editor e execute `_aplicar-tudo.sql` uma
vez. Ele contém as migrações 01–11 na ordem.

**Projeto que já está no ar:** execute só as migrações que faltam, em
ordem. Se o banco está na 10, rode apenas a 11.

> **A migração 11 é obrigatória para o código atual.** Sem ela, salvar
> fotos falha com a mensagem "o banco ainda não tem a rotina que grava
> as fotos" e a venda é registrada sem custo. Aplique a 11 **antes** de
> publicar a versão nova do site.

## Administradores

A partir da 11, escrever no catálogo, ler vendas e gerenciar entregas
não depende mais de "estar autenticado": é preciso estar em
`public.admins`. A tabela não tem política nem grant — só o
`service_role` (painel do Supabase) e as funções `security definer` a
enxergam.

Ao rodar a 11, todas as contas que já existiam em `auth.users` são
promovidas. Confira:

```sql
select a.user_id, u.email
from public.admins a
join auth.users u on u.id = a.user_id;
```

Se aparecer uma conta que não é do dono, remova:

```sql
delete from public.admins where user_id = '<uuid>';
```

Se o dono for criado **depois** da 11, ele não entra sozinho. Cadastre-o
em Authentication → Users e rode:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'email-do-dono@exemplo.com'
on conflict (user_id) do nothing;
```

Para dar acesso a um funcionário, repita o `insert` com o e-mail dele.
Para tirar o acesso, apague a linha em `public.admins` (a conta de login
continua existindo, mas não escreve nem lê dados do painel).

**Desligue o cadastro público** em Authentication → Sign In / Providers
→ Email. A chave anon é pública; sem o cadastro desligado, qualquer
pessoa cria uma conta. A lista de admins impede que essa conta escreva,
mas ela ainda conseguiria autenticar — o ideal é fechar as duas portas.

## Funções criadas na 11

| Função | Quem pode chamar | Para quê |
| --- | --- | --- |
| `e_admin()` | `authenticated` | checagem usada pelas políticas |
| `salvar_imagens_da_moto(uuid, jsonb)` | admin | substitui as fotos numa transação (delete + insert) |
| `custo_da_moto(uuid)` | admin | lê `custo_compra`, que não sai mais no select público |

## O que não vai para o cliente

A `service_role` ignora RLS e **nunca** entra em `.env` nem em
`VITE_*`: variáveis `VITE_` são embutidas no JavaScript. O site usa só
a anon/publishable key. Toda a segurança mora nas migrações.

## Manutenção

O projeto Free pode ser pausado por inatividade. O Worker em
[`cloudflare/supabase-keepalive/`](../cloudflare/supabase-keepalive/)
faz uma leitura mínima a cada seis horas; o passo a passo está em
[`docs/SUPABASE.md`](../docs/SUPABASE.md).
