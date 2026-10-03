import {
  Bike,
  Home,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

/** Seções do painel. A ordem aqui é a ordem em que aparecem no menu. */
export type AbaAdmin =
  | 'painel'
  | 'estoque'
  | 'clientes'
  | 'financeiro'
  | 'relatorios'
  | 'config'

/**
 * Rótulo e ícone de cada seção.
 *
 * A navegação tem duas leituras: a sidebar do desktop mostra as seis, e a
 * barra inferior do celular mostra só as três primeiras mais um "Menu" que
 * abre as outras. Guardar rótulo, ícone e descrição num só lugar é o que
 * impede as duas de divergirem quando uma seção nova entrar.
 */
export interface SecaoAdmin {
  valor: AbaAdmin
  rotulo: string
  /** Versão curta para a barra inferior (largura é o limite). */
  curto: string
  /** Uma linha explicando o que a seção responde. */
  descricao: string
  /** Componente do Lucide: o tamanho é decidido por quem renderiza,
      porque a sidebar usa 18px e a barra inferior 20px. */
  icone: LucideIcon
}

export const SECOES: Record<AbaAdmin, SecaoAdmin> = {
  painel: {
    valor: 'painel',
    rotulo: 'Painel',
    curto: 'Painel',
    descricao: 'Como a loja está agora.',
    icone: Home,
  },
  estoque: {
    valor: 'estoque',
    rotulo: 'Estoque',
    curto: 'Estoque',
    descricao: 'Motos, fotos e preços.',
    icone: Bike,
  },
  clientes: {
    valor: 'clientes',
    rotulo: 'Clientes',
    curto: 'Clientes',
    descricao: 'Leads e acompanhamento.',
    icone: Users,
  },
  financeiro: {
    valor: 'financeiro',
    rotulo: 'Financeiro',
    curto: 'Financeiro',
    descricao: 'Vendas, faturamento e lucro.',
    icone: Wallet,
  },
  relatorios: {
    valor: 'relatorios',
    rotulo: 'Relatórios',
    curto: 'Relat.',
    descricao: 'Leads por semana e conversão.',
    icone: TrendingUp,
  },
  config: {
    valor: 'config',
    rotulo: 'Configurações',
    curto: 'Config',
    descricao: 'Loja, contato, endereço e senha.',
    icone: Settings,
  },
}

/** Ordem da sidebar (desktop) e do drawer's lista completa. */
export const ABAS: AbaAdmin[] = [
  'painel',
  'estoque',
  'clientes',
  'financeiro',
  'relatorios',
  'config',
]

/**
 * Abas da barra inferior do celular.
 *
 * Três destinos + o item "Menu", que abre as demais. Financeiro e
 * relatórios entram no Menu porque são consulta — o dono não precisa
 * alcançá-los com o polegar para fechar uma venda; Configurações também,
 * porque é a que menos muda. As três que ficam são as que operam a loja
 * no dia a dia.
 */
export const ABAS_BARRA: AbaAdmin[] = ['painel', 'estoque', 'clientes']

/** As três que só existem dentro do "Menu". */
export const ABAS_MENU: AbaAdmin[] = ['financeiro', 'relatorios', 'config']

export function tituloDaAba(aba: AbaAdmin): string {
  return SECOES[aba].rotulo
}