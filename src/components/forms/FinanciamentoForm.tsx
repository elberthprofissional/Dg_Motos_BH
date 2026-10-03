import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, ExternalLink, Send } from 'lucide-react'
import { registrarLead } from '../../lib/catalog'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useWhatsappLink } from '../../lib/format'

const schema = z.object({
  nome: z.string().min(3, 'Informe seu nome completo.'),
  telefone: z
    .string()
    .min(10, 'Informe DDD + número.')
    .regex(/^[0-9()\-\s]+$/, 'Somente números, parênteses e traços.'),
  motoInteresse: z.string().min(1, 'Selecione uma motocicleta.'),
  valorEntrada: z.string().max(40, 'Texto muito longo.').optional(),
  observacoes: z.string().max(500, 'Máximo de 500 caracteres.').optional(),
  consentimento: z.literal(true, {
    message: 'Precisamos do seu consentimento para contato.',
  }),
})

type FormData = z.infer<typeof schema>

export function FinanciamentoForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const [linkGerado, setLinkGerado] = useState<string | null>(null)
  const { motos } = useCatalogo()
  const disponiveis = motos.filter((m) => m.disponibilidade === 'disponivel')
  const gerarLink = useWhatsappLink

  async function onSubmit(data: FormData) {
    const linhas = [
      'Olá! Gostaria de informações sobre financiamento no site da DG Motos.',
      '',
      `*Nome:* ${data.nome}`,
      `*Telefone:* ${data.telefone}`,
      `*Motocicleta de interesse:* ${data.motoInteresse}`,
      data.valorEntrada ? `*Entrada aproximada:* ${data.valorEntrada}` : null,
      data.observacoes ? `*Observações:* ${data.observacoes}` : null,
    ].filter((l): l is string => l !== null)

    // Grava o lead antes de abrir o WhatsApp. Se falhar, o atendimento
    // continua — perder o registro é melhor do que perder a venda.
    await registrarLead({
      tipo: 'financiamento',
      nome: data.nome,
      telefone: data.telefone,
      dados: {
        moto: data.motoInteresse,
        entrada: data.valorEntrada ?? null,
        observacoes: data.observacoes ?? null,
      },
      origem: '/financiamento',
    })

    const url = gerarLink(linhas.join('\n'))
    if (url) {
      window.open(url, '_blank', 'noopener')
      setLinkGerado(url)
    }
  }

  if (linkGerado) {
    return (
      <div className="surface rounded-lg p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-brand-500" aria-hidden="true" />
        <h3 className="mt-4 font-display text-xl font-semibold uppercase">
          Pedido preparado
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-steel-400">
          Abrimos o WhatsApp com os seus dados preenchidos. Se a janela não
          abriu, use o botão abaixo. Um atendente humano responde o quanto
          antes — não é uma análise automática de crédito.
        </p>
        <a
          href={linkGerado}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded bg-brand-500 px-5 py-2.5 font-display text-sm font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:bg-brand-600"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          Abrir WhatsApp
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="fin-nome" className="field-label">Nome *</label>
          <input id="fin-nome" type="text" autoComplete="name" className="input" {...register('nome')} />
          {errors.nome && <p className="mt-1.5 text-xs text-brand-500">{errors.nome.message}</p>}
        </div>

        <div>
          <label htmlFor="fin-telefone" className="field-label">Telefone / WhatsApp *</label>
          <input
            id="fin-telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(31) 9 9999-9999"
            className="input"
            {...register('telefone')}
          />
          {errors.telefone && <p className="mt-1.5 text-xs text-brand-500">{errors.telefone.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="fin-moto" className="field-label">Motocicleta de interesse *</label>
        <select id="fin-moto" className="input" defaultValue="" {...register('motoInteresse')}>
          <option value="" disabled>
            Selecione uma moto do estoque
          </option>
          {disponiveis
            .map((m) => (
              <option key={m.id} value={`${m.marca} ${m.modelo} ${m.ano}`}>
                {m.marca} {m.modelo} {m.ano}
              </option>
            ))}
        </select>
        {errors.motoInteresse && (
          <p className="mt-1.5 text-xs text-brand-500">{errors.motoInteresse.message}</p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="fin-entrada" className="field-label">Valor aproximado de entrada</label>
          <input
            id="fin-entrada"
            type="text"
            placeholder="Ex.: R$ 5.000"
            className="input"
            {...register('valorEntrada')}
          />
        </div>
        <div>
          <label htmlFor="fin-obs" className="field-label">Observações (opcional)</label>
          <input id="fin-obs" type="text" className="input" {...register('observacoes')} />
          {errors.observacoes && (
            <p className="mt-1.5 text-xs text-brand-500">{errors.observacoes.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-steel-300">
          <input
            type="checkbox"
            value="true"
            className="mt-1 size-4 accent-[#E21B23]"
            {...register('consentimento')}
          />
          <span>
            Autorizo a DG Motos a entrar em contato por WhatsApp ou telefone para
            tratar deste pedido de financiamento.
          </span>
        </label>
        {errors.consentimento && (
          <p className="mt-1.5 text-xs text-brand-500">{errors.consentimento.message}</p>
        )}
      </div>

      <div className="border-t border-white/10 pt-5">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded bg-brand-500 px-5 py-2.5 font-display text-sm font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:bg-brand-600"
        >
          <Send className="size-4" aria-hidden="true" />
          Enviar pelo WhatsApp
        </button>
      </div>

      <p className="text-xs leading-relaxed text-steel-500">
        Seus dados são usados apenas para este atendimento. O envio abre uma
        conversa no WhatsApp da loja — nada é armazenado no site. A aprovação
        de crédito depende da instituição financeira.
      </p>
    </form>
  )
}
