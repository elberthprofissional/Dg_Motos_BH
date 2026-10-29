import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import { ArrowLeft, Check, ChevronRight, Download } from 'lucide-react'
import {
  gravarConfig,
  gravarConfigNoBanco,
  lerConfig,
  lerConfigDoBanco,
} from '../../lib/configLoja'
import type { ConfigLoja } from '../../lib/configLoja'
import type { Motorcycle } from '../../types'
import type { FotoNaLixeira } from '../../data/entregas'
import { Toast } from '../ui/Toast'
import type { Feedback } from '../ui/Toast'
import { ModalInstalar } from './InstalarApp'
import { LixeiraSecao } from './LixeiraSecao'
import { useInstalarApp } from './useInstalarApp'
import { CamposSecao } from './configuracoes/CamposSecao'
import { PeSecao } from './configuracoes/PeSecao'
import { SaidaSecao } from './configuracoes/SaidaSecao'
import { useTelaDeMesa } from './configuracoes/useTelaDeMesa'
import {
  SECOES,
  comCampos,
  errosDaSecao,
  horaAgora,
  mesclarSecao,
  metaDaSecao,
  normalizarSecao,
  primeiroCampoInvalido,
  secaoSuja,
  urlDoHandle,
} from './configuracoes/dados'
import type { Secao, SecaoConfig } from './configuracoes/dados'

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
 *
 * As peças (campos, prévia e pé) vivem em `./configuracoes/`;
 * este arquivo guarda o estado, a gravação e os dois arranjos.
 */

interface ConfiguracoesTabProps {
  /** Motos na lixeira; `null` enquanto o estoque carrega. */
  lixeira: Motorcycle[] | null
  /** Fotos apagadas do mural; `null` enquanto a lista carrega. */
  fotosLixeira: FotoNaLixeira[] | null
  erroLixeira: string | null
  erroFotosLixeira: string | null
  onRestaurarDaLixeira: (moto: Motorcycle) => void | Promise<void>
  onApagarDeVez: (moto: Motorcycle) => void
  onRestaurarFoto: (foto: FotoNaLixeira) => void | Promise<void>
  onApagarFoto: (foto: FotoNaLixeira) => void
  onEsvaziarLixeira: () => void
  onIrParaEstoque: () => void
  onRecarregar: () => void | Promise<void>
}

