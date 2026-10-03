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
 * URL final do site em produção (sem barra final).
 * Usada no sitemap, robots.txt e dados estruturados.
 * Ajustar quando o domínio definitivo for publicado.
 */
export const SITE_URL = 'https://dgmotos.com.br'

export const SITE = {
  nome: 'DG Motos',
  slogan: 'Realizando Sonhos',
  cidade: 'Belo Horizonte',
  estado: 'MG',
  endereco: {
    rua: 'Av. Basílio da Gama, 139',
    bairro: 'Belo Horizonte',
    cidadeUf: 'Belo Horizonte, MG',
  },
  instagram: {
    handle: '@dgmotosbh',
    url: 'https://instagram.com/dgmotosbh',
  },
  telefoneExibicao: null as string | null,
  horarios: null as { dias: string; horas: string }[] | null,
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Av.+Bas%C3%ADlio+da+Gama%2C+139%2C+Tupi%2C+Belo+Horizonte%2C+MG',
  // Coordenadas do embed oficial do Google Maps (pin na entrada da loja,
  // bairro Tupi). Alimentam os dados estruturados (schema.org).
  geo: {
    latitude: -19.8405866,
    longitude: -43.922776,
  },
} as const

export function getWhatsAppUrl(message?: string): string | null {
  if (!WHATSAPP_NUMBER) return null
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${WHATSAPP_NUMBER}${text}`
}
