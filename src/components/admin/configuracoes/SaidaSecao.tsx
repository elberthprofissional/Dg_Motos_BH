import { ArrowUpRight } from 'lucide-react'
import type { ConfigLoja } from '../../../lib/configLoja'
import { whatsappUrlCom } from '../../../lib/configLoja'
import { buildMapsRouteUrl } from '../../../lib/maps'
import { InstagramIcon } from '../../ui/InstagramIcon'
import { formatarWhatsapp, handleComArroba, urlDoHandle } from './dados'
import type { SecaoConfig } from './dados'

/** Prévia do que o site publica com o rascunho atual do bloco. */
export function SaidaSecao({ id, config }: { id: SecaoConfig; config: ConfigLoja }) {
  if (id === 'contato') {
    const linkTeste = whatsappUrlCom(config, 'Olá! Estou testando o botão do site da DG Motos.')

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
            <p className="mesa-saida-vazio">Preencha o endereço para gerar o link do mapa.</p>
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
          <p className="mesa-saida-vazio">Sem faixas — o site não mostra horário.</p>
        ) : (
          <div className="mesa-saida-placa">
            {faixas.map((horario, indice) => (
              <div className="mesa-saida-horario" key={`${horario.dias}-${horario.horas}-${indice}`}>
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
