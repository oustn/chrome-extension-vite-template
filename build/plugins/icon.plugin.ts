import type {Plugin} from 'vite';
import type {PluginContext} from 'rollup';
import favicons from 'favicons';
import {basename, extname} from 'node:path'
import {resolveFromRoot} from "../helper.ts";

function generateIcons(name: string) {
    return [
        {
            name: "favicon-16x16.png",
            real: `${name}_16.png`,
        },
        {
            name: "favicon-32x32.png",
            real: `${name}_32.png`,
        },
        {
            name: "favicon-48x48.png",
            real: `${name}_48.png`,
        },
        {
            name: "favicon.svg",
            real: `${name}_128.png`,
            sizes: [
                {
                    width: 128,
                    height: 128,
                },
            ],
        }
    ].map((item) => {
        let read = false
        return new Proxy(item, {
            get(target, key) {
                if (key !== 'name') {
                    return Reflect.get(target, key);
                }
                if (read && target.real) {
                    return target.real
                }
                read = true
                return target.name
            },
        })
    })
}

export type ViteIconPluginOptions = {
    icon?: string,
    name?: string,
} | string

export const createIconPlugin = (options: ViteIconPluginOptions = {}): Plugin => {
    const lOptions = typeof options === 'string' ? {icon: options} : options;

    const LOGO_PATH = resolveFromRoot(lOptions.icon || resolveFromRoot('assets', 'logo.png'));

    const name = lOptions.name ?? basename(LOGO_PATH, extname(LOGO_PATH)) ?? 'icon'

    const getFavicons = async () => {
        return await favicons(LOGO_PATH, {
            icons: {
                android: false,
                appleIcon: false,
                appleStartup: false,
                favicons: generateIcons(name) as unknown as string[],
                windows: false,
                yandex: false,
            },
        });
    };

    const assetIds: Map<string, string> = new Map();

    const rebuildIcon = async (ctx: PluginContext) => {
        ctx.addWatchFile(LOGO_PATH);
        const res = await getFavicons();

        for (const {name, contents} of res.images) {
            assetIds.set(name, ctx.emitFile({type: 'asset', fileName: `icons/${name}`, source: contents}));
        }
    };

    return {
        name: 'chrome-extension-icon-plugin',
        async buildStart() {
            await rebuildIcon(this);
        },
    };
};
