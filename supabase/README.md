# Banco de dados (Supabase)

Este diretório guarda as migrações do Postgres. Elas são a fonte de
verdade do esquema, das políticas RLS e das funções usadas pelo site.

As 16 migrações originais foram consolidadas em quatro arquivos por
assunto (o histórico continua no git). Cada arquivo descreve o estado
final do banco e é idempotente: rodar de novo não duplica nada nem
apaga dados.

## Ordem

| # | Arquivo | O que faz |
| - | --- | --- |
| 01 | `01_esquema.sql` | tabelas `motorcycles`, `motorcycle_images`, `site_settings`, `sales`, `entregas` e `entregas_fotos_lixeira`; constraints, índices e triggers. Alinha bancos criados por versões antigas do esquema. |
| 02 | `02_seguranca_e_storage.sql` | `public.admins`, `e_admin()`, `sou_admin()`, grants por coluna, políticas RLS finais e buckets `motos` (público) e `entregas` (privado). |
| 03 | `03_funcoes.sql` | RPCs do painel (`salvar_imagens_da_moto`, `custo_da_moto`, mover/restaurar foto da lixeira) e a limpeza diária da lixeira via `pg_cron`. |
| 04 | `04_dados_iniciais.sql` | **Opcional.** 5 motos de demonstração (só quando o estoque está vazio), as fotos delas e o registro `loja` em `site_settings`. |

## Como aplicar

**Projeto novo:** abra o SQL Editor e execute `_aplicar-tudo.sql` uma
vez. Ele contém os arquivos 01–04 na ordem e é idempotente.

Se não quiser as motos de demonstração, rode só `01_esquema.sql`,
`02_seguranca_e_storage.sql` e `03_funcoes.sql`, nesta ordem.

**Projeto que já está no ar:** se as migrações antigas (01–16) já foram
aplicadas, não há nada a fazer — o banco já está no estado final. Em
caso de dúvida, rodar `_aplicar-tudo.sql` é seguro.

> **A 02 é obrigatória para o código atual.** Sem `public.admins`,
> `e_admin()` e `sou_admin()`, o login não sabe quem é admin, salvar
> fotos falha e a venda é registrada sem custo.

> **A 03 é obrigatória para as lixeiras.** As RPCs que movem e
> restauram fotos do mural, e a limpeza agendada da lixeira, vivem nela.
> Se o `pg_cron` não estiver disponível no projeto, a migração só emite
> um aviso e a limpeza continua acontecendo quando o painel abre.

> **A 01 já remove `categoria` e `destaque`.** O código lê e grava sem
> esses campos; `categoria` era vocabulário de catálogo estrangeiro que
> a loja nunca usou e `destaque` virou `em_promocao`.

## Administradores

Escrever no catálogo, ler vendas e gerenciar entregas não depende de
"estar autenticado": é preciso estar em `public.admins`. A tabela não
tem política nem grant — só o `service_role` (painel do Supabase) e as
funções `security definer` a enxergam.

Ao rodar a 02, todas as contas que já existiam em `auth.users` são
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

Se o dono for criado **depois** da 02, ele não entra sozinho. Cadastre-o
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

## Funções do banco

| Função | Quem pode chamar | Para quê |
| --- | --- | --- |
| `e_admin()` | `authenticated` | checagem usada pelas políticas e RPCs |
| `sou_admin()` | `authenticated` | responde se a própria conta está em `public.admins`, sem expor a lista |
| `salvar_imagens_da_moto(uuid, jsonb)` | admin | substitui as fotos numa transação (delete + insert) |
| `custo_da_moto(uuid)` | admin | lê `custo_compra`, que não sai no select da API |
| `mover_foto_entrega_para_lixeira(uuid, text)` | admin | tira a foto do mural e guarda 30 dias na lixeira |
| `restaurar_foto_da_lixeira(uuid)` | admin | devolve a foto da lixeira para a publicação |
| `limpar_lixeira_vencida()` | ninguém pela API | apaga linhas vencidas da lixeira; chamada só pelo `pg_cron` |

## O que não vai para o cliente

A `service_role` ignora RLS e **nunca** entra em `.env` nem em
`VITE_*`: variáveis `VITE_` são embutidas no JavaScript. O site usa só
a anon/publishable key. Toda a segurança mora nas migrações.

## Manutenção

O projeto Free pode ser pausado por inatividade. O Worker em
[`cloudflare/supabase-keepalive/`](../cloudflare/supabase-keepalive/)
faz uma leitura mínima a cada seis horas; o passo a passo está em
[`docs/SUPABASE.md`](../docs/SUPABASE.md).
