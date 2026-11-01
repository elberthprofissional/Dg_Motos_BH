/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // React muda raramente; separá-lo mantém o chunk da aplicação
        // invalidando a cada deploy. Forma de função porque o Vite 8 usa
        // Rolldown, que não aceita a forma de objeto aqui.
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'react'
          }
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Reutiliza o worker entre arquivos em vez de subir um por arquivo:
    // encurta a suíte em vários segundos. Os testes ainda rodam cada
    // arquivo com mocks limpos (beforeEach/afterEach) — nada depende da
    // ordem, então o reuso não vaza estado entre eles.
    isolate: false,
  },
})