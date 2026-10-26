# Configuração do Supabase (painel do dono)

O site tem duas camadas:

1. **Site público** — funciona sem Supabase, usando o catálogo de
   `src/data/motorcycles.ts`. É o que está no ar hoje.
2. **Painel do dono** — opcional. Com Supabase configurado, o estoque,
   os preços, as fotos e o status passam a ser gerenciados em `/admin`.

Nada do passo 2 é obrigatório para o site no ar. Se as variáveis de
ambiente não existirem, o site simplesmente ignora o Supabase.

> **PWA:** o painel também é instalável como app (manifest em
> `public/manifest.webmanifest`). O app instalado abre direto em
> `/admin/login` — quem abriu o aplicativo quer gerenciar estoque, não
> passear pela vitrine. No navegador, `/` continua mostrando o catálogo.
> O botão de instalação fica na aba **Configurações**.

---

## 1. Criar o projeto

1. Crie uma conta em <https://supabase.com> e um novo projeto.
2. Anote o **Project URL** e a **anon / publishable key**
   (Settings → API). A chave `service_role` **não** vai para o site.

## 2. Criar as tabelas

Abra o **SQL Editor** e execute as migrações numeradas de
[`supabase/migrations/`](../supabase/migrations), em ordem (detalhes em
[`supabase/README.md`](../supabase/README.md)):

- `..._cria_esquema_inicial.sql` — tabelas `motorcycles` e `motorcycle_images`,
  índices e trigger de `updated_at`;
- `..._seguranca_rls_e_storage.sql` — RLS, políticas e o bucket público `motos`;
- `..._dados_iniciais_estoque.sql` — (opcional) 5 motos de demonstração;
- `..._configuracoes_da_loja.sql`, `..._promocoes_do_estoque.sql`,
  `..._registro_de_vendas.sql`, `..._publicacoes_de_entregas.sql`,
  `..._lixeira_do_estoque.sql` e `..._edicao_de_vendas.sql` — configurações,
  promoções, histórico de vendas, a galeria de entregas, a lixeira do estoque e
  a edição de quem comprou (aba **Vendidas**).

## 3. Ligar o projeto ao site

Copie `.env.example` para `.env` e preencha:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...sua-chave...
```

`.env` está no `.gitignore` — nunca commite. O `SITE_URL` usado pelo
prerender fica em `src/data/site.ts`; ajuste para o domínio real.

Rode `npm run dev`. Se aparecer `/admin` com "Área restrita desativada",
falta alguma das duas chaves.

## 4. Criar o usuário do dono

Em **Authentication → Users → Add user**, crie um e-mail e senha.
Esse é o único login que entra no `/admin`. Se você criar mais contas,
todas terão acesso ao catálogo (ver *Segurança* abaixo).

**Importante — desligue o cadastro público.** O `/admin` não tem tela de
cadastro, mas o Supabase libera `signUp` por padrão, e qualquer pessoa com
a chave pública poderia criar uma conta. Em **Authentication → Sign In /
Providers → Email**, desative **"Allow new users to sign up"** (ou
*Enable email signups*). Assim, contas só nascem pelo painel do Supabase,
criadas por você.

## 5. Cadastrar as motos

Entre em `/admin` e use a aba **Estoque**. No cadastro:

- **Fotos**: arrastar ou clicar em **Escolher fotos**; no celular
  aparece também **Tirar foto**, que abre a câmera na hora. As imagens
  são convertidas para WebP, redimensionadas para no máximo 1600 px e
  enviadas para o bucket `motos`, dentro da pasta da moto.
- **Km a confirmar**: deixe a quilometragem em branco. O site escreve
  "Km a confirmar" em vez de mostrar `null`.
- **Endereço da página (slug)**: não há campo para preencher. O sistema
  monta `/moto/marca-modelo-ano` com o que você digitou; numa segunda
  unidade do mesmo modelo e ano ele acrescenta um número (`-2`). Depois
  de publicada, a URL não muda mais sozinha — trocar o modelo não quebra
  o link já divulgado.
- **Status**: `disponivel`, `indisponivel` ou `vendida`. Só as
  `disponivel` aparecem no site e no sitemap.

### Lixeira do estoque

Excluir uma moto no Estoque não apaga a ficha: ela vai para a seção
**Lixeira**, dentro de **Configurações**, sai do site e das contas do
pátio, e pode ser restaurada depois. O status original é mantido — uma
vendida volta para **Vendidas**, uma disponível volta para o pátio.

A moto fica na lixeira por **30 dias**, contados da exclusão. Cada linha mostra
quanto falta (`sai em 4 dias`) e, quando o prazo vence, ela é apagada de vez —
linha e fotos do Storage. Essa limpeza roda ao abrir o painel: é o momento em
que a sessão do dono tem permissão para apagar, e o site público nunca apaga
nada. Se o painel ficar semanas sem ser aberto, nada se perde: o que venceu sai
na primeira visita.

O **apagar de vez** também fica na própria Lixeira, com confirmação, para quem
não quer esperar. A lixeira depende da migração `09_lixeira_do_estoque.sql`;
sem ela, o painel avisa ao tentar excluir.

### Evitar pausa por inatividade no plano Free

A Supabase pode pausar projetos Free com pouca atividade por uma semana.
O site continua abrindo com o catálogo estático, mas esse estoque pode ficar
desatualizado e o painel não consegue salvar alterações enquanto o banco
estiver pausado.

O projeto inclui um Cloudflare Worker fora da Supabase, em
[`cloudflare/supabase-keepalive/`](../cloudflare/supabase-keepalive/). O
Cron Trigger faz uma leitura pública mínima do catálogo a cada seis horas:
somente a coluna `id`, no máximo uma linha. A política `catalogo publico`
já libera essa leitura anônima. O Worker não escreve, não altera estoque e
não usa a chave `service_role`.

Para configurar uma vez:

1. Crie uma conta gratuita na Cloudflare e abra **Workers & Pages**.
2. Crie um Worker chamado `dg-motos-supabase-keepalive` e publique o
   conteúdo de `cloudflare/supabase-keepalive/worker.js`.
3. Em **Settings → Variables and Secrets**, adicione como *secrets*
   `SUPABASE_URL` (Project URL) e `SUPABASE_ANON_KEY` (anon/publishable
   key). Nunca use a chave `service_role`.
4. Em **Settings → Triggers → Cron Triggers**, adicione
   `17 */6 * * *` (quatro execuções por dia).
5. Confira **Logs** depois da primeira execução agendada. Uma falha aparece
   no log com o código HTTP retornado pela Supabase.

O código do Worker e o agendamento ficam registrados neste repositório;
os dois valores secretos ficam só na conta Cloudflare. A faixa gratuita da
Cloudflare comporta folgadamente quatro chamadas pequenas por dia, dentro
dos limites atuais. Isso reduz bastante o risco de pausa, mas a Supabase
decide a atividade suficiente e pode mudar suas regras; não é uma garantia
de disponibilidade. Para confirmar o estado, confira os Logs do Worker e
os avisos por e-mail da Supabase.

### Aba Configurações

O contato, o Instagram, o endereço e os horários saem de
`src/data/site.ts` (padrão de fábrica). A aba **Configurações** deixa o
dono editar isso e salvar. Com o Supabase configurado, o valor vai para a
tabela pública `site_settings` (migração
`05_configuracoes_da_loja.sql`) e passa a valer para todos os
visitantes na hora, sem novo build. O `localStorage` fica como cache e
fallback quando o banco não responde.

- O mesmo local tem o botão **Instalar o aplicativo** (ver PWA abaixo).

---

## Publicar mudanças (importante para o SEO)

O site é estático, então uma moto salva no painel **não aparece no ar nem
no Google até republicar**. Faça o deploy pelo painel do host (na Vercel,
um `git push` para a branch de produção já dispara o build). O `postbuild`
roda o prerender, que gera `dist/moto/*/index.html`, o `sitemap.xml` e o
`robots.txt`.

### Por que o prerender existe

As fichas `/moto/*` são renderizadas no navegador. Sem prerender, o
Google receberia uma página vazia e o WhatsApp mostraria a preview do
link sem foto nem preço. O script `scripts/prerender.mjs` grava no HTML
título, descrição, preço, ficha técnica e JSON-LD de cada moto — o
buscador lê tudo sem executar JavaScript.

Ele roda sozinho depois do build (`npm run build` → `postbuild`) e usa:

- o Supabase, se as chaves estiverem no `.env` no momento do build;
- o catálogo estático, se não estiverem ou se a API falhar.

Ou seja: **trocar o catálogo e esquecer de publicar deixa o site
desatualizado**, mesmo que o banco esteja correto.

---

## Segurança

O que já está nas migrações:

- RLS ligado em `motorcycles` e `motorcycle_images`.
- Leitura pública das duas tabelas (a vitrine precisa).
- Escrita nas duas tabelas e no bucket `motos` só para `authenticated`.

O ponto de atenção: **qualquer usuário autenticado edita o catálogo**.
Se você usa uma única conta (o dono), está ok. Se algum dia criar conta
de funcionário, essa pessoa também poderá alterar preços. Para travar,
crie a tabela `profiles` com `is_admin` e troque as políticas de escrita
por `exists (select 1 from profiles where id = auth.uid() and is_admin)`.
O cadastro público de contas precisa ficar desligado (passo 4): sem isso,
o passo "apenas usuário autenticado" perde valor.

Nunca exponha a `service_role` em `VITE_*`: variáveis `VITE_` são
embaladas no JavaScript e ficam públicas para qualquer visitante.

---

## Solução de problemas

| Sintoma | Causa provável |
| --- | --- |
| `/admin` diz "Área restrita desativada" | `.env` ausente, ou build anterior ao `.env`. Refaça o build. |
| Login diz "E-mail ou senha inválidos" | Usuário não criado em Authentication → Users, ou e-mail não confirmado. |
| Fotos não sobem | Bucket `motos` não criado (rode `..._seguranca_rls_e_storage.sql`) ou política de Storage faltando. |
| `duplicate key` ao salvar | O sistema tenta sozinho o próximo endereço livre (`-2`, `-3`…). Se persistir, é outra restrição do banco: veja o erro completo no console. |
| Site não muda após salvar | Faltou republicar (deploy pelo host / `git push`). A config da loja (aba Configurações) é exceção: vai para `site_settings` e vale na hora. |
| Excluir moto pede uma migração | A coluna `lixeira_em` não existe no banco. Rode `09_lixeira_do_estoque.sql` no SQL Editor. |
| Instalar o app não aparece | Precisa HTTPS e o manifest acessível. No iPhone/Safari não há prompt: use *Compartilhar → Adicionar à Tela de Início*. |
| `npm run build` usa o catálogo antigo | Faltam as chaves no `.env` **no ambiente do build**, não só localmente. |
