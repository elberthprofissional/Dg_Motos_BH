# Publicação & SEO (nota interna — removida do painel do dono)

> Não faz sentido mostrar isso ao dono da loja dentro do painel de
> configurações. O texto original (antiga seção "Publicação & SEO" do
> painel) foi movido para cá em 24/10/2026, para o conhecimento não se perder.

## Como funciona

- O site é estático. Salvar no painel atualiza a vitrine na hora, mas as
  páginas `/moto/<slug>` geradas para o Google só são atualizadas com novo
  build/deploy.
- Ao rodar `npm run build`, o `postbuild` executa `scripts/prerender.mjs` e
  gera HTML estático + sitemap + robots com as motos disponíveis no momento
  do build.
- Se uma moto for adicionada/editada pelo painel sem deploy, ela aparece na
  vitrine (client-side), mas o Google pode ver a versão antiga ou vazia da
  ficha até o próximo deploy.
- As configurações de contato (WhatsApp/Instagram/endereço) ficam salvas no
  banco e aparecem para todos sem rebuild.

## Dica prática

Sempre que alterar fotos, descrição, preço ou adicionar uma moto nova, fazer
o deploy (push) para atualizar o SEO e o sitemap.
