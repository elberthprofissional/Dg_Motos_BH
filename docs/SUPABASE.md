# Configuração do Supabase (painel do dono)

O site tem duas camadas:

1. **Site público** — funciona sem Supabase, usando o catálogo de
   `src/data/motorcycles.ts`. É o que está no ar hoje.
2. **Painel do dono** — opcional. Com Supabase configurado, o estoque,
   os preços, as fotos e o status passam a ser gerenciados em `/admin`.

Nada do passo 2 é obrigatório para o site no ar. Se as variáveis de
ambiente não existirem, o site simplesmente ignora o Supabase.

---

## 1. Criar o projeto

1. Crie uma conta em <https://supabase.com> e um novo projeto.
2. Anote o **Project URL** e a **anon / publishable key**
   (Settings → API). A chave `service_role` **não** vai para o site.

## 2. Criar as tabelas

Abra o **SQL Editor** e execute, na ordem, os três arquivos de
[`supabase/migrations/`](../supabase/migrations) (detalhes em
[`supabase/README.md`](../supabase/README.md)):

- `..._init_schema.sql` — tabelas `motorcycles` e `motorcycle_images`,
  índices e trigger de `updated_at`;
- `..._rls_storage.sql` — RLS, políticas e o bucket público `motos`;
- `..._seed.sql` — (opcional) 5 motos de demonstração.

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

- **Fotos**: arrastar ou clicar. As imagens são convertidas para WebP,
  redimensionadas para no máximo 1600 px e enviadas para o bucket
  `motos`, dentro da pasta do slug da moto.
- **Km a confirmar**: deixe a quilometragem em branco. O site escreve
  "Km a confirmar" em vez de mostrar `null`.
- **Slug**: é o endereço da página (`/moto/...`). Se você editar o slug
  depois, a página antiga some do sitemap — evite renomear depois que a
  moto já foi divulgada.
- **Status**: `disponivel`, `indisponivel` ou `vendida`. Só as
  `disponivel` aparecem no site e no sitemap.

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
| Login diz "E-mail ou senha incorretos" | Usuário não criado em Authentication → Users, ou e-mail não confirmado. |
| Fotos não sobem | Bucket `motos` não criado (rode `..._rls_storage.sql`) ou política de Storage faltando. |
| `duplicate key` ao salvar | Já existe uma moto com o mesmo slug. Troque o modelo/ano ou edite o slug. |
| Site não muda após salvar | Faltou republicar (deploy pelo host / `git push`). |
| `npm run build` usa o catálogo antigo | Faltam as chaves no `.env` **no ambiente do build**, não só localmente. |
