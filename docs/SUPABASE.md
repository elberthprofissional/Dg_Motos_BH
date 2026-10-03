# Configuração do Supabase (painel do dono)

O site tem duas camadas:

1. **Site público** — funciona sem Supabase, usando o catálogo de
   `src/data/motorcycles.ts`. É o que está no ar hoje.
2. **Painel do dono** — opcional. Com Supabase configurado, o estoque,
   os preços, as fotos e os leads passam a ser gerenciados em `/admin`.

Nada do passo 2 é obrigatório para o site no ar. Se as variáveis de
ambiente não existirem, o site simplesmente ignora o Supabase.

---

## 1. Criar o projeto

1. Crie uma conta em <https://supabase.com> e um novo projeto.
2. Anote o **Project URL** e a **anon / publishable key**
   (Settings → API). A chave `service_role` **não** vai para o site.

## 2. Criar as tabelas

Abra o **SQL Editor**, cole o conteúdo de [`supabase/schema.sql`](../supabase/schema.sql)
e execute. O script cria:

- tabela `motorcycles` (catálogo, já vem com as 5 motos do seed);
- tabela `leads` (contatos dos formulários);
- políticas de RLS;
- o bucket público `motos` no Storage;
- um índice de busca por texto em português.

## 3. Ligar o projeto ao siteq cr
Copie `.env.example` para `.env` e preencha:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...sua-chave...
```

`.env` está no `.gitignore` — nunca commite. A variável `SITE_URL` do
`.env.example` é usada pelo prerender; ajuste para o domínio real.

Rode `npm run dev`. Se aparecer `/admin` com "Área restrita desativada",
falta alguma das duas chaves.

## 4. Criar o usuário do dono

Em **Authentication → Users → Add user**, crie um e-mail e senha.
Esse é o único login que entra no `/admin`. Se você criar mais contas,
todas terão acesso ao catálogo (ver *Segurança* abaixo).

## 5. Cadastrar as motos

Entre em `/admin` e use a aba **Estoque**. No cadastro:

- **Fotos**: arrastar ou clicar. As imagens são convertidas para WebP,
  redimensionadas para no máximo 1600 px e enviadas para o bucket
  `motos`, dentro da pasta do slug da moto.
- **Km a confirmar**: deixe a quilometragem em branco. O site escreve
  "Km a confirmar" em vez de mostrar `null`.
- **Slug**: é o endereço da página (`/moto/...`). Se você editar o slug
  depois, a página antiga some do sitemap — evite renomear depois que a
  moto já foi divulgada.

Marcas como `disponível`, `reservada` e `vendida`: só `disponível` e
`reservada` aparecem no site e no sitemap.

---

## Publicar mudanças (importante para o SEO)

O site é estático, então uma moto salva no painel **não aparece no ar
nem no Google até republicar**. Duas formas:

### Opção A — Deploy hook (recomendado, um clique)

1. Na Vercel/Netlify: Project → Settings → Deploy Hooks → criar.
2. No `.env` (e no painel do host), configure a URL do hook.
3. No `/admin`, use o botão **Publicar site** após salvar o estoque.

O hook dispara um build; o `postbuild` roda o prerender, que gera
`dist/moto/*/index.html`, o `sitemap.xml` e o `robots.txt`.

### Opção B — Deploy manual

`git push` para a branch de produção. O build do host roda o mesmo
`npm run build`.

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

O que já está no `supabase/schema.sql`:

- RLS ligado nas duas tabelas.
- Leitura pública de `motorcycles`; `leads` só é lido por logado.
- Inserção de `leads` liberada (é o formulário público).
- Escrita de `motorcycles` e leitura de `leads` só para `authenticated`.

O ponto de atenção: **qualquer usuário autenticado edita o catálogo**.
Se você usa uma única conta (o dono), está ok. Se algum dia criar conta
de funcionário, essa pessoa também poderá alterar preços. Para travar,
crie a tabela `profiles` com `is_admin` e troque as políticas de escrita
por `exists (select 1 from profiles where id = auth.uid() and is_admin)`.

Nunca exponha a `service_role` em `VITE_*`: variáveis `VITE_` são
embaladas no JavaScript e ficam públicas para qualquer visitante.

A tabela `leads` aceita inserção anônima. Isso é necessário para o
formulário, mas deixa o endpoint aberto a spam. Se receber lixo, ative
o Captcha do Supabase ou um rate limit no proxy.

---

## Solução de problemas

| Sintoma | Causa provável |
| --- | --- |
| `/admin` diz "Área restrita desativada" | `.env` ausente, ou build anterior ao `.env`. Refaça o build. |
| Login diz "E-mail ou senha incorretos" | Usuário não criado em Authentication → Users, ou e-mail não confirmado. |
| Fotos não sobem | Bucket `motos` não criado (rode o `schema.sql`) ou política de Storage faltando. |
| `duplicate key` ao salvar | Já existe uma moto com o mesmo slug. Troque o modelo/ano ou edite o slug. |
| Site não muda após salvar | Faltou republicar (deploy hook ou `git push`). |
| `npm run build` usa o catálogo antigo | Faltam as chaves no `.env` **no ambiente do build**, não só localmente. |