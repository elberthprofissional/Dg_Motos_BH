import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import {
  gravarConfig,
  gravarConfigNoBanco,
  lerConfig,
  lerConfigDoBanco,
  whatsappUrlCom,
} from '../../lib/configLoja'
import type { ConfigLoja } from '../../lib/configLoja'
import { formatPrice } from '../../lib/format'
import { buildMapsRouteUrl } from '../../lib/maps'
import type { Motorcycle } from '../../types'
import { InstagramIcon } from '../ui/InstagramIcon'
import { Toast } from '../ui/Toast'
import type { Feedback } from '../ui/Toast'
import { ModalInstalar } from './InstalarApp'
import { LixeiraSecao } from './LixeiraSecao'
import { useInstalarApp } from './useInstalarApp'

/**
 * ============================================================
 * AJUSTES DA LOJA — a mesa de trabalho
 * ============================================================
 * Cinco blocos independentes. O índice à esquerda mostra o valor que
 * está publicado em cada um; a ficha à direita edita só o bloco ativo.
 *
 * Salvar um bloco grava apenas os campos dele: um rascunho esquecido em
 * outro bloco nunca é publicado por acidente. O rascunho continua na
 * tela e o índice marca o que ainda está pendente.
 *
 * Os valores vêm do banco (fonte global) e do localStorage (cache). Se
 * o dono começa a digitar antes da leitura do banco terminar, os campos
 * já editados são preservados e só o restante é adotado.
 *
 * No celular o arranjo é outro: uma lista de blocos abre a ficha. Os
 * dois arranjos compartilham a mesma lógica e nunca são montados ao
 * mesmo tempo — assim não existem ids duplicados de campo.
 */

type Secao = 'contato' | 'instagram' | 'endereco' | 'horarios' | 'lixeira'
type SecaoConfig = Exclude<Secao, 'lixeira'>

interface DescricaoSecao {
  id: Secao
  rotulo: string
  descricao: string
  campos: readonly (keyof ConfigLoja)[]
  resumo: (config: ConfigLoja, naLixeira: number, valorLixeira: number) => string
  rotuloSalvar?: string
  mensagemSalva?: string
}

/* ------------------------------------------------------------------ */
/* Leitura e escrita dos campos                                        */
/* ------------------------------------------------------------------ */

function formatarWhatsapp(numero: string | null): string {
  if (!numero) return 'Sem número'
  const digitos = numero.replace(/\D/g, '')

  if (digitos.startsWith('55') && digitos.length === 13) {
    return `+55 (${digitos.slice(2, 4)}) ${digitos.slice(4, 9)}-${digitos.slice(9)}`
  }
  if (digitos.startsWith('55') && digitos.length === 12) {
    return `+55 (${digitos.slice(2, 4)}) ${digitos.slice(4, 8)}-${digitos.slice(8)}`
  }
  return digitos ? `+${digitos}` : 'Sem número'
}

function limparHandle(entrada: string): string {
  return entrada
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .split(/[?#]/)[0]
    .replace(/^@+/, '')
    .replace(/\/+$/, '')
    .trim()
}

function handleComArroba(entrada: string): string {
  const limpo = limparHandle(entrada)
  return limpo ? `@${limpo}` : ''
}

function urlDoHandle(entrada: string): string {
  const limpo = limparHandle(entrada)
  return limpo ? `https://instagram.com/${limpo}` : ''
}

function validarWhatsapp(numero: string | null): string | null {
  if (!numero) return null
  const digitos = numero.replace(/\D/g, '')
  if (digitos.length < 12 || digitos.length > 15) {
    return 'Informe DDI + DDD + número, só dígitos. Ex.: 5531999999999.'
  }
  return null
}

function validarHandle(entrada: string): string | null {
  const limpo = limparHandle(entrada)
  if (!limpo) return 'Informe o @ do perfil.'
  if (limpo.length > 30) return 'O @ do Instagram tem no máximo 30 caracteres.'
  if (!/^[a-zA-Z0-9._]+$/.test(limpo)) {
    return 'Use apenas letras, números, ponto e sublinhado — sem espaços.'
  }
  return null
}

function errosDaSecao(secao: SecaoConfig, config: ConfigLoja): Record<string, string> {
  const erros: Record<string, string> = {}

  if (secao === 'contato') {
    const erro = validarWhatsapp(config.whatsapp)
    if (erro) erros.whatsapp = erro
  }

  if (secao === 'instagram') {
    const erro = validarHandle(config.instagramHandle)
    if (erro) erros.instagramHandle = erro
  }

  if (secao === 'endereco') {
    if (!config.enderecoRua.trim()) erros.enderecoRua = 'Informe a rua e o número.'
    if (!config.enderecoCidadeUf.trim()) erros.enderecoCidadeUf = 'Informe a cidade e o estado.'
  }

  if (secao === 'horarios') {
    const incompleta = config.horarios.some(
      (horario) => !horario.dias.trim() || !horario.horas.trim(),
    )
    if (incompleta) {
      erros.horarios =
        'Cada faixa precisa de dias e de horário. Preencha ou remova a linha em branco.'
    }
  }

  return erros
}

function normalizarSecao(secao: SecaoConfig, config: ConfigLoja): ConfigLoja {
  if (secao === 'contato') {
    return {
      ...config,
      whatsapp: config.whatsapp ? config.whatsapp.replace(/\D/g, '') : null,
    }
  }

  if (secao === 'instagram') {
    const handle = handleComArroba(config.instagramHandle)
    return {
      ...config,
      instagramHandle: handle,
      instagramUrl: urlDoHandle(handle),
    }
  }

  if (secao === 'endereco') {
    return {
      ...config,
      enderecoRua: config.enderecoRua.trim(),
      enderecoCidadeUf: config.enderecoCidadeUf.trim(),
    }
  }

  return {
    ...config,
    horarios: config.horarios.map((horario) => ({
      dias: horario.dias.trim(),
      horas: horario.horas.trim(),
    })),
  }
}

function mesclarSecao(base: ConfigLoja, rascunho: ConfigLoja, secao: SecaoConfig): ConfigLoja {
  if (secao === 'contato') return { ...base, whatsapp: rascunho.whatsapp }

  if (secao === 'instagram') {
    return {
      ...base,
      instagramHandle: rascunho.instagramHandle,
      instagramUrl: rascunho.instagramUrl,
    }
  }

  if (secao === 'endereco') {
    return {
      ...base,
      enderecoRua: rascunho.enderecoRua,
      enderecoCidadeUf: rascunho.enderecoCidadeUf,
    }
  }

  return { ...base, horarios: rascunho.horarios }
}

function comCampos<T extends object>(base: T, origem: T, campos: Iterable<keyof T>): T {
  const proximo = { ...base }
  for (const campo of campos) proximo[campo] = origem[campo]
  return proximo
}

function horaAgora(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

function primeiroCampoInvalido(secao: SecaoConfig, config: ConfigLoja): string | null {
  if (secao === 'contato') return validarWhatsapp(config.whatsapp) ? 'cfg-whatsapp' : null
  if (secao === 'instagram') return validarHandle(config.instagramHandle) ? 'cfg-instagram' : null
  if (secao === 'endereco') {
    if (!config.enderecoRua.trim()) return 'cfg-endereco-rua'
    if (!config.enderecoCidadeUf.trim()) return 'cfg-endereco-cidade'
    return null
  }

  const indice = config.horarios.findIndex(
    (horario) => !horario.dias.trim() || !horario.horas.trim(),
  )
  if (indice < 0) return null
  return !config.horarios[indice].dias.trim()
    ? `cfg-horario-dias-${indice}`
    : `cfg-horario-horas-${indice}`
}

/* ------------------------------------------------------------------ */
/* Blocos                                                              */
/* ------------------------------------------------------------------ */

const SECOES: DescricaoSecao[] = [
  {
    id: 'contato',
    rotulo: 'Contato',
    descricao:
      'O número que abre os botões de WhatsApp do site. Só dígitos, com DDI e DDD — sem espaços, traços ou parênteses.',
    campos: ['whatsapp'],
    resumo: (config) =>
      config.whatsapp ? formatarWhatsapp(config.whatsapp) : 'Sem número definido',
    rotuloSalvar: 'Salvar contato',
    mensagemSalva: 'Contato salvo. Os botões do site já usam o novo número.',
  },
  {
    id: 'instagram',
    rotulo: 'Instagram',
    descricao:
      'O @ publicado no cabeçalho, no rodapé e na página de contato. O link final é montado a partir dele.',
    campos: ['instagramHandle', 'instagramUrl'],
    resumo: (config) => config.instagramHandle || 'Sem perfil definido',
    rotuloSalvar: 'Salvar Instagram',
    mensagemSalva: 'Instagram salvo. O link do perfil já foi atualizado no site.',
  },
  {
    id: 'endereco',
    rotulo: 'Endereço',
    descricao:
      'Rua, número e cidade usados no rodapé e no botão de rota do Google Maps. O link do mapa nasce desta ficha.',
    campos: ['enderecoRua', 'enderecoCidadeUf'],
    resumo: (config) => config.enderecoRua || 'Sem endereço definido',
    rotuloSalvar: 'Salvar endereço',
    mensagemSalva: 'Endereço salvo. O mapa e o rodapé já usam o novo endereço.',
  },
  {
    id: 'horarios',
    rotulo: 'Horários',
    descricao:
      'As faixas de atendimento exibidas no rodapé e na página de contato. A ordem das linhas é a ordem publicada.',
    campos: ['horarios'],
    resumo: (config) =>
      config.horarios.length === 0
        ? 'Nenhuma faixa'
        : config.horarios.map((horario) => `${horario.dias} ${horario.horas}`).join(' · '),
    rotuloSalvar: 'Salvar horários',
    mensagemSalva: 'Horários salvos. O rodapé e a página de contato já mostram as novas faixas.',
  },
  {
    id: 'lixeira',
    rotulo: 'Lixeira',
    descricao:
      'Motos excluídas do estoque. Restaure para voltar ao pátio; o que ficar 30 dias aqui é apagado de vez, junto com as fotos.',
    campos: [],
    resumo: (_config, naLixeira, valorLixeira) =>
      naLixeira === 0
        ? 'Vazia'
        : `${naLixeira} ${naLixeira === 1 ? 'moto' : 'motos'} · ${formatPrice(valorLixeira)}`,
  },
]

function metaDaSecao(id: Secao): DescricaoSecao {
  return SECOES.find((secao) => secao.id === id) ?? SECOES[0]
}

function secaoSuja(secao: Secao, config: ConfigLoja, salvo: ConfigLoja): boolean {
  const { campos } = metaDaSecao(secao)
  return campos.some(
    (campo) => JSON.stringify(config[campo]) !== JSON.stringify(salvo[campo]),
  )
}

/* ------------------------------------------------------------------ */
/* Peças de interface                                                  */
/* ------------------------------------------------------------------ */

function Campo({
  id,
  rotulo,
  dica,
  erro,
  children,
}: {
  id: string
  rotulo: string
  dica?: ReactNode
  erro?: string | null
  children: ReactNode
}) {
  return (
    <div className="mesa-campo">
      <label htmlFor={id} className="mesa-campo-rotulo">
        {rotulo}
      </label>
      {children}
      {dica ? (
        <p id={`${id}-dica`} className="mesa-campo-dica">
          {dica}
        </p>
      ) : null}
      {erro ? (
        <p id={`${id}-erro`} role="alert" className="mesa-campo-erro">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {erro}
        </p>
      ) : null}
    </div>
  )
}

const CONSULTA_MESA = '(min-width: 1024px)'

function assinarTelaDeMesa(avisar: () => void) {
  const consulta = window.matchMedia(CONSULTA_MESA)
  consulta.addEventListener('change', avisar)
  return () => consulta.removeEventListener('change', avisar)
}

function lerTelaDeMesa() {
  return window.matchMedia(CONSULTA_MESA).matches
}

/** `true` em tela de mesa — o mesmo corte do `lg:` do Tailwind. */
function useTelaDeMesa(): boolean {
  return useSyncExternalStore(assinarTelaDeMesa, lerTelaDeMesa, () => false)
}

interface ConfiguracoesTabProps {
  /** Motos na lixeira; `null` enquanto o estoque carrega. */
  lixeira: Motorcycle[] | null
  erroLixeira: string | null
  onRestaurarDaLixeira: (moto: Motorcycle) => void | Promise<void>
  onApagarDeVez: (moto: Motorcycle) => void
  onEsvaziarLixeira: () => void
  onIrParaEstoque: () => void
  onRecarregar: () => void | Promise<void>
}

export function ConfiguracoesTab({
  lixeira,
  erroLixeira,
  onRestaurarDaLixeira,
  onApagarDeVez,
  onEsvaziarLixeira,
  onIrParaEstoque,
  onRecarregar,
}: ConfiguracoesTabProps) {
  const mesa = useTelaDeMesa()
  const app = useInstalarApp()

  const [config, setConfig] = useState<ConfigLoja>(() => lerConfig())
  const [salvo, setSalvo] = useState<ConfigLoja>(config)
  const [secao, setSecao] = useState<Secao | null>(null)
  const [sincronizando, setSincronizando] = useState(true)
  const [salvando, setSalvando] = useState<SecaoConfig | null>(null)
  const [reenviando, setReenviando] = useState(false)
  const [falhaBanco, setFalhaBanco] = useState(false)
  const [ultimoSalvoEm, setUltimoSalvoEm] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [tentouSalvar, setTentouSalvar] = useState(false)
  const [tocados, setTocados] = useState<Record<string, boolean>>({})

  // Campos mexidos desde a abertura. Na leitura do banco, só eles ficam
  // com o rascunho; o resto adota o valor publicado.
  const editados = useRef<Set<keyof ConfigLoja>>(new Set())
  const abaRefs = useRef<(HTMLButtonElement | null)[]>([])
  const voltarRef = useRef<HTMLButtonElement>(null)

  const totalLixeira = lixeira?.length ?? 0
  const valorLixeira = (lixeira ?? []).reduce((total, moto) => total + moto.preco, 0)
  const secaoAtiva = secao ?? 'contato'
  const metaAtiva = metaDaSecao(secaoAtiva)

  const secoesSujas = SECOES.filter(
    (bloco) => bloco.id !== 'lixeira' && secaoSuja(bloco.id, config, salvo),
  )
  const totalPendentes = secoesSujas.length

  // O banco é a fonte global. A leitura inicial chega depois do primeiro
  // render; se o dono já digitou, o rascunho dele vence campo a campo.
  useEffect(() => {
    let ativo = true

    void lerConfigDoBanco()
      .then((doBanco) => {
        if (!ativo || !doBanco) return
        setConfig((atual) => comCampos(doBanco, atual, editados.current))
        setSalvo(doBanco)
      })
      .catch(() => {
        // Sem banco, o localStorage continua sendo a fonte deste aparelho.
      })
      .finally(() => {
        if (ativo) setSincronizando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  // Edição não salva não deve sumir num F5 ou ao fechar a aba sem aviso.
  useEffect(() => {
    if (totalPendentes === 0) return

    function aoSair(evento: BeforeUnloadEvent) {
      evento.preventDefault()
      evento.returnValue = ''
    }

    window.addEventListener('beforeunload', aoSair)
    return () => window.removeEventListener('beforeunload', aoSair)
  }, [totalPendentes])

  // No celular, abrir uma ficha começa do topo e leva o foco para a
  // volta — sem isso, quem navega por teclado fica sem referência.
  useEffect(() => {
    if (mesa || !secao) return
    window.scrollTo({ top: 0, behavior: 'auto' })
    voltarRef.current?.focus({ preventScroll: true })
  }, [mesa, secao])

  function definir<K extends keyof ConfigLoja>(campo: K, valor: ConfigLoja[K]) {
    editados.current.add(campo)
    setConfig((atual) => ({ ...atual, [campo]: valor }))
  }

  function definirInstagram(valor: string) {
    const limpo = valor
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
      .split(/[?#]/)[0]
    editados.current.add('instagramHandle')
    editados.current.add('instagramUrl')
    setConfig((atual) => ({
      ...atual,
      instagramHandle: limpo,
      instagramUrl: urlDoHandle(limpo),
    }))
  }

  function marcarTocado(campo: string) {
    setTocados((atuais) => (atuais[campo] ? atuais : { ...atuais, [campo]: true }))
  }

  function abrirSecao(proxima: Secao) {
    setSecao(proxima)
    setTentouSalvar(false)
  }

  function voltarAoHub() {
    setSecao(null)
    setTentouSalvar(false)
  }

  function aoTeclarAba(evento: ReactKeyboardEvent<HTMLButtonElement>, indice: number) {
    let destino: number | null = null
    const total = SECOES.length

    if (evento.key === 'ArrowDown' || evento.key === 'ArrowRight') {
      destino = (indice + 1) % total
    } else if (evento.key === 'ArrowUp' || evento.key === 'ArrowLeft') {
      destino = (indice - 1 + total) % total
    } else if (evento.key === 'Home') {
      destino = 0
    } else if (evento.key === 'End') {
      destino = total - 1
    }

    if (destino === null) return
    evento.preventDefault()
    abrirSecao(SECOES[destino].id)
    abaRefs.current[destino]?.focus()
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()

    if (secaoAtiva === 'lixeira' || salvando !== null || sincronizando) return
    if (!secaoSuja(secaoAtiva, config, salvo)) return

    setTentouSalvar(true)
    const erros = errosDaSecao(secaoAtiva, config)
    if (Object.keys(erros).length > 0) {
      const campo = primeiroCampoInvalido(secaoAtiva, config)
      if (campo) {
        requestAnimationFrame(() => document.getElementById(campo)?.focus())
      }
      return
    }

    const meta = metaDaSecao(secaoAtiva)
    const normalizada = normalizarSecao(secaoAtiva, config)
    const proximo = mesclarSecao(salvo, normalizada, secaoAtiva)

    setSalvando(secaoAtiva)
    setFalhaBanco(false)

    // O site da loja lê do localStorage na hora; o banco confirma depois.
    gravarConfig(proximo)
    const confirmouNoBanco = await gravarConfigNoBanco(proximo)

    setSalvando(null)
    setSalvo(proximo)
    setConfig((atual) => comCampos(atual, normalizada, meta.campos))
    for (const campo of meta.campos) editados.current.delete(campo)
    setTentouSalvar(false)

    const hora = horaAgora()
    setUltimoSalvoEm(hora)

    if (confirmouNoBanco) {
      setFeedback({ tipo: 'ok', texto: meta.mensagemSalva ?? 'Bloco salvo.' })
    } else {
      setFalhaBanco(true)
      setFeedback({
        tipo: 'erro',
        texto:
          'Salvo neste aparelho, mas o banco não respondeu. O site local já usa os valores; tente sincronizar de novo.',
      })
    }
  }

  async function reenviarBanco() {
    if (reenviando) return
    setReenviando(true)
    const confirmou = await gravarConfigNoBanco(salvo)
    setReenviando(false)

    if (confirmou) {
      setFalhaBanco(false)
      setUltimoSalvoEm(horaAgora())
      setFeedback({
        tipo: 'ok',
        texto: 'Banco sincronizado. A loja inteira já recebe estes valores.',
      })
    } else {
      setFeedback({
        tipo: 'erro',
        texto: 'O banco continua sem responder. Verifique a conexão e tente de novo.',
      })
    }
  }

  function statusDaSecao(id: Secao): {
    texto: string
    tom: 'ok' | 'pendente' | 'erro' | 'neutro'
  } {
    if (sincronizando) return { texto: 'Lendo o banco…', tom: 'neutro' }
    if (salvando === id) return { texto: 'Salvando…', tom: 'neutro' }
    if (secaoSuja(id, config, salvo)) return { texto: 'Alterações não salvas', tom: 'pendente' }
    if (falhaBanco) return { texto: 'Salvo só neste aparelho', tom: 'erro' }
    if (ultimoSalvoEm) return { texto: `Salvo às ${ultimoSalvoEm}`, tom: 'ok' }
    return { texto: 'Sem alterações', tom: 'neutro' }
  }

  function renderPlacar(): ReactNode {
    if (sincronizando) {
      return (
        <>
          <p className="mesa-placar-rotulo">Estado da loja</p>
          <p className="mesa-placar-linha">
            <span className="mesa-ponto" data-tom="neutro" aria-hidden="true" />
            <span className="mesa-placar-valor">Lendo o banco</span>
          </p>
          <p className="mesa-placar-nota">Buscando os valores que já estão publicados.</p>
        </>
      )
    }

    if (salvando) {
      return (
        <>
          <p className="mesa-placar-rotulo">Estado da loja</p>
          <p className="mesa-placar-linha">
            <span className="mesa-ponto" data-tom="neutro" aria-hidden="true" />
            <span className="mesa-placar-valor">Gravando ajustes</span>
          </p>
          <p className="mesa-placar-nota">
            Salvando {metaDaSecao(salvando).rotulo.toLowerCase()} neste momento.
          </p>
        </>
      )
    }

    if (totalPendentes > 0) {
      return (
        <>
          <p className="mesa-placar-rotulo">Estado da loja</p>
          <p className="mesa-placar-linha">
            <span className="mesa-ponto" data-tom="pendente" aria-hidden="true" />
            <span className="mesa-placar-valor">
              {totalPendentes} {totalPendentes === 1 ? 'bloco em edição' : 'blocos em edição'}
            </span>
          </p>
          <p className="mesa-placar-nota">
            Cada bloco tem o próprio botão de salvar. Nada foi publicado ainda.
          </p>
        </>
      )
    }

    if (falhaBanco) {
      return (
        <>
          <p className="mesa-placar-rotulo">Estado da loja</p>
          <p className="mesa-placar-linha">
            <span className="mesa-ponto" data-tom="erro" aria-hidden="true" />
            <span className="mesa-placar-valor">Banco pendente</span>
          </p>
          <p className="mesa-placar-nota">
            Os valores valem neste aparelho; falta gravar no banco.
          </p>
        </>
      )
    }

    return (
      <>
        <p className="mesa-placar-rotulo">Estado da loja</p>
        <p className="mesa-placar-linha">
          <span className="mesa-ponto" data-tom="ok" aria-hidden="true" />
          <span className="mesa-placar-valor">Tudo em dia</span>
        </p>
        <p className="mesa-placar-nota">
          {ultimoSalvoEm
            ? `Último envio às ${ultimoSalvoEm}.`
            : 'Nenhum bloco editado desde que o painel abriu.'}
        </p>
      </>
    )
  }

  /* ------------------------------------------------------------------ */
  /* Campos por bloco                                                    */
  /* ------------------------------------------------------------------ */

  function renderCampos(id: SecaoConfig): ReactNode {
    const erros = errosDaSecao(id, config)
    const erroDe = (campo: string) => {
      const erro = erros[campo]
      return erro && (tentouSalvar || tocados[campo]) ? erro : null
    }

    if (id === 'contato') {
      const erroWhatsapp = erroDe('whatsapp')
      return (
        <div className="mesa-campos">
          <Campo
            id="cfg-whatsapp"
            rotulo="WhatsApp da loja"
            dica="Só números, com DDI e DDD. É o número que abre os botões de WhatsApp do site."
            erro={erroWhatsapp}
          >
            <input
              id="cfg-whatsapp"
              className="mesa-entrada numeros"
              value={config.whatsapp ?? ''}
              inputMode="numeric"
              autoComplete="tel"
              placeholder="5531999999999"
              aria-invalid={Boolean(erroWhatsapp)}
              aria-describedby={
                erroWhatsapp ? 'cfg-whatsapp-dica cfg-whatsapp-erro' : 'cfg-whatsapp-dica'
              }
              onChange={(evento) =>
                definir('whatsapp', evento.target.value.replace(/\D/g, '').slice(0, 15) || null)
              }
              onBlur={() => marcarTocado('whatsapp')}
            />
          </Campo>
        </div>
      )
    }

    if (id === 'instagram') {
      const erroInstagram = erroDe('instagramHandle')
      return (
        <div className="mesa-campos">
          <Campo
            id="cfg-instagram"
            rotulo="Perfil no Instagram"
            dica="Só o @, sem URL. O link final é montado automaticamente."
            erro={erroInstagram}
          >
            <input
              id="cfg-instagram"
              className="mesa-entrada"
              value={config.instagramHandle}
              autoComplete="off"
              spellCheck={false}
              placeholder="@dgmotosbh"
              aria-invalid={Boolean(erroInstagram)}
              aria-describedby={
                erroInstagram ? 'cfg-instagram-dica cfg-instagram-erro' : 'cfg-instagram-dica'
              }
              onChange={(evento) => definirInstagram(evento.target.value)}
              onBlur={() => marcarTocado('instagramHandle')}
            />
          </Campo>
        </div>
      )
    }

    if (id === 'endereco') {
      const erroRua = erroDe('enderecoRua')
      const erroCidade = erroDe('enderecoCidadeUf')
      return (
        <div className="mesa-campos">
          <div className="mesa-dupla">
            <Campo
              id="cfg-endereco-rua"
              rotulo="Rua e número"
              erro={erroRua}
            >
              <input
                id="cfg-endereco-rua"
                className="mesa-entrada"
                value={config.enderecoRua}
                autoComplete="street-address"
                placeholder="Av. Basílio da Gama, 139"
                aria-invalid={Boolean(erroRua)}
                aria-describedby={erroRua ? 'cfg-endereco-rua-erro' : undefined}
                onChange={(evento) => definir('enderecoRua', evento.target.value)}
                onBlur={() => marcarTocado('enderecoRua')}
              />
            </Campo>

            <Campo
              id="cfg-endereco-cidade"
              rotulo="Cidade e estado"
              erro={erroCidade}
            >
              <input
                id="cfg-endereco-cidade"
                className="mesa-entrada"
                value={config.enderecoCidadeUf}
                autoComplete="address-level2"
                placeholder="Belo Horizonte, MG"
                aria-invalid={Boolean(erroCidade)}
                aria-describedby={erroCidade ? 'cfg-endereco-cidade-erro' : undefined}
                onChange={(evento) => definir('enderecoCidadeUf', evento.target.value)}
                onBlur={() => marcarTocado('enderecoCidadeUf')}
              />
            </Campo>
          </div>
        </div>
      )
    }

    const erroHorarios = erroDe('horarios')
    const descricaoHorarios = erroHorarios
      ? 'cfg-horarios-dica cfg-horarios-erro'
      : 'cfg-horarios-dica'

    return (
      <div className="mesa-campos">
        <div
          className="mesa-campo"
          role="group"
          aria-labelledby="cfg-horarios-titulo"
          aria-describedby={descricaoHorarios}
        >
          <p id="cfg-horarios-titulo" className="mesa-campo-rotulo">
            Faixas de atendimento
          </p>

          {config.horarios.length === 0 ? (
            <p className="mesa-nota-vazio">
              Nenhuma faixa cadastrada. O site mostra um pedido para confirmar o horário antes
              da visita.
            </p>
          ) : (
            <div className="mesa-horarios">
              {config.horarios.map((horario, indice) => {
                const linhaIncompleta = !horario.dias.trim() || !horario.horas.trim()
                return (
                  <div className="mesa-horario" key={indice}>
                    <input
                      id={`cfg-horario-dias-${indice}`}
                      className="mesa-entrada"
                      value={horario.dias}
                      placeholder="Seg a Sex"
                      aria-label={`Dias da faixa ${indice + 1}`}
                      aria-invalid={Boolean(erroHorarios) && linhaIncompleta}
                      aria-describedby={descricaoHorarios}
                      onChange={(evento) => {
                        const novas = [...config.horarios]
                        novas[indice] = { ...horario, dias: evento.target.value }
                        definir('horarios', novas)
                      }}
                      onBlur={() => marcarTocado('horarios')}
                    />
                    <input
                      id={`cfg-horario-horas-${indice}`}
                      className="mesa-entrada numeros"
                      value={horario.horas}
                      placeholder="9h–18h"
                      aria-label={`Horário da faixa ${indice + 1}`}
                      aria-invalid={Boolean(erroHorarios) && linhaIncompleta}
                      aria-describedby={descricaoHorarios}
                      onChange={(evento) => {
                        const novas = [...config.horarios]
                        novas[indice] = { ...horario, horas: evento.target.value }
                        definir('horarios', novas)
                      }}
                      onBlur={() => marcarTocado('horarios')}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        definir(
                          'horarios',
                          config.horarios.filter((_, posicao) => posicao !== indice),
                        )
                      }
                      aria-label={`Remover faixa ${horario.dias || indice + 1}`}
                      className="mesa-remover"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => definir('horarios', [...config.horarios, { dias: '', horas: '' }])}
            className="mesa-adicionar"
          >
            <Plus className="size-4" aria-hidden="true" />
            Adicionar faixa
          </button>

          {erroHorarios ? (
            <p id="cfg-horarios-erro" role="alert" className="mesa-campo-erro">
              <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              {erroHorarios}
            </p>
          ) : null}

          <p id="cfg-horarios-dica" className="mesa-campo-dica">
            Ex.: “Seg a Sex” e “9h–18h”. A ordem das linhas é a ordem publicada no site.
          </p>
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------------ */
  /* Prévia do que o site publica                                        */
  /* ------------------------------------------------------------------ */

  function renderSaida(id: SecaoConfig): ReactNode {
    if (id === 'contato') {
      const linkTeste = whatsappUrlCom(
        config,
        'Olá! Estou testando o botão do site da DG Motos.',
      )

      return (
        <aside className="mesa-saida" aria-label="Prévia do que o site publica">
          <p className="mesa-saida-rotulo">No site</p>
          <div className="mesa-saida-cartao">
            <p className="mesa-saida-numero numeros">
              {config.whatsapp ? formatarWhatsapp(config.whatsapp) : 'Sem número'}
            </p>
            <p className="mesa-saida-texto">Botões de WhatsApp e página de contato</p>
            {linkTeste ? (
              <a
                href={linkTeste}
                target="_blank"
                rel="noopener noreferrer"
                className="mesa-saida-link"
              >
                Abrir conversa no WhatsApp
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            ) : (
              <p className="mesa-saida-vazio">
                Sem número, os botões do site levam à página de contato.
              </p>
            )}
          </div>
        </aside>
      )
    }

    if (id === 'instagram') {
      const handle = handleComArroba(config.instagramHandle)
      const link = urlDoHandle(handle)

      return (
        <aside className="mesa-saida" aria-label="Prévia do que o site publica">
          <p className="mesa-saida-rotulo">No site</p>
          <div className="mesa-saida-cartao">
            <div className="mesa-saida-perfil">
              <span className="mesa-saida-icone">
                <InstagramIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="mesa-saida-handle">{handle || 'Sem perfil'}</p>
                <p className="mesa-saida-texto">Cabeçalho, rodapé e contato</p>
              </div>
            </div>
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="mesa-saida-link"
              >
                Abrir perfil no Instagram
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            ) : (
              <p className="mesa-saida-vazio">Sem perfil, o link não aparece no site.</p>
            )}
          </div>
        </aside>
      )
    }

    if (id === 'endereco') {
      const rua = config.enderecoRua.trim()
      const cidade = config.enderecoCidadeUf.trim()

      return (
        <aside className="mesa-saida" aria-label="Prévia do que o site publica">
          <p className="mesa-saida-rotulo">No site</p>
          <div className="mesa-saida-cartao">
            <p className="mesa-saida-endereco">{rua || 'Rua e número'}</p>
            <p className="mesa-saida-cidade">{cidade || 'Cidade e estado'}</p>
            {rua || cidade ? (
              <a
                href={buildMapsRouteUrl(config)}
                target="_blank"
                rel="noopener noreferrer"
                className="mesa-saida-link"
              >
                Testar rota no Google Maps
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            ) : (
              <p className="mesa-saida-vazio">
                Preencha o endereço para gerar o link do mapa.
              </p>
            )}
          </div>
        </aside>
      )
    }

    const faixas = config.horarios.filter(
      (horario) => horario.dias.trim() || horario.horas.trim(),
    )

    return (
      <aside className="mesa-saida" aria-label="Prévia do que o site publica">
        <p className="mesa-saida-rotulo">No site</p>
        <div className="mesa-saida-cartao">
          {faixas.length === 0 ? (
            <p className="mesa-saida-vazio">
              Sem faixas — o site pede confirmação antes da visita.
            </p>
          ) : (
            <div className="mesa-saida-placa">
              {config.horarios.map((horario, indice) => (
                <div className="mesa-saida-horario" key={indice}>
                  <span>{horario.dias.trim() || 'Dia a definir'}</span>
                  <span className="numeros">{horario.horas.trim() || 'Horário a definir'}</span>
                </div>
              ))}
            </div>
          )}
          <p className="mesa-saida-texto">Rodapé e página de contato</p>
        </div>
      </aside>
    )
  }

  /* ------------------------------------------------------------------ */
  /* Pé de gravação                                                      */
  /* ------------------------------------------------------------------ */

  function renderPe(id: SecaoConfig): ReactNode {
    const meta = metaDaSecao(id)
    const suja = secaoSuja(id, config, salvo)
    const salvandoEste = salvando === id
    const podeTentar = !sincronizando && salvando === null && suja

    return (
      <footer className="mesa-folha-pe">
        <div className="mesa-pe-estado" role="status">
          {sincronizando ? (
            <>
              <span className="mesa-ponto" data-tom="neutro" aria-hidden="true" />
              Lendo os valores publicados no banco…
            </>
          ) : salvando ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Gravando {metaDaSecao(salvando).rotulo.toLowerCase()}…
            </>
          ) : suja ? (
            <>
              <span className="mesa-ponto" data-tom="pendente" aria-hidden="true" />
              Alterações neste bloco ainda não foram salvas.
            </>
          ) : falhaBanco ? (
            <>
              <span className="mesa-ponto" data-tom="erro" aria-hidden="true" />
              Salvo neste aparelho. O banco não confirmou.
            </>
          ) : ultimoSalvoEm ? (
            <>
              <span className="mesa-ponto" data-tom="ok" aria-hidden="true" />
              Salvo às {ultimoSalvoEm}. O site já usa estes valores.
            </>
          ) : (
            <>Nenhuma alteração pendente.</>
          )}

          {falhaBanco && !suja && !salvando && !sincronizando ? (
            <button
              type="button"
              onClick={() => void reenviarBanco()}
              className="mesa-pe-reenviar"
              aria-disabled={reenviando}
            >
              {reenviando ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="size-3.5" aria-hidden="true" />
              )}
              {reenviando ? 'Sincronizando…' : 'Sincronizar com o banco'}
            </button>
          ) : null}
        </div>

        <div className="mesa-pe-acoes">
          <button
            type="submit"
            className="mesa-btn-salvar"
            aria-disabled={!podeTentar}
            data-salvando={salvandoEste}
            onClick={(evento) => {
              if (!podeTentar) evento.preventDefault()
            }}
          >
            {salvandoEste ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Salvando…
              </>
            ) : (
              meta.rotuloSalvar ?? 'Salvar'
            )}
          </button>
        </div>
      </footer>
    )
  }

  function renderSecao(id: Secao): ReactNode {
    if (id === 'lixeira') {
      return (
        <div className="mesa-folha-corpo mesa-folha-corpo--lixo">
          <LixeiraSecao
            motos={lixeira}
            erro={erroLixeira}
            onRestaurar={onRestaurarDaLixeira}
            onApagarDeVez={onApagarDeVez}
            onEsvaziar={onEsvaziarLixeira}
            onIrParaEstoque={onIrParaEstoque}
            onRecarregar={onRecarregar}
          />
        </div>
      )
    }

    return (
      <form className="mesa-formulario" onSubmit={aoSubmeter} noValidate key={id}>
        <div className="mesa-folha-corpo">
          <div className="mesa-form">
            {renderCampos(id)}
            {renderSaida(id)}
          </div>
        </div>
        {renderPe(id)}
      </form>
    )
  }

  /* ------------------------------------------------------------------ */
  /* Cabeçalho da ficha                                                  */
  /* ------------------------------------------------------------------ */

  function renderCabecalhoSecao(): ReactNode {
    const status = statusDaSecao(secaoAtiva)

    return (
      <div className="mesa-folha-topo">
        <div className="mesa-folha-topo-texto">
          <h2 className="mesa-folha-titulo">{metaAtiva.rotulo}</h2>
          <p className="mesa-folha-desc">{metaAtiva.descricao}</p>
        </div>
        {secaoAtiva === 'lixeira' ? (
          <span className="mesa-selo">Área de risco</span>
        ) : (
          <span className="mesa-estado" data-tom={status.tom}>
            <span className="mesa-ponto" aria-hidden="true" />
            {status.texto}
          </span>
        )}
      </div>
    )
  }

  /* ------------------------------------------------------------------ */
  /* Desktop                                                             */
  /* ------------------------------------------------------------------ */

  const telaDesktop = (
    <div className="mesa">
      <header className="mesa-topo">
        <div className="mesa-topo-texto">
          <p className="mesa-kicker">Painel da loja</p>
          <h1 className="mesa-titulo">Configurações</h1>
          <p className="mesa-sub">
            O contato, o perfil e o endereço que o site publica. A Lixeira fica no fim: é
            para onde vai uma moto excluída antes de sumir de vez.
          </p>
        </div>
        <div className="mesa-placar">{renderPlacar()}</div>
      </header>

      <div className="mesa-grade">
        <div className="mesa-indice">
          <nav
            className="mesa-nav"
            role="tablist"
            aria-label="Blocos de ajuste"
            aria-orientation="vertical"
          >
            {SECOES.map((bloco, indice) => {
              const selecionada = bloco.id === secaoAtiva
              const suja = bloco.id !== 'lixeira' && secaoSuja(bloco.id, config, salvo)

              return (
                <button
                  key={bloco.id}
                  ref={(elemento) => {
                    abaRefs.current[indice] = elemento
                  }}
                  id={`aba-${bloco.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selecionada}
                  aria-controls={`painel-${bloco.id}`}
                  tabIndex={selecionada ? 0 : -1}
                  onClick={() => abrirSecao(bloco.id)}
                  onKeyDown={(evento) => aoTeclarAba(evento, indice)}
                  className="mesa-nav-item"
                >
                  <span className="mesa-nav-rotulo">
                    {bloco.rotulo}
                    {suja ? (
                      <span className="mesa-nav-pendente" title="Alterações não salvas">
                        <span className="sr-only">Alterações não salvas</span>
                      </span>
                    ) : null}
                  </span>
                  {bloco.id === 'lixeira' && totalLixeira > 0 ? (
                    <span className="mesa-nav-contagem">
                      {totalLixeira}
                      <span className="sr-only">
                        {totalLixeira === 1 ? ' moto na lixeira' : ' motos na lixeira'}
                      </span>
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>

          <div className="mesa-app">
            <div className="mesa-app-texto">
              <p className="mesa-app-titulo">Aplicativo do painel</p>
              <p className="mesa-app-nota">
                {app.instalado
                  ? 'Instalado neste aparelho.'
                  : 'Abre em tela cheia, direto da tela inicial do celular.'}
              </p>
            </div>
            <button type="button" onClick={app.abrir} className="mesa-btn-secundario">
              {app.instalado ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              {app.instalado ? 'Instalado' : 'Instalar app'}
            </button>
          </div>
        </div>

        <section
          className={`mesa-folha ${secaoAtiva === 'lixeira' ? 'mesa-folha--perigo' : ''}`}
          id={`painel-${secaoAtiva}`}
          role="tabpanel"
          aria-labelledby={`aba-${secaoAtiva}`}
        >
          {renderCabecalhoSecao()}
          {renderSecao(secaoAtiva)}
        </section>
      </div>
    </div>
  )

  /* ------------------------------------------------------------------ */
  /* Celular                                                             */
  /* ------------------------------------------------------------------ */

  const statusMobile = secao ? statusDaSecao(secao) : null

  const telaCelular = secao ? (
    <div className="mx-auto max-w-2xl">
      <header className="mesa-mobile-cabecalho">
        <div className="mesa-mobile-voltar">
          <button
            ref={voltarRef}
            type="button"
            onClick={voltarAoHub}
            aria-label="Voltar para as configurações"
            className="mesa-mobile-voltar-botao"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="mesa-mobile-kicker">Configurações</p>
            <h1 className="painel-h1">{metaAtiva.rotulo}</h1>
          </div>
        </div>
        <p className="mesa-mobile-desc">{metaAtiva.descricao}</p>
        {secao === 'lixeira' ? (
          <span className="mesa-selo mesa-mobile-selo">Área de risco</span>
        ) : statusMobile ? (
          <span className="mesa-estado mesa-mobile-selo" data-tom={statusMobile.tom}>
            <span className="mesa-ponto" aria-hidden="true" />
            {statusMobile.texto}
          </span>
        ) : null}
      </header>

      <section
        className={`mesa-folha mt-4 ${secao === 'lixeira' ? 'mesa-folha--perigo' : ''}`}
        aria-label={metaAtiva.rotulo}
      >
        {renderSecao(secao)}
      </section>
    </div>
  ) : (
    <div className="mx-auto max-w-2xl">
      <header className="mesa-mobile-topo">
        <p className="mesa-mobile-kicker">Painel da loja</p>
        <h1 className="painel-h1">Configurações</h1>
        <p className="mesa-mobile-sub">
          Escolha um bloco para editar. Cada um salva por si — o que aparece nos botões e no
          rodapé do site nasce daqui.
        </p>
        {totalPendentes > 0 ? (
          <p className="mesa-hub-aviso">
            <span className="mesa-ponto" data-tom="pendente" aria-hidden="true" />
            {totalPendentes} {totalPendentes === 1 ? 'bloco com edição' : 'blocos com edição'} não
            salva.
          </p>
        ) : null}
      </header>

      <div className="mesa-hub">
        {SECOES.map((bloco) => {
          const suja = bloco.id !== 'lixeira' && secaoSuja(bloco.id, config, salvo)

          return (
            <button
              key={bloco.id}
              type="button"
              onClick={() => abrirSecao(bloco.id)}
              className="mesa-hub-item"
            >
              <span className="min-w-0 flex-1">
                <span className="mesa-hub-rotulo">
                  {bloco.rotulo}
                  {suja ? (
                    <span className="mesa-nav-pendente" title="Alterações não salvas">
                      <span className="sr-only">Alterações não salvas</span>
                    </span>
                  ) : null}
                </span>
                <span className="mesa-hub-valor">
                  {bloco.resumo(config, totalLixeira, valorLixeira)}
                </span>
              </span>
              <ChevronRight className="mesa-hub-seta size-4" aria-hidden="true" />
            </button>
          )
        })}
      </div>

      <div className="mesa-app mesa-app--mobile">
        <div className="mesa-app-texto">
          <p className="mesa-app-titulo">Aplicativo do painel</p>
          <p className="mesa-app-nota">
            {app.instalado
              ? 'Instalado neste aparelho.'
              : 'Abre em tela cheia, direto da tela inicial do celular.'}
          </p>
        </div>
        <button type="button" onClick={app.abrir} className="mesa-btn-secundario">
          {app.instalado ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Download className="size-4" aria-hidden="true" />
          )}
          {app.instalado ? 'Instalado' : 'Instalar app'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {mesa ? telaDesktop : telaCelular}
      <Toast
        feedback={feedback}
        onFechar={() => setFeedback(null)}
        acimaDaBarra={!mesa}
      />
      <ModalInstalar app={app} />
    </>
  )
}
