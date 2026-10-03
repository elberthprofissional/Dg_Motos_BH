/**
 * Placeholder local (SVG) usado enquanto a foto não carrega ou
 * quando a moto não tem imagem cadastrada.
 */
export const PLACEHOLDER_CARD =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
  <rect width="640" height="420" fill="#191919"/>
  <rect x="1" y="1" width="638" height="418" fill="none" stroke="#2a2a2a" stroke-width="2"/>
  <path d="M330 300 a70 70 0 1 0 0.1 0 M262 262 h30" stroke="#3a3a3a" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M348 244 h60 a8 8 0 0 1 8 8 v20 h-68 z" fill="#3a3a3a"/>
  <text x="320" y="120" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#4a4a4a" text-anchor="middle" letter-spacing="6">DG MOTOS</text>
  <text x="320" y="150" font-family="Arial, sans-serif" font-size="13" fill="#4a4a4a" text-anchor="middle" letter-spacing="3">FOTO EM BREVE</text>
</svg>`)

export const PLACEHOLDER_GALLERY =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#191919"/>
  <rect x="1" y="1" width="1198" height="798" fill="none" stroke="#2a2a2a" stroke-width="2"/>
  <path d="M620 570 a130 130 0 1 0 0.1 0 M495 490 h56" stroke="#3a3a3a" stroke-width="18" fill="none" stroke-linecap="round"/>
  <path d="M650 445 h112 a14 14 0 0 1 14 14 v38 h-126 z" fill="#3a3a3a"/>
  <text x="600" y="225" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#4a4a4a" text-anchor="middle" letter-spacing="10">DG MOTOS</text>
  <text x="600" y="278" font-family="Arial, sans-serif" font-size="24" fill="#4a4a4a" text-anchor="middle" letter-spacing="5">FOTO EM BREVE</text>
</svg>`)
