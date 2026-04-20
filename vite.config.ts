import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import prerender from 'vite-plugin-prerender'

export default defineConfig({
  plugins: [
    react(),
    // Prerender only the home route so Google sees real HTML content
    // instead of a blank <div id="root"></div>
    prerender({
      staticDir: 'dist',
      routes: ['/'],
    }),
  ],
  server: { port: 3000 },
})
