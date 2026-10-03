import { ClipboardList, Handshake, MapPinned, RefreshCcw } from 'lucide-react'
import { usePageMeta } from '../hooks/useNavigation'
import { TrocaForm } from '../components/forms/TrocaForm'
import { SectionHeading } from '../components/ui/SectionHeading'

export function Troca() {
  usePageMeta(
    'Troca de motocicleta | DG Motos',
    'Tem uma moto e quer trocar? Envie os dados e a DG Motos avalia seu veículo usado em Belo Horizonte.',
  )

  const fluxo = [
    {
      icon: ClipboardList,
      titulo: 'Envie os dados',
      texto: 'Preencha o formulário abaixo com as informações da sua moto atual.',
    },
    {
      icon: MapPinned,
      titulo: 'Agende a vistoria',
      texto: 'Um atendente confirma os detalhes e agenda a conferência na loja.',
    },
    {
      icon: Handshake,
      titulo: 'Receba a proposta',
      texto: 'Quem avalia é da equipe da loja. Valor justo e sem enrolação.',
    },
    {
      icon: RefreshCcw,
      titulo: 'Feche o negócio',
      texto: 'A troca entra no valor da moto nova e a documentação fica por nossa conta.',
    },
  ]

  return (
    <div className="pt-16">
      <section className="border-b border-white/10 bg-night-900">
        <div className="container-site py-12 sm:py-16">
          <p className="eyebrow">Troca</p>
          <h1 className="h-display mt-3 max-w-2xl text-4xl sm:text-5xl">
            Sua moto atual vale entrada na próxima
          </h1>
          <p className="mt-4 max-w-xl text-steel-400">
            Avaliamos sua motocicleta usada com transparência: você envia os
            dados, a gente confere e propõe um valor — presencialmente ou pelo
            WhatsApp.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <SectionHeading
              eyebrow="Como funciona"
              title="Fluxo da avaliação"
            />
            <ol className="mt-8 space-y-6">
              {fluxo.map(({ icon: Icon, titulo, texto }, i) => (
                <li key={titulo} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded border border-white/10 bg-night-900 font-display text-sm font-semibold text-brand-500">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="flex items-center gap-2 font-display text-base font-semibold uppercase">
                      <Icon className="size-4 text-steel-400" aria-hidden="true" />
                      {titulo}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-steel-400">{texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="surface rounded-lg p-6 sm:p-8">
            <TrocaForm />
          </div>
        </div>
      </section>
    </div>
  )
}
