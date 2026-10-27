import { AlertCircle } from 'lucide-react'
import { DIAS_SEMANA } from '../../../lib/horarios'
import type { DiaSemana } from '../../../lib/horarios'

interface EditorSemanaProps {
  semana: DiaSemana[]
  erro: string | null
  onMudar: (semana: DiaSemana[]) => void
  marcarTocado: () => void
}

/** Editor de horários por dia da semana. */
export function EditorSemana({ semana, erro, onMudar, marcarTocado }: EditorSemanaProps) {
  function atualizar(indice: number, mudanca: Partial<DiaSemana>) {
    onMudar(semana.map((dia, posicao) => (posicao === indice ? { ...dia, ...mudanca } : dia)))
  }

  const descricao = erro ? 'cfg-horarios-dica cfg-horarios-erro' : 'cfg-horarios-dica'

  return (
    <div className="mesa-campos">
      <div
        className="mesa-campo"
        role="group"
        aria-labelledby="cfg-horarios-titulo"
        aria-describedby={descricao}
      >
        <p id="cfg-horarios-titulo" className="mesa-campo-rotulo">
          Dias e horários
        </p>

        <div className="mesa-semana">
          {DIAS_SEMANA.map((dia, indice) => {
            const valor = semana[indice]
            const incompleto = valor.aberto && (!valor.abre || !valor.fecha)

            return (
              <div className="mesa-dia" data-aberto={valor.aberto} key={dia.curto}>
                <span className="mesa-dia-nome">{dia.curto}</span>

                {valor.aberto ? (
                  <div className="mesa-dia-faixa">
                    <input
                      id={`cfg-horario-abre-${indice}`}
                      type="time"
                      step={1800}
                      className="mesa-entrada numeros"
                      value={valor.abre}
                      aria-label={`Abertura de ${dia.nome}`}
                      aria-invalid={Boolean(erro) && incompleto}
                      aria-describedby={descricao}
                      onChange={(evento) => atualizar(indice, { abre: evento.target.value })}
                      onBlur={marcarTocado}
                    />
                    <span className="mesa-dia-ate" aria-hidden="true">
                      às
                    </span>
                    <input
                      id={`cfg-horario-fecha-${indice}`}
                      type="time"
                      step={1800}
                      className="mesa-entrada numeros"
                      value={valor.fecha}
                      aria-label={`Fechamento de ${dia.nome}`}
                      aria-invalid={Boolean(erro) && incompleto}
                      aria-describedby={descricao}
                      onChange={(evento) => atualizar(indice, { fecha: evento.target.value })}
                      onBlur={marcarTocado}
                    />
                  </div>
                ) : (
                  <span className="mesa-dia-fechado">Fechado</span>
                )}

                <button
                  type="button"
                  className="mesa-dia-alternar"
                  onClick={() => {
                    if (valor.aberto) {
                      atualizar(indice, { aberto: false })
                    } else {
                      atualizar(indice, {
                        aberto: true,
                        abre: valor.abre || '09:00',
                        fecha: valor.fecha || '18:00',
                      })
                    }
                    marcarTocado()
                  }}
                >
                  {valor.aberto ? 'Fechar' : 'Abrir'}
                  <span className="sr-only"> {dia.nome}</span>
                </button>
              </div>
            )
          })}
        </div>

        {erro ? (
          <p id="cfg-horarios-erro" role="alert" className="mesa-campo-erro">
            <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            {erro}
          </p>
        ) : null}

        <p id="cfg-horarios-dica" className="mesa-campo-dica">
          Desligue os dias em que a loja não abre. Dias seguidos com o mesmo horário viram uma
          faixa só no site, como “Seg a Sex · 9h–18h”.
        </p>
      </div>
    </div>
  )
}
