# Lembrete: evitar pausa do Supabase

Quando voltar, terminar a configuração do **Cloudflare Worker** que consulta
o catálogo da DG Motos a cada seis horas. A consulta externa gera atividade
no Supabase Free e ajuda a reduzir o risco de o projeto pausar por inatividade.

> Pausar não é apagar. Se o projeto pausar, o site ainda pode abrir com o
> catálogo estático, mas ele pode estar desatualizado; o painel não consegue
> salvar mudanças até o banco ser retomado.

## O que já está pronto neste projeto

- Worker: `cloudflare/supabase-keepalive/worker.js`
- Agendamento: `cloudflare/supabase-keepalive/wrangler.toml`
- Instruções técnicas: `docs/SUPABASE.md`
- O Worker consulta só `id` de uma moto (no máximo uma linha), não altera o
  estoque e não usa a chave `service_role`.
- Frequência: `17 */6 * * *` — quatro vezes por dia.

## Configuração concluída (27/10/2026)

- Worker `dg-motos-supabase`, publicado de
  `cloudflare/supabase-keepalive/` com `npx wrangler deploy`.
- Secrets `SUPABASE_URL` e `SUPABASE_ANON_KEY` cadastrados no Worker.
- Cron `17 */6 * * *` registrado pelo próprio deploy.
- Handler agendado testado: HTTP 200 contra o Supabase.

Para republicar depois de mudar o Worker:

```sh
cd cloudflare/supabase-keepalive
npx wrangler deploy
```

Depois da primeira execução automática, conferir **Logs** no painel da
Cloudflare.

**Nunca cadastrar a chave `service_role` no Worker.** Se alguma variável
estiver faltando, conferir os nomes acima e publicar o Worker novamente.

## Observações

- A consulta roda fora do Supabase, então o agendamento continua existindo
  mesmo se o banco ficar indisponível ou for pausado.
- A Cloudflare tem limites gratuitos suficientes para estas quatro chamadas
  pequenas por dia, conforme os limites atuais. Não deve exigir plano pago.
- Esse método reduz bastante o risco, mas a Supabase não garante que uma
  frequência específica impeça a pausa em todos os casos. Conferir também os
  avisos por e-mail da Supabase.
- Se o banco já estiver pausado, retomar pelo painel da Supabase primeiro;
  depois conferir os Logs do Worker.
