/**
 * Integração com o Google Maps.
 *
 * A URL de incorporação é o código oficial ("Incorporar mapa") do pin da
 * loja, o mesmo que já era usado em /contato. Vive aqui para que a home e
 * a página de contato não guardem duas URLs que precisam sair em sincronia:
 * se o dono trocar o endereço, é um lugar só para atualizar.
 *
 * Não há API key: o parâmetro `pb=` do embed é público por desenho, e o
 * `referrerPolicy` abaixo evita vazar a URL da página para o Google.
 *
 * Para gerar uma nova URL: Google Maps -> Compartilhar -> "Incorporar
 * mapa" -> copiar o valor de `src` do `<iframe>`.
 */

/** `src` do iframe, com o pin na entrada da loja (bairro Tupi, BH). */
export const MAPS_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3752.9850228882406!2d-43.92277602383706!3d-19.84058663553232!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa68534aede22ef%3A0x5442a33d1ba51e55!2sAv.%20Bas%C3%ADlio%20da%20Gama%2C%20139%20-%20Tupi%2C%20Belo%20Horizonte%20-%20MG%2C%2031842-610!5e0!3m2!1spt-BR!2sbr!4v1790940091410!5m2!1spt-BR!2sbr'

/** Link de rota para o app do Maps / Google Maps ("Como chegar"). */
export function buildMapsRouteUrl(mapsUrl: string): string {
  // O link do painel já é uma URL de busca do Google Maps; nesse formato
  // basta acrescentar o parâmetro que abre o app instalado no celular.
  try {
    const url = new URL(mapsUrl)
    url.searchParams.set('travelmode', 'driving')
    return url.toString()
  } catch {
    // URL inválida cadastrada no painel: devolve como está para o link não
    // virar um botão morto.
    return mapsUrl
  }
}