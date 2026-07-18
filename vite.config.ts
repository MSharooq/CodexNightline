import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'

const buildVersion = process.env.CF_VERSION_METADATA_ID ?? Date.now().toString(36)

export default defineConfig({
  define: {
    __SAHAAYI_BUILD_VERSION__: JSON.stringify(buildVersion),
  },
  plugins: [react(), cloudflare()],
})
