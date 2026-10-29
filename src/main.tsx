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
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

