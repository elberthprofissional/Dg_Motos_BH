import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ErroDeRender } from './components/ui/ErroDeRender'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErroDeRender>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErroDeRender>
  </StrictMode>,
)

// Service worker só em produção: em dev, cache atrapalharia o HMR.
// `registration.update()` na troca de foco faz o navegador checar se o
// deploy trouxe um sw.js novo sem esperar o próximo reload do app.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void registration.update().catch(() => undefined)
      })
    } catch {
      // Sem SW o app funciona igual; não é erro que precise interromper.
    }
  })
}

