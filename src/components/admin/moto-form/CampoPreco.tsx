import { useState } from 'react'
import { formatarNumeroBR, formatPrice, parseNumeroBR, precoPareceIncompleto } from '../../../lib/format'
import { campoLinha } from '../campoLinha'
import { textoInicial } from './valores'

/**
 * Campo de dinheiro em texto livre. `type="number"` engolia "23.000"
 * como 23 e o dono anunciava a moto por R$ 23. Aqui o valor é lido pelo
 * parser brasileiro, a prévia confirma o que vai para o site e valores
 * abaixo de R$ 1.000 ganham um aviso — não um bloqueio.
 */
export function CampoPreco({
  id,
  valor,
  onChange,
  placeholder,
  dicaVazia = 'Digite 23.000 ou 23 mil — o campo entende os dois.',
  previa,
}: {
  id: string
  valor: number | null
  onChange: (valor: number | null) => void
  placeholder?: string
  /** Texto de ajuda enquanto o campo está vazio. */
  dicaVazia?: string
  /** Como o valor lido aparece; o padrão confirma o preço do site. */
  previa?: (valor: number) => string
}) {
  const [texto, setTexto] = useState(() => textoInicial(valor))
  const numero = parseNumeroBR(texto)
  const vazio = texto.trim() === ''
  const invalido = !vazio && numero == null
  const incompleto = numero != null && numero > 0 && precoPareceIncompleto(numero)

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={campoLinha}
        value={texto}
        onChange={(evento) => {
          const proximo = evento.target.value
          setTexto(proximo)
          onChange(parseNumeroBR(proximo))
        }}
        onBlur={() => {
          const lido = parseNumeroBR(texto)
          if (lido != null) setTexto(formatarNumeroBR(lido))
        }}
        placeholder={placeholder}
        aria-invalid={invalido || undefined}
        aria-describedby={`${id}-previa`}
      />
      <p
        id={`${id}-previa`}
        aria-live="polite"
        className={`mt-1.5 text-xs ${invalido ? 'text-red-300' : incompleto ? 'text-alerta' : 'text-steel-500'}`}
      >
        {vazio
          ? dicaVazia
          : numero == null
            ? 'Não consegui ler esse valor. Use, por exemplo, 23.000,00.'
            : incompleto
              ? `${previa ? previa(numero) : `No site: ${formatPrice(numero)}.`} Faltou um zero?`
              : (previa ? previa(numero) : `No site: ${formatPrice(numero)}.`)}
      </p>
    </>
  )
}
