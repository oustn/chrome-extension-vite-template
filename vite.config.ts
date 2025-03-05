import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import zipPack from 'vite-plugin-zip-pack';

import {resolveEntries} from './build/entries.ts'
import {createManifestPlugin, createIconPlugin, crxPack} from './build/plugins'
import packageJson from './package.json';

const entries = resolveEntries()

const archiveName = process.env.EXTENSION_VERSION ? `${packageJson.name}-${process.env.EXTENSION_VERSION}` :
    `${packageJson.name}`

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        createManifestPlugin(),
        createIconPlugin('public/vite.svg'),
        zipPack({
            outDir: './archives',
            outFileName: `${archiveName}.zip`,
        }),
        crxPack({
            outDir: './archives',
            outFileName: `${archiveName}.crx`,
            privateKey: process.env.PRIVATE_KEY,
        })
    ],
    build: {
        rollupOptions: {
            input: entries.map(d => d.value),
        }
    }
})