export function ConfiguracoesTab({
  lixeira,
  fotosLixeira,
  erroLixeira,
  erroFotosLixeira,
  onRestaurarDaLixeira,
  onApagarDeVez,
  onRestaurarFoto,
  onApagarFoto,
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

  const totalLixeira = (lixeira?.length ?? 0) + (fotosLixeira?.length ?? 0)
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
          'Salvo neste aparelho, mas sem resposta online. Os valores já valem aqui; tente sincronizar de novo.',
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
        texto: 'Sincronizado. A loja inteira já recebe estes valores.',
      })
    } else {
      setFeedback({
        tipo: 'erro',
        texto: 'Não deu para publicar. Verifique a conexão e tente de novo.',
      })
    }
  }

  function statusDaSecao(id: Secao): {
    texto: string
    tom: 'ok' | 'pendente' | 'erro' | 'neutro'
  } | null {
    if (sincronizando) return { texto: 'Lendo dados…', tom: 'neutro' }
    if (salvando === id) return { texto: 'Salvando…', tom: 'neutro' }
    if (secaoSuja(id, config, salvo)) return { texto: 'Alterações não salvas', tom: 'pendente' }
    if (falhaBanco) return { texto: 'Salvo só neste aparelho', tom: 'erro' }
    if (ultimoSalvoEm) return { texto: `Salvo às ${ultimoSalvoEm}`, tom: 'ok' }
    return null
  }

  function renderSecao(id: Secao): ReactNode {
    if (id === 'lixeira') {
      return (
        <div className="mesa-folha-corpo mesa-folha-corpo--lixo">
          <LixeiraSecao
            motos={lixeira}
            fotos={fotosLixeira}
            erro={erroLixeira}
            erroFotos={erroFotosLixeira}
            onRestaurar={onRestaurarDaLixeira}
            onApagarDeVez={onApagarDeVez}
            onRestaurarFoto={onRestaurarFoto}
            onApagarFoto={onApagarFoto}
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
            <CamposSecao
              id={id}
              config={config}
              tentouSalvar={tentouSalvar}
              tocados={tocados}
              definir={definir}
              definirInstagram={definirInstagram}
              marcarTocado={marcarTocado}
            />
            <SaidaSecao id={id} config={config} />
          </div>
        </div>
        <PeSecao
          id={id}
          config={config}
          salvo={salvo}
          sincronizando={sincronizando}
          salvando={salvando}
          falhaBanco={falhaBanco}
          reenviando={reenviando}
          ultimoSalvoEm={ultimoSalvoEm}
          onReenviar={() => void reenviarBanco()}
        />
      </form>
    )
  }

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
        ) : status ? (
          <span className="mesa-estado" data-tom={status.tom}>
            <span className="mesa-ponto" aria-hidden="true" />
            {status.texto}
          </span>
        ) : null}
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
          <h1 className="mesa-titulo">
            Configurações
            <span className="mesa-titulo-ponto" aria-hidden="true">
              .
            </span>
          </h1>
          <p className="mesa-sub">
            O contato, o perfil e o endereço que o site publica. A Lixeira fica no fim: é
            para onde vai uma moto excluída antes de sumir de vez.
          </p>
        </div>
        {/* Só fala quando há algo a dizer: carregando, sem resposta
            online ou edição pendente. Em repouso, nada. */}
        {sincronizando || falhaBanco || totalPendentes > 0 ? (
          <p className="mesa-topo-estado">
            <span
              className="mesa-ponto"
              data-tom={sincronizando ? 'neutro' : falhaBanco ? 'erro' : 'pendente'}
              aria-hidden="true"
            />
            {sincronizando
              ? 'Lendo dados'
              : falhaBanco
                ? 'Sem resposta online'
                : `${totalPendentes} ${totalPendentes === 1 ? 'bloco com edição pendente' : 'blocos com edição pendente'}`}
          </p>
        ) : null}
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
                  className={`mesa-nav-item ${bloco.id === 'lixeira' ? 'mesa-nav-item--perigo' : ''}`}
                >
                  <span className="mesa-nav-indice" aria-hidden="true">
                    {String(indice + 1).padStart(2, '0')}
                  </span>
                  <span className="mesa-nav-texto">
                    <span className="mesa-nav-rotulo">
                      {bloco.rotulo}
                      {suja ? (
                        <span className="mesa-nav-pendente" title="Alterações não salvas">
                          <span className="sr-only">Alterações não salvas</span>
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`mesa-nav-valor ${bloco.id === 'lixeira' ? 'mesa-nav-valor--perigo' : ''}`}
                      aria-hidden="true"
                    >
                      {bloco.id === 'lixeira'
                        ? 'Área de risco'
                        : bloco.resumo(salvo, totalLixeira)}
                    </span>
                  </span>
                  {bloco.id === 'lixeira' && totalLixeira > 0 ? (
                    <span className="mesa-nav-contagem">
                      {totalLixeira}
                      <span className="sr-only"> na lixeira</span>
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>
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
        <h1 className="painel-h1">
          Configurações
          <span className="mesa-titulo-ponto" aria-hidden="true">
            .
          </span>
        </h1>
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
        {SECOES.map((bloco, indice) => {
          const suja = bloco.id !== 'lixeira' && secaoSuja(bloco.id, config, salvo)

          return (
            <button
              key={bloco.id}
              type="button"
              onClick={() => abrirSecao(bloco.id)}
              className={`mesa-hub-item ${bloco.id === 'lixeira' ? 'mesa-hub-item--perigo' : ''}`}
            >
              <span className="mesa-hub-indice" aria-hidden="true">
                {String(indice + 1).padStart(2, '0')}
              </span>
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
                  {bloco.resumo(config, totalLixeira)}
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
