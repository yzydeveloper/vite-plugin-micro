import path from 'node:path'
import fs from 'node:fs'
import { type ResolvedConfig, type PluginOption } from 'vite'

const VITE_PLUGIN_NAME = 'vite-plugin-micro'
const REMOTE_ENTRY_FILENAME = 'remote-entry.js'

type Remotes = Record<string, string> | string[]

type Exposes = Record<string, string>

type Shared = string[]

type Metadata = Record<string, string>

interface Options {
    name?: string
    entry?: string
    remotes?: Remotes
    exposes?: Exposes
    shared?: Shared
}

export function PluginMicroServe(options: Options): PluginOption {
    return {
        name: `${VITE_PLUGIN_NAME}-serve`,
        apply: 'serve'
    }
}

export function PluginMicroBuild(options: Options): PluginOption {
    let config: ResolvedConfig
    let packageJson: any

    return {
        name: `${VITE_PLUGIN_NAME}-build`,
        apply: 'build',
        config() {
            return{
                // build: {
                //     rollupOptions: {
                //         preserveEntrySignatures: 'strict'
                //     },
                //     cssCodeSplit: false
                // }
            }
        },
        configResolved(_config) {
            config = _config
            packageJson = JSON.parse(
                fs.readFileSync(path.resolve(config.root, 'package.json'), 'utf-8')
            )
        },
        buildStart() { },
        transformIndexHtml() { },
        generateBundle() { },
        writeBundle() { }
    }
}

function PluginMicro(options: Options): PluginOption {
    return [PluginMicroServe(options), PluginMicroBuild(options)]
}

export default PluginMicro
