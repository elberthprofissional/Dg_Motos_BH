import { SITE, SITE_URL } from '../data/site'
import type { ConfigLoja } from './configLoja'
import type { Motorcycle } from '../types'

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
    image: `${SITE_URL}/hero/showroom.webp`,
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

/** Schema do veículo (Car/Motorcycle) — injetado na página da moto. */
export function vehicleSchema(bike: Motorcycle): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Car',
    '@id': `${SITE_URL}/moto/${bike.slug}#veiculo`,
    name: `${bike.marca} ${bike.modelo} ${bike.ano}`,
    brand: { '@type': 'Brand', name: bike.marca },
    model: bike.modelo,
    vehicleModelDate: String(bike.ano),
    mileageFromOdometer: bike.quilometragem
      ? { '@type': 'QuantitativeValue', value: bike.quilometragem, unitCode: 'KMT' }
      : undefined,
    vehicleEngine: bike.cilindrada
      ? { '@type': 'EngineSpecification', engineDisplacement: `${bike.cilindrada} cc` }
      : undefined,
    image: bike.imagens.map((img) => `${SITE_URL}${img.src}`),
    description: bike.descricao,
    offers: {
      '@type': 'Offer',
      price: bike.preco,
      priceCurrency: 'BRL',
      availability: bike.disponibilidade === 'disponivel'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
      itemCondition: 'https://schema.org/UsedCondition',
      seller: { '@id': `${SITE_URL}/#loja` },
    },
  }
}
