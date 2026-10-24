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

## O que falta fazer na Cloudflare

1. Entrar ou criar uma conta gratuita na Cloudflare.
2. Abrir **Workers & Pages** e criar o Worker
   `dg-motos-supabase-keepalive`.
3. Publicar nele o conteúdo de
   `cloudflare/supabase-keepalive/worker.js`.
4. Nas configurações do Worker, em **Settings → Variables and Secrets**,
   cadastrar estes dois valores como *secrets*:
   - `SUPABASE_URL`: Project URL do projeto Supabase.
   - `SUPABASE_ANON_KEY`: chave anon/publishable do Supabase.
5. Em **Settings → Triggers → Cron Triggers**, cadastrar:
   `17 */6 * * *`
6. Depois da primeira execução, abrir **Logs** e conferir que não houve erro.

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
