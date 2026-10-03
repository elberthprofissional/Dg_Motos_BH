import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, ExternalLink, Send } from 'lucide-react'
import { registrarLead } from '../../lib/catalog'
import { useWhatsappLink } from '../../lib/format'

const estadosGerais = ['Ótimo', 'Bom', 'Regular', 'Precisa de reparos'] as const

/**
 * Ano máximo aceito no formulário.
 * Calculado no módulo para não mudar entre renders (o schema do Zod
 * valida em runtime e um limite dinâmico tornaria o form instável).
 */
const ANO_LIMITE = new Date().getFullYear() + 1

const schema = z.object({
  nome: z.string().min(3, 'Informe seu nome completo.'),
  whatsapp: z
    .string()
    .min(10, 'Informe DDD + número.')
    .regex(/^[0-9()\-\s]+$/, 'Somente números, parênteses e traços.'),
  marca: z.string().min(2, 'Informe a marca.'),
  modelo: z.string().min(2, 'Informe o modelo.'),
  ano: z
    .string()
    .regex(/^\d{4}$/, 'Ano com 4 dígitos.')
    .refine((v) => Number(v) >= 1980 && Number(v) <= ANO_LIMITE, {
      message: 'Ano fora do intervalo plausível.',
    }),
  quilometragem: z
    .string()
    .regex(/^[0-9.]*$/, 'Somente números (use ponto para milhar).')
    .optional(),
  estadoGeral: z.enum(estadosGerais, { message: 'Selecione o estado geral.' }),
  valorPretendido: z.string().max(40, 'Texto muito longo.').optional(),
  observacoes: z.string().max(500, 'Máximo de 500 caracteres.').optional(),
  consentimento: z.literal(true, {
    message: 'Precisamos do seu consentimento para contato.',
  }),
})

type FormData = z.infer<typeof schema>

export function TrocaForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const [linkGerado, setLinkGerado] = useState<string | null>(null)
  const gerarLink = useWhatsappLink

  async function onSubmit(data: FormData) {
    const linhas = [
      'Olá! Tenho uma motocicleta para avaliação de troca na DG Motos.',
      '',
      `*Nome:* ${data.nome}`,
      `*WhatsApp:* ${data.whatsapp}`,
      `*Motocicleta:* ${data.marca} ${data.modelo} ${data.ano}`,
      data.quilometragem ? `*Quilometragem:* ${data.quilometragem} km` : null,
      `*Estado geral:* ${data.estadoGeral}`,
      data.valorPretendido ? `*Valor pretendido:* ${data.valorPretendido}` : null,
      data.observacoes ? `*Observações:* ${data.observacoes}` : null,
    ].filter((l): l is string => l !== null)

    // Deixa o pedido registrado no painel antes de abrir o WhatsApp: se a
    // aba falhar ao abrir, o owner ainda tem o contato salvo.
    await registrarLead({
      tipo: 'troca',
      nome: data.nome,
      telefone: data.whatsapp,
      dados: {
        moto: `${data.marca} ${data.modelo} ${data.ano}`,
        quilometragem: data.quilometragem ?? null,
        estadoGeral: data.estadoGeral,
        valorPretendido: data.valorPretendido ?? null,
        observacoes: data.observacoes ?? null,
      },
      origem: '/troca',
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
          Avaliação solicitada
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-steel-400">
          Abrimos o WhatsApp com os dados da sua moto. A avaliação é feita por
          um atendente da loja — não é automática. Se a janela não abriu, use o
          botão abaixo.
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
          <label htmlFor="troca-nome" className="field-label">Nome *</label>
          <input id="troca-nome" type="text" autoComplete="name" className="input" {...register('nome')} />
          {errors.nome && <p className="mt-1.5 text-xs text-brand-500">{errors.nome.message}</p>}
        </div>
        <div>
          <label htmlFor="troca-zap" className="field-label">WhatsApp *</label>
          <input
            id="troca-zap"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(31) 9 9999-9999"
            className="input"
            {...register('whatsapp')}
          />
          {errors.whatsapp && <p className="mt-1.5 text-xs text-brand-500">{errors.whatsapp.message}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="troca-marca" className="field-label">Marca *</label>
          <input id="troca-marca" type="text" placeholder="Honda, Yamaha..." className="input" {...register('marca')} />
          {errors.marca && <p className="mt-1.5 text-xs text-brand-500">{errors.marca.message}</p>}
        </div>
        <div>
          <label htmlFor="troca-modelo" className="field-label">Modelo *</label>
          <input id="troca-modelo" type="text" placeholder="Ex.: CG 160" className="input" {...register('modelo')} />
          {errors.modelo && <p className="mt-1.5 text-xs text-brand-500">{errors.modelo.message}</p>}
        </div>
        <div>
          <label htmlFor="troca-ano" className="field-label">Ano *</label>
          <input id="troca-ano" type="number" min={1980} max={ANO_LIMITE} placeholder="2020" className="input" {...register('ano')} />
          {errors.ano && <p className="mt-1.5 text-xs text-brand-500">{errors.ano.message}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="troca-km" className="field-label">Quilometragem</label>
          <input id="troca-km" type="text" inputMode="numeric" placeholder="Ex.: 32.500" className="input" {...register('quilometragem')} />
          {errors.quilometragem && (
            <p className="mt-1.5 text-xs text-brand-500">{errors.quilometragem.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="troca-estado" className="field-label">Estado geral *</label>
          <select id="troca-estado" className="input" defaultValue="" {...register('estadoGeral')}>
            <option value="" disabled>Selecione</option>
            {estadosGerais.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          {errors.estadoGeral && (
            <p className="mt-1.5 text-xs text-brand-500">{errors.estadoGeral.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="troca-valor" className="field-label">Valor pretendido</label>
          <input id="troca-valor" type="text" placeholder="Ex.: R$ 12.000" className="input" {...register('valorPretendido')} />
        </div>
        <div>
          <label htmlFor="troca-obs" className="field-label">Observações</label>
          <input id="troca-obs" type="text" placeholder="Detalhes, revisões, pneus..." className="input" {...register('observacoes')} />
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
            Autorizo a DG Motos a entrar em contato para agendar a avaliação da
            minha motocicleta.
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
          Solicitar avaliação
        </button>
      </div>

      <p className="text-xs leading-relaxed text-steel-500">
        A avaliação é feita por um atendente da DG Motos, presencialmente ou por
        WhatsApp — não é um valor automático. Os dados ficam registrados apenas
        para retorno da loja e não são compartilhados com terceiros.
      </p>
    </form>
  )
}
