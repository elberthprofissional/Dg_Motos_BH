import { SITE, SITE_URL } from '../data/site'
import type { ConfigLoja } from './configLoja'
import type { Motorcycle } from '../types'
import {
  bikeModelName,
  bikeTitle,
  precoPareceIncompleto,
  precoRequerConfirmacao,
} from './format'

/** Schema da loja (AutoDealer) — injetado na home. Usa a config do painel. */
export function autoDealerSchema(config?: ConfigLoja): object {
  const endereco = config?.enderecoRua ?? SITE.endereco.rua
  const cidadeUf = config?.enderecoCidadeUf ?? SITE.endereco.cidadeUf
  const [cidade, uf] = cidadeUf.split(',').map((p) => p.trim())

  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    '@id': `${SITE_URL}/#loja`,
    name: 'DG Motos',
    slogan: SITE.slogan,
    url: SITE_URL,
    image: `${SITE_URL}/hero/showroom-2026-07-hd.webp`,
    logo: `${SITE_URL}/favicon.webp`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: endereco,
      addressLocality: cidade || SITE.cidade,
      addressRegion: uf || SITE.estado,
      addressCountry: 'BR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE.geo.latitude,
      longitude: SITE.geo.longitude,
    },
    sameAs: [config?.instagramUrl ?? SITE.instagram.url],
  }
}

/**
 * Schema do veículo (Car/Motorcycle) — injetado na página da moto.
 *
 * `descricao` permite publicar o texto editorial resolvido pela página
 * (ficha da linha ou texto de apoio) quando o cadastro ainda está vazio.
 *
 * Sem preço confiável não existe Offer: publicar uma oferta sem `price`
 * (ou com um valor em conferência) só gera aviso no Search Console.
 */
export function vehicleSchema(bike: Motorcycle, descricao = bike.descricao): object {
  const precoPublicavel =
    !precoPareceIncompleto(bike.preco) && !precoRequerConfirmacao(bike.preco)

  return {
    '@context': 'https://schema.org',
    '@type': 'Car',
    '@id': `${SITE_URL}/moto/${bike.slug}#veiculo`,
    name: `${bikeTitle(bike)} ${bike.ano}`,
    brand: { '@type': 'Brand', name: bike.marca },
    model: bikeModelName(bike),
    vehicleModelDate: String(bike.ano),
    // `!= null` (e não truthy): moto com 0 km é um dado válido.
    mileageFromOdometer:
      bike.quilometragem != null
        ? { '@type': 'QuantitativeValue', value: bike.quilometragem, unitCode: 'KMT' }
        : undefined,
    vehicleEngine: bike.cilindrada
      ? { '@type': 'EngineSpecification', engineDisplacement: `${bike.cilindrada} cc` }
      : undefined,
    image: bike.imagens.map((img) =>
      img.src.startsWith('http') ? img.src : `${SITE_URL}${img.src}`,
    ),
    description: descricao.trim() || undefined,
    offers: precoPublicavel
      ? {
          '@type': 'Offer',
          price: bike.preco,
          priceCurrency: 'BRL',
          availability:
            bike.status === 'disponivel'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/SoldOut',
          itemCondition: 'https://schema.org/UsedCondition',
          seller: { '@id': `${SITE_URL}/#loja` },
        }
      : undefined,
  }
}
