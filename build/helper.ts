import {resolve, dirname} from 'node:path';
import { fileURLToPath } from 'node:url';
import Manifest from '../manifest.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = resolve(__dirname, '..')

export function resolveFromRoot(...paths: string[]): string {
    return resolve(root, ...paths)
}

export function getManifest(): chrome.runtime.ManifestV3 {
    const manifest: chrome.runtime.ManifestV3 = JSON.parse(JSON.stringify(Manifest))

    Reflect.deleteProperty(manifest, 'injects')

    manifest.manifest_version = 3
    manifest.$schema = 'https://json.schemastore.org/chrome-manifest.json'
    return manifest;
}
