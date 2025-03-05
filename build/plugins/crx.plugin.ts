import {PluginOption} from "vite";
import fs from "node:fs";
import path from "node:path"
import ChromeExtension from 'crx'

import {resolveFromRoot} from "../helper.ts";

export interface Options {
    /**
     * Input Directory
     * @default `dist`
     */
    inDir?: string;
    /**
     * Output Directory
     * @default `dist-crx`
     */
    outDir?: string;
    /**
     * Crx Archive Name
     * @default `dist.crx`
     */
    outFileName?: string;

    /**
     * Private key
     */
    privateKey?: string
}

export function crxPack(options?: Options): PluginOption {
    const privateKey = options?.privateKey;
    const inDir = resolveFromRoot(options?.inDir || "dist");
    const outDir = resolveFromRoot(options?.outDir || "dist-crx");
    const outFileName = options?.outFileName || "dist.crx";

    async function createCrx(privateKey: string, dist: string): Promise<Buffer> {
        const crx = new ChromeExtension({
            privateKey,
        });

        const loaded = await crx.load(dist)
        const crxBuffer = await loaded.pack()
        return crxBuffer
    }

    return {
        name: "vite-plugin-crx-pack",
        apply: "build",
        enforce: "post",
        closeBundle: {
            sequential: true,
            async handler() {
                if (!privateKey) {
                    console.log(
                        "\x1b[31m%s\x1b[0m",
                        `  - Private key is Empty`
                    );
                    return
                }
                try {
                    console.log("\x1b[36m%s\x1b[0m", `Crx packing - "${inDir}" folder :`);

                    if (!fs.existsSync(inDir)) {
                        throw new Error(` - "${inDir}" folder does not exist!`)
                    }

                    if (!fs.existsSync(outDir)) {
                        await fs.promises.mkdir(outDir, {recursive: true});
                    }

                    const buffer = await createCrx(privateKey, inDir)

                    fs.writeFileSync(path.join(outDir, outFileName), buffer)

                    console.log("\x1b[32m%s\x1b[0m", "  - Created crx archive.");
                } catch (error: unknown) {
                    if (error) {
                        console.log(
                            "\x1b[31m%s\x1b[0m",
                            `  - ${error}`
                        );
                    }

                    console.log(
                        "\x1b[31m%s\x1b[0m",
                        "  - Something went wrong while building crx file!"
                    );
                }
            }
        },
    };
}