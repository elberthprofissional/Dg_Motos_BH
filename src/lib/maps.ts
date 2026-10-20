/**
 * Integração com o Google Maps.
 *
 * O link de rota é MONTADO a partir do endereço que o dono digita no
 * painel (rua + cidade). Ninguém precisa colar URL: o dono preenche a
 * rua, o site gera a busca do Google Maps no formato oficial
 * (`/maps/search/?api=1&query=...`) — o mesmo que sai do botão
 * "Compartilhar" do Google.
 *
 * A URL de EMBED é o código oficial ("Incorporar mapa") do pin da loja
 * e continua constante: ela precisa de place ID/coordenadas, não dá pra
 * derivar de texto. Vive aqui (e não no painel) porque o dono não tem
 * como gerá-la — trocar de endereço é tarefa de quem mantém o código.
 *
 * Não há API key em nenhuma das duas.
 */

/** `src` do iframe, com o pin na entrada da loja (bairro Tupi, BH). */
export const MAPS_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3752.9850228882406!2d-43.92277602383706!3d-19.84058663553232!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa68534aede22ef%3A0x5442a33d1ba51e55!2sAv.%20Bas%C3%ADlio%20da%20Gama%2C%20139%20-%20Tupi%2C%20Belo%20Horizonte%20-%20MG%2C%2031842-610!5e0!3m2!1spt-BR!2sbr!4v1790940091410!5m2!1spt-BR!2sbr'

/**
 * Link de rota ("Como chegar") derivado do endereço da loja.
 * Endereço vazio cai na home do Maps — link nenhum fica morto.
 */
export function buildMapsRouteUrl(endereco: {
  enderecoRua: string
  enderecoCidadeUf: string
}): string {
  const busca = [endereco.enderecoRua, endereco.enderecoCidadeUf]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(', ')
  if (!busca) return 'https://www.google.com/maps'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busca)}`
}
