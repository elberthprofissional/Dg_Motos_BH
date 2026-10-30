/**
 * ============================================================
 * CONFIGURAÇÃO CENTRAL DO SITE — DG MOTOS
 * ============================================================
 * Dados de contato, endereço e links da loja.
 *
 * CONFIRMAÇÃO PENDENTE DO CLIENTE (ver docs/PENDENCIAS-CLIENTE.md):
 * - WHATSAPP_NUMBER está `null` de propósito. Preencher com o
 *   número oficial no formato DDI+DDD+número (só dígitos).
 *   Exemplo: 5531999999999
 * - Instagram: substituir pelo @ oficial confirmado.
 * - Horários: só publicar quando confirmados.
 */
export const WHATSAPP_NUMBER: string | null = null

/**
 * URL do site no ar (sem barra final).
 * Usada no sitemap, robots.txt, canonical e dados estruturados.
 *
 * ATENÇÃO: o domínio `dgmotos.com.br` é de OUTRA loja DG Motos —
 * nunca esteve com a gente. Enquanto o domínio próprio não for
 * registrado, o site vive na Vercel e é para lá que canonical,
 * sitemap e Open Graph apontam.
 *
 * Quando `dgmotosbh.com.br` estiver registrado e apontando para a
 * Vercel, trocar por `https://dgmotosbh.com.br` AQUI e nas tags
 * og:url e og:image do `index.html` (grep pelo domínio antigo),
 * e dar deploy.
 */
export const SITE_URL = 'https://dg-motos-bh.vercel.app'

export const SITE = {
  nome: 'DG Motos',
  slogan: 'Realizando Sonhos',
  cidade: 'Belo Horizonte',
  estado: 'MG',
  endereco: {
    rua: 'Av. Basílio da Gama, 139',
    bairro: 'Tupi',
    cidadeUf: 'Belo Horizonte, MG',
  },
  instagram: {
    handle: '@dgmotosbh',
    url: 'https://instagram.com/dgmotosbh',
  },
  horarios: [
    { dias: 'Seg a Sex', horas: '9h–18h' },
    { dias: 'Sáb', horas: '9h–13h' },
  ] as { dias: string; horas: string }[] | null,
  // Coordenadas do embed oficial do Google Maps (pin na entrada da loja,
  // bairro Tupi). Alimentam os dados estruturados (schema.org).
  geo: {
    latitude: -19.8405866,
    longitude: -43.922776,
  },
} as const
