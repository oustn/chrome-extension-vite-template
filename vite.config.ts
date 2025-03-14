import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import zipPack from 'vite-plugin-zip-pack'
import tailwindcss from '@tailwindcss/vite'

import { resolveEntries } from './build/entries.ts'
import {
  createManifestPlugin,
  createIconPlugin,
  crxPack,
  createHmr,
} from './build/plugins'
import packageJson from './package.json'

const entries = resolveEntries()

const archiveName = process.env.EXTENSION_VERSION
  ? `${packageJson.name}-${process.env.EXTENSION_VERSION}`
  : `${packageJson.name}`

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      createHmr(),
      createManifestPlugin(),
      createIconPlugin('public/vite.svg'),
      !isDev &&
        zipPack({
          outDir: './archives',
          outFileName: `${archiveName}.zip`,
        }),
      !isDev &&
        crxPack({
          outDir: './archives',
          outFileName: `${archiveName}.crx`,
          privateKey: process.env.PRIVATE_KEY,
        }),
    ],
    build: {
      minify: !isDev,
      sourcemap: isDev,
      rollupOptions: {
        input: entries.map((d) => d.value),
      },
    },
  }
})
