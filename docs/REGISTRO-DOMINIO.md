# Registro do domínio — checklist de bolso

> Para levar no celular e seguir no balcão da loja.
> Tempo: ~15 minutos, se o dono estiver com o CPF/CNPJ e o celular na mão.

---

## Antes de sair de casa (5 min, no PC)

Faça o deploy agora — isso **não depende** do dono e já deixa o site no ar:

```
vercel login
vercel
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel --prod
```

Os dois valores estão no arquivo `.env` da pasta do projeto (abre com o Bloco de Notas).
Guarde o link `https://....vercel.app` que ele devolver — é o site funcionando.

Se esse passo já estiver feito, pode ir direto para a loja.

---

## O que pedir ao dono (senta e conversa)

- [ ] **CPF ou CNPJ da loja** — é nele que o domínio fica registrado. O dono do domínio é quem aparece como titular; tem que ser ele, não você.
- [ ] **Conta gov.br dele** — o Registro.br só entra com gov.br hoje. Se ele não tiver, cria na hora pelo site ou app do gov.br (precisa do celular dele na mão).
- [ ] **Pix ou cartão dele** para os **R$ 40** do primeiro ano.
- [ ] **E-mail que ele usa de verdade** — é por ali que chegam avisos de renovação.

Aproveite a visita e já resolva o que o site precisa do dono, tudo de uma vez:

- [ ] **WhatsApp oficial da loja** (com DDD) — hoje está vazio no site; ele preenche em `/admin → Configurações`
- [ ] **Instagram oficial** — hoje está `@dgmotosbh` de exemplo
- [ ] **Endereço completo e horários** de funcionamento
- [ ] **Fotos reais das motos** (ou combina como ele vai mandar)

---

## Na hora, pelo celular

### 1. Registrar o domínio (Registro.br)

1. Abre **registro.br** no navegador do celular
2. Busca `dgmotosbh.com.br` → tem que aparecer **disponível**
3. **Registrar** → CPF/CNPJ do dono → login gov.br dele
4. Aceita o contrato, escolhe **1 ano** (R$ 40) e paga no Pix
5. Em minutos o domínio é dele

### 2. Apontar o domínio para o site (Vercel)

6. Abre **vercel.com** no celular, entra no projeto → **Settings → Domains**
7. Digita `dgmotosbh.com.br` → **Add** → adiciona também `www.dgmotosbh.com.br`
8. A tela mostra os registros de DNS: **tira print** (é isso que vai no passo seguinte)

### 3. Criar os registros no Registro.br

9. Painel do domínio → **Editar zona DNS**
10. Cria um **A**: nome `@` (ou vazio) → `76.76.21.21`
11. Cria um **CNAME**: nome `www` → `cname.vercel-dns.com`
12. Salva

Pode levar de 10 minutos a algumas horas para propagar. **Não precisa esperar na loja** — fecha o celular e vai embora; quando chegar em casa abre `dgmotosbh.com.br` e vê se já subiu.

---

## Anotar e trazer (ou salvar no celular)

- [ ] Domínio registrado: `dgmotosbh.com.br`
- [ ] Titular (nome + CPF/CNPJ):
- [ ] Conta gov.br usada (e-mail/telefone):
- [ ] Forma de pagamento e comprovante do Registro.br
- [ ] **Data de renovação** (1 ano a partir de hoje) → colocar alarme no celular com 30 dias de antecedência
- [ ] Print dos registros de DNS que a Vercel pediu
- [ ] E-mail de contato cadastrado no Registro.br

> Renovação não paga = domínio cai e pode ser leiloado. O alarme é sério.

---

## Se o dono não puder na hora

Não trava nada. Peça só isto e vá embora:

1. CPF/CNPJ da loja
2. Ele mesmo registra depois em registro.br (é só seguir os passos 1 a 5) e te manda o print do painel
3. Você adiciona o domínio na Vercel e passa os registros de DNS para ele colar

O site continua no ar no endereço `.vercel.app` enquanto isso — nada quebra.

---

## Depois que o domínio estiver de pé

Me chama: eu troco o `SITE_URL` no código, ajusto o redirect do endereço antigo e a URL de recuperação de senha no Supabase. Essa parte é comigo.
