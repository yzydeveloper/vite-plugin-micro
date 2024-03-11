import {  type Plugin } from 'vite'

const VITE_PLUGIN_NAME = 'vite-plugin-micro'

type Remotes = Record<string, string> | string[]

type Exposes = Record<string, string>

type Shared = string[]

type Metadata = Record<string, string>

interface Options {
    name?: string
    remotes?: Remotes
    exposes?: Exposes
    shared?: Shared
}

function PluginMicro(options: Options): Plugin {
}

export default PluginMicro
