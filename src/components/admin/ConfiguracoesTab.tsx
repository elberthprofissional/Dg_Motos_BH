import { useState } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { configPadrao, gravarConfig, lerConfig, limparConfig } from '../../lib/configLoja'
import type { ConfigLoja } from '../../lib/configLoja'
import { InstagramIcon } from '../ui/InstagramIcon'
import { InstalarApp } from './InstalarApp'
import { Toast } from '../ui/Toast'
import type { Feedback } from '../ui/Toast'

/**
 * ============================================================
 * CONFIGURAÇÕES DA LOJA — lista de opções que abrem em sub-telas
 * ============================================================
 * Mesma ideia das configurações de app (Instagram, banco): a tela
 * inicial é uma lista de seções; tocar numa linha abre a seção
 * dedicada, com o "voltar" no topo. Assim o dono mexe em um assunto
 * por vez, em vez de rolar um formulário comprido.
 *
 * A config inteira vive em um único estado no topo — as sub-telas
 * recebem o valor e um setter. Nada de estado espalhado.
 */

type Secao = 'contato' | 'instagram' | 'endereco' | 'horarios'

const CAMPOS_FIXOS = {
  bloco: 'field-label',
  input: 'input',
}

function Campo({
  id,
  label,
  dica,
  children,
}: {
  id: string
  label: string
  dica?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className={CAMPOS_FIXOS.bloco}>
        {label}
      </label>
      {children}
      {dica ? <p className="mt-1.5 text-[11px] leading-relaxed text-steel-500">{dica}</p> : null}
    </div>
  )
}

/** Cabeçalho de sub-tela: seta de voltar + título + resumo do valor atual. */
function SubTela({
  titulo,
  resumo,
  onVoltar,
  children,
}: {
  titulo: string
  resumo?: string
  onVoltar: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onVoltar}
          aria-label="Voltar para configurações"
          className="foco-painel btn-icone -ml-1 mt-0.5"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold tracking-wide text-paper uppercase">
            {titulo}
          </h2>
          {resumo ? <p className="mt-0.5 truncate text-sm text-steel-500">{resumo}</p> : null}
        </div>
      </div>
      {children}
    </div>
  )
}

/** Linha do hub: ícone + título + resumo do valor + seta. */
function ItemConfig({
  icone: Icone,
  titulo,
  resumo,
  onClick,
}: {
  icone: (props: { className?: string }) => React.ReactNode
  titulo: string
  resumo: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="foco-painel item-linha group w-full !px-4 !py-3.5"
    >
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-md border border-white/10 bg-night-800 text-steel-300 transition-colors group-hover:border-brand-500/50 group-hover:text-brand-500"
      >
        <Icone className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-paper">{titulo}</span>
        <span className="block truncate text-xs text-steel-500">{resumo}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-steel-600 transition-colors group-hover:text-paper" aria-hidden="true" />
    </button>
  )
}

/** Botões de salvar/restaurar no pé de cada sub-tela. */
function AcoesSecao({
  onSalvar,
  onRestaurar,
}: {
  onSalvar: () => void
  onRestaurar: () => void
}) {
  return (
    <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
      <button type="button" onClick={onSalvar} className="btn btn-primary h-11 sm:h-auto">
        Salvar
      </button>
      <button type="button" onClick={onRestaurar} className="btn btn-secondary h-11 sm:h-auto">
        <RotateCcw className="size-4" aria-hidden="true" />
        Restaurar padrão
      </button>
    </div>
  )
}

/** Botões de salvar/restaurar no hub, com aviso de alterações pendentes. */
function AcoesGerais({
  temAlteracoes,
  onSalvar,
  onRestaurar,
}: {
  temAlteracoes: boolean
  onSalvar: () => void
  onRestaurar: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
      <button type="button" onClick={onSalvar} className="btn btn-primary h-11 sm:h-auto">
        Salvar configurações
      </button>
      <button type="button" onClick={onRestaurar} className="btn btn-secondary h-11 sm:h-auto">
        <RotateCcw className="size-4" aria-hidden="true" />
        Restaurar padrão
      </button>
      {temAlteracoes ? (
        <span className="text-xs text-steel-500" role="status">
          Alterações não salvas
        </span>
      ) : null}
    </div>
  )
}

