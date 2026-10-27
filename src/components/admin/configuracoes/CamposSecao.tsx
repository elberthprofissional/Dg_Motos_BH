import { AlertCircle, Plus, Trash2 } from 'lucide-react'
import type { ConfigLoja } from '../../../lib/configLoja'
import { lerSemana, semanaParaFaixas } from '../../../lib/horarios'
import { Campo } from './Campo'
import { errosDaSecao } from './dados'
import type { SecaoConfig } from './dados'
import { EditorSemana } from './EditorSemana'

interface CamposSecaoProps {
  id: SecaoConfig
  config: ConfigLoja
  tentouSalvar: boolean
  tocados: Record<string, boolean>
  definir: <K extends keyof ConfigLoja>(campo: K, valor: ConfigLoja[K]) => void
  definirInstagram: (valor: string) => void
  marcarTocado: (campo: string) => void
}

/** Campos do bloco ativo. Um bloco por vez, sem ids duplicados. */
export function CamposSecao({
  id,
  config,
  tentouSalvar,
  tocados,
  definir,
  definirInstagram,
  marcarTocado,
}: CamposSecaoProps) {
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
          <Campo id="cfg-endereco-rua" rotulo="Rua e número" erro={erroRua}>
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

          <Campo id="cfg-endereco-cidade" rotulo="Cidade e estado" erro={erroCidade}>
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
  const semana = lerSemana(config.horarios)

  if (semana) {
    return (
      <EditorSemana
        semana={semana}
        erro={erroHorarios}
        onMudar={(nova) => definir('horarios', semanaParaFaixas(nova))}
        marcarTocado={() => marcarTocado('horarios')}
      />
    )
  }

  const descricaoHorarios = erroHorarios ? 'cfg-horarios-dica cfg-horarios-erro' : 'cfg-horarios-dica'

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
        <p className="mesa-campo-dica">
          Os horários salvos estão em um formato livre que não dá para separar por dia. Ajuste
          abaixo; quando as faixas usarem dias e horas reconhecíveis, o editor por dia volta.
        </p>

        {config.horarios.length === 0 ? (
          <p className="mesa-nota-vazio">
            Nenhuma faixa cadastrada. O site mostra um pedido para confirmar o horário antes da
            visita.
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
