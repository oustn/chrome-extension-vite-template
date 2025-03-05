import {resolveFromRoot} from "./helper"
import manifest from '../manifest.json'
import _ from 'lodash'

interface ManifestEntry {
    value: string;
    file: string;
    manifestPath: string;
}

function isEntry(name: string) {
    return name && /\.(ts|js|less|css|scss|html)$/.test(name)
}

export function resolveEntries() {
    const entries: Array<ManifestEntry> = []

    function walk(data: unknown, path: string[] = []) {
        if (!data) return
        if (_.isString(data) && isEntry(data)) {
            entries.push({
                value: data,
                file: resolveFromRoot(data),
                manifestPath: path.join('.'),
            })
            return
        }
        if (_.isArray(data)) {
            data.forEach((d, i) => walk(d, [...path, `${i}`]))
            return
        }
        if (_.isObject(data)) {
            Object.entries(data).forEach(([key, value]) => walk(value, [...path, key]))
        }
    }

    walk(manifest)
    return entries
}