export function ConfiguracoesTab() {
  // A config nasce do storage: o componente é remontado a cada troca de
  // aba, então não há posição defasada entre abas.
  const [config, setConfig] = useState<ConfigLoja>(() => lerConfig())
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [secao, setSecao] = useState<Secao | null>(null)

  // Última versão gravada: serve para saber se há alterações pendentes.
  // Estado (e não ref) porque o aviso é renderizado.
  const [salvo, setSalvo] = useState<ConfigLoja>(config)
  const temAlteracoes = JSON.stringify(config) !== JSON.stringify(salvo)

  function set<K extends keyof ConfigLoja>(chave: K, valor: ConfigLoja[K]) {
    setConfig((c) => ({ ...c, [chave]: valor }))
  }

  function salvar() {
    gravarConfig(config)
    setSalvo(config)
    setFeedback({ tipo: 'ok', texto: 'Configurações salvas. O site já usa os novos valores.' })
  }

  function restaurar() {
    limparConfig()
    const padrao = configPadrao()
    setConfig(padrao)
    setSalvo(padrao)
    setFeedback({ tipo: 'ok', texto: 'Valores de fábrica restaurados (src/data/site.ts).' })
  }

  /* ----------------------------- Sub-telas ----------------------------- */

  if (secao === 'contato') {
    return (
      <>
        <SubTela
          titulo="Contato"
          resumo="WhatsApp e telefone que aparecem nos botões do site."
          onVoltar={() => setSecao(null)}
        >
          <fieldset className="space-y-4">
            <legend className="sr-only">Contato</legend>
            <Campo
              id="cfg-whatsapp"
              label="WhatsApp da loja"
              dica="Só dígitos, com DDI e DDD. Ex.: 5531987654321. Vazio = os botões do site caem na página de contato."
            >
              <input
                id="cfg-whatsapp"
                className={CAMPOS_FIXOS.input}
                value={config.whatsapp ?? ''}
                inputMode="numeric"
                placeholder="5531987654321"
                onChange={(e) => set('whatsapp', e.target.value.replace(/\D/g, '') || null)}
              />
            </Campo>
            <Campo
              id="cfg-telefone"
              label="Telefone fixo (opcional)"
              dica="Exibido no rodapé. Deixe vazio se não quiser publicar linha fixa."
            >
              <input
                id="cfg-telefone"
                className={CAMPOS_FIXOS.input}
                value={config.telefoneExibicao ?? ''}
                placeholder="(31) 3000-0000"
                onChange={(e) => set('telefoneExibicao', e.target.value.trim() || null)}
              />
            </Campo>
          </fieldset>
          <AcoesSecao onSalvar={salvar} onRestaurar={restaurar} />
        </SubTela>
        <Toast feedback={feedback} onFechar={() => setFeedback(null)} />
      </>
    )
  }

  if (secao === 'instagram') {
    return (
      <>
        <SubTela
          titulo="Instagram"
          resumo="O @ que o site usa no cabeçalho, rodapé e fichas."
          onVoltar={() => setSecao(null)}
        >
          <fieldset className="space-y-4">
            <legend className="sr-only">Instagram</legend>
            <Campo
              id="cfg-instagram"
              label="Perfil (@)"
              dica="Só o @ handle, sem URL. O link é montado automaticamente e vira o botão do rodapé."
            >
              <input
                id="cfg-instagram"
                className={CAMPOS_FIXOS.input}
                value={config.instagramHandle}
                placeholder="@dgmotosbh"
                onChange={(e) => {
                  const handle = e.target.value
                    .trim()
                    .replace(/^https?:\/\/instagram\.com\//i, '')
                  set('instagramHandle', handle)
                  const limpo = handle.replace(/@/g, '')
                  set('instagramUrl', limpo ? `https://instagram.com/${limpo}` : '')
                }}
              />
            </Campo>
            {config.instagramUrl ? (
              <p className="text-[11px] text-steel-500">
                Link final:{' '}
                <a
                  href={config.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-steel-300 underline decoration-white/20 underline-offset-2 hover:text-paper"
                >
                  {config.instagramUrl}
                </a>
              </p>
            ) : null}
          </fieldset>
          <AcoesSecao onSalvar={salvar} onRestaurar={restaurar} />
        </SubTela>
        <Toast feedback={feedback} onFechar={() => setFeedback(null)} />
      </>
    )
  }

  if (secao === 'endereco') {
    return (
      <>
        <SubTela
          titulo="Endereço"
          resumo={`${config.enderecoRua || 'Rua'} — ${config.enderecoCidadeUf || 'cidade'}`}
          onVoltar={() => setSecao(null)}
        >
          <fieldset className="space-y-4">
            <legend className="sr-only">Endereço</legend>
            <Campo id="cfg-rua" label="Rua e número">
              <input
                id="cfg-rua"
                className={CAMPOS_FIXOS.input}
                value={config.enderecoRua}
                onChange={(e) => set('enderecoRua', e.target.value)}
              />
            </Campo>
            <Campo id="cfg-cidade" label="Cidade e estado">
              <input
                id="cfg-cidade"
                className={CAMPOS_FIXOS.input}
                value={config.enderecoCidadeUf}
                onChange={(e) => set('enderecoCidadeUf', e.target.value)}
              />
            </Campo>
            <Campo
              id="cfg-maps"
              label="Link do Google Maps"
              dica='Cole aqui o link "Compartilhar" do Google Meu Negócio. Vazio = o site monta uma busca com o endereço.'
            >
              <input
                id="cfg-maps"
                className={CAMPOS_FIXOS.input}
                value={config.mapsUrl}
                onChange={(e) => set('mapsUrl', e.target.value.trim())}
                placeholder="https://maps.google.com/..."
              />
            </Campo>
          </fieldset>
          <AcoesSecao onSalvar={salvar} onRestaurar={restaurar} />
        </SubTela>
        <Toast feedback={feedback} onFechar={() => setFeedback(null)} />
      </>
    )
  }

  if (secao === 'horarios') {
    return (
      <>
        <SubTela
          titulo="Horários de atendimento"
          resumo={
            config.horarios.length === 0
              ? 'Nenhum horário cadastrado'
              : `${config.horarios.length} ${config.horarios.length === 1 ? 'faixa' : 'faixas'}`
          }
          onVoltar={() => setSecao(null)}
        >
          <fieldset className="space-y-4">
            <legend className="sr-only">Horários</legend>
            {config.horarios.length === 0 ? (
              <p className="text-sm text-steel-500">
                Nenhum horário cadastrado. O site mostra um aviso discreto pedindo
                para confirmar antes de vir.
              </p>
            ) : (
              <ul className="space-y-2">
                {config.horarios.map((h, i) => (
                  <li key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <input
                      className="input"
                      value={h.dias}
                      placeholder="Seg a Sex"
                      aria-label="Dias"
                      onChange={(e) => {
                        const nova = [...config.horarios]
                        nova[i] = { ...h, dias: e.target.value }
                        set('horarios', nova)
                      }}
                    />
                    <input
                      className="input"
                      value={h.horas}
                      placeholder="8h às 18h"
                      aria-label="Horas"
                      onChange={(e) => {
                        const nova = [...config.horarios]
                        nova[i] = { ...h, horas: e.target.value }
                        set('horarios', nova)
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => set('horarios', config.horarios.filter((_, j) => j !== i))}
                      aria-label={`Remover horário ${h.dias || 'sem rótulo'}`}
                      className="btn-icone btn-icone-perigo"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => set('horarios', [...config.horarios, { dias: '', horas: '' }])}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-steel-300 transition-colors hover:text-paper"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                +
              </span>
              Adicionar faixa de horário
            </button>
          </fieldset>
          <AcoesSecao onSalvar={salvar} onRestaurar={restaurar} />
        </SubTela>
        <Toast feedback={feedback} onFechar={() => setFeedback(null)} />
      </>
    )
  }

  /* ------------------------- Hub: lista de seções ---------------------- */

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-5">
        <header>
          <h2 className="font-display text-2xl font-semibold tracking-wide text-paper uppercase">
            Configurações
          </h2>
          <p className="mt-1 text-sm text-steel-500">
            Toque numa seção para editar. Tudo o que aparece nos botões e no
            rodapé do site nasce daqui.
          </p>
        </header>

        <div className="divide-y divide-white/8 border-y border-white/8">
          <ItemConfig
            icone={MessageCircle}
            titulo="Contato"
            resumo={config.whatsapp ? `WhatsApp ${config.whatsapp}` : 'Sem WhatsApp definido'}
            onClick={() => setSecao('contato')}
          />
          <ItemConfig
            icone={InstagramIcon}
            titulo="Instagram"
            resumo={config.instagramHandle || 'Sem perfil definido'}
            onClick={() => setSecao('instagram')}
          />
          <ItemConfig
            icone={MapPin}
            titulo="Endereço"
            resumo={config.enderecoRua || 'Sem endereço definido'}
            onClick={() => setSecao('endereco')}
          />
          <ItemConfig
            icone={Clock}
            titulo="Horários de atendimento"
            resumo={
              config.horarios.length === 0
                ? 'Nenhum horário cadastrado'
                : `${config.horarios.length} ${config.horarios.length === 1 ? 'faixa' : 'faixas'}`
            }
            onClick={() => setSecao('horarios')}
          />
        </div>

        <div className="divide-y divide-white/8 border-b border-white/8">
          <InstalarApp />
        </div>

        <AcoesGerais temAlteracoes={temAlteracoes} onSalvar={salvar} onRestaurar={restaurar} />
      </div>

      <Toast feedback={feedback} onFechar={() => setFeedback(null)} />
    </>
  )
}

