import path from 'node:path'
import fs from 'node:fs'
import { normalizePath, createLogger, type ResolvedConfig, type PluginOption, type HtmlTagDescriptor, type AliasOptions } from 'vite'
import colors from 'picocolors'

const __loadMetadata = fs.readFileSync(path.resolve(__dirname, './_loader.js'), 'utf-8')

const VITE_PLUGIN_NAME = 'vite-plugin-micro'
const REMOTE_ENTRY_FILENAME = 'remote-entry.js'
const METADATA_FILENAME = 'metadata.json'

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
    let config: ResolvedConfig
    let packageJson: any
    const metadata: Metadata = {}

    return {
        name: `${VITE_PLUGIN_NAME}-serve`,
        apply: 'serve',
        async config() {
            // https://github.com/vitejs/vite/pull/14855
            if(!options.remotes || process.argv[2] === 'preview') return

            const logger = createLogger()
            const promises: Promise<AliasOptions>[] = []

            for (const [remoteName, remote] of Object.entries(options.remotes)) {
                const remoteUrl = remote.endsWith('/') ? remote : `${remote}/`
                const metadataUrl = `${remoteUrl}_metadata.json`
                promises.push(
                    fetch(metadataUrl)
                        .then(res => res.json())
                        .catch(() => {
                            logger.error(
                                colors.red(`Error when fetching metadata for remote '${remoteName}' at URL ${metadataUrl}`)
                            )
                        })
                )
            }
            const alias = await Promise.all(promises)

            return {
                resolve: {
                    alias: Object.assign({}, ...alias)
                }
            }
        },
        configResolved(_config) {
            config = _config
            packageJson = JSON.parse(
                fs.readFileSync(path.resolve(config.root, 'package.json'), 'utf-8')
            )
        },
        configureServer(server) {
            server.middlewares.use('/_metadata.json', (_, res) => {
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(metadata, null, 2))
            })
        },
        async buildStart() {
            // Iterating over options.exposes and adding them to the metadata mapping, these are modules to be exposed.
            for (const [exposeName, exposeValue] of Object.entries(options.exposes || {})) {
                const moduleName = `${options.name ?? packageJson.name}/${exposeName}`
                metadata[moduleName] = path.resolve(config.root, exposeValue)
            }

            // Resolving each item in the options.shared array, adding results to metadata.
            await Promise.all(
                options.shared?.map(sharedItem =>
                    this.resolve(sharedItem).then(resolved => {
                        if(resolved) {
                            metadata[sharedItem] = resolved.id
                        }
                    })) || []
            )

            // If options.entry is specified, resolve and add it to metadata.
            if(options.entry) {
                metadata[packageJson.name] = path.resolve(config.root, options.entry)
            }
        },
    }
}

export function PluginMicroBuild(options: Options): PluginOption {
    let config: ResolvedConfig
    let packageJson: any
    const metadata: Metadata = {}

    return {
        name: `${VITE_PLUGIN_NAME}-build`,
        apply: 'build',
        config() {
            // remote.key === package.name ??? remote.key as external ??? But how to process shared ???
            const external = Object.keys(options.remotes || {}).map(remoteName => new RegExp(`^${remoteName}/?.*$`))

            return {
                base: './', // [https://vitejs.dev/config/shared-options.html#base](Empty string or ./ (for embedded deployment))
                build: {
                    rollupOptions: {
                        external
                    }
                }
            }
        },
        configResolved(_config) {
            config = _config
            packageJson = JSON.parse(
                fs.readFileSync(path.resolve(config.root, 'package.json'), 'utf-8')
            )
        },
        buildStart() {
            for (const [exposeName, exposeValue] of Object.entries(options.exposes || {})) {
                this.emitFile({
                    type: 'chunk',
                    id: exposeValue,
                    name: exposeName,
                    preserveSignature: 'strict'
                })
            }
            for (const sharedItem of options.shared || []) {
                this.emitFile({
                    type: 'chunk',
                    id: sharedItem,
                    name: sharedItem,
                    preserveSignature: 'allow-extension'
                })
            }

            if(options.entry) {
                this.emitFile({
                    type: 'chunk',
                    id: options.entry,
                    name: packageJson.name,
                    preserveSignature: 'allow-extension'
                })
            }
        },
        transformIndexHtml(code) {
            if(!options.remotes || config.command === 'serve') return

            const tags: HtmlTagDescriptor[] = []
            const html = code.replace(/type=["']module["']/g, 'type="module-shim"')
                .replace(/rel=["']modulepreload["']/g, 'rel="modulepreload-shim"')

            tags.push({
                tag: 'script',
                injectTo: 'body',
                children: `(function() {
                    const _base = '${config.base}';
                    const _remotes = JSON.parse('${JSON.stringify(options.remotes)}');
                    ${__loadMetadata}
                })();`
            })

            return {
                html,
                tags
            }
        },
        // By default, this object will typically only include JavaScript chunks.
        // Assets like CSS or images would only be present if relevant
        generateBundle({ format }, bundle) {
            function getChunkName(chunk: any) {
                if (chunk.facadeModuleId) {
                    let name = normalizePath(
                        path.relative(config.root, chunk.facadeModuleId),
                    )
                    if (format === 'system' && !chunk.name.includes('-legacy')) {
                        const ext = path.extname(name)
                        const endPos = ext.length !== 0 ? -ext.length : undefined
                        name = `${name.slice(0, endPos) }-legacy${ ext}`
                    }
                    return name.replace(/\0/g, '')
                }
                return chunk.name
            }

            const chunkNameToFile = new Map<string, string>()

            Object.values(bundle).forEach(chunk => {
                // Does chunk name to package name ???
                // add it to the metadata.
                if(chunk.name && options.shared?.includes(chunk.name)) {
                    metadata[chunk.name] = chunk.fileName
                }

                // If chunk name is the entry
                if(chunk.name && chunk.name === packageJson.name && options.entry) {
                    metadata[chunk.name] = chunk.fileName
                }

                chunkNameToFile.set(getChunkName(chunk), chunk.fileName)
            })

            // Processes each exposed module specified in the options,
            // and if the exposed value includes the chunk name, add it to the metadata.
            Object.entries(options.exposes || {}).forEach(([exposeName, exposeValue]) => {
                for (const [chunkName, fileName] of chunkNameToFile) {
                    if(exposeValue.includes(chunkName)) {
                        const moduleName = `${options.name ?? packageJson.name}/${exposeName}`
                        metadata[moduleName] = fileName
                    }
                }
            })

            this.emitFile({
                fileName: METADATA_FILENAME,
                type: 'asset',
                source: JSON.stringify(metadata, undefined, 2),
            })

            this.emitFile({
                fileName: REMOTE_ENTRY_FILENAME,
                type: 'asset',
                source: `export const metadata = ${JSON.stringify(metadata, undefined, 2)}`
            })
        },
        writeBundle({ dir }, bundle) {
            const chunks = Object.values(bundle)
            const cssChunkFileNames = chunks.filter(chunk => chunk.fileName.endsWith('.css')).map(cssChunk => cssChunk.fileName)
            if(!cssChunkFileNames.length) return

            for (const chunk of chunks) {
                if(chunk.type === 'asset' && chunk.fileName === REMOTE_ENTRY_FILENAME) {
                    const chunkPath = path.resolve(dir || '', chunk.fileName)
                    fs.writeFileSync(chunkPath, `
                        const cssChunkFileNames = ${JSON.stringify(cssChunkFileNames)}
                        for (const filename of cssChunkFileNames) {
                            const chunkStyle = document.createElement('link');
                            chunkStyle.rel = 'stylesheet';
                            chunkStyle.href = import.meta.url.replace('${chunk.fileName}', filename);
                            document.head.appendChild(chunkStyle);
                        };\n${fs.readFileSync(chunkPath)}
                    `)
                }
            }
        }

        // Inject css into the entry
        // writeBundle({ dir }, bundle) {
        //     const chunks = Object.values(bundle)
        //     const cssChunkFileNames = chunks.filter(chunk => chunk.fileName.endsWith('.css')).map(cssChunk => cssChunk.fileName)

        //     if(!cssChunkFileNames.length) return

        //     for (const chunk of chunks) {
        //         const chunkPath = path.resolve(dir || '', chunk.fileName)

        //         if(chunk.type === 'chunk' && chunk.name === packageJson.name && options.entry) {
        //             fs.writeFileSync(chunkPath, `
        //                 const cssChunkFileNames = ${JSON.stringify(cssChunkFileNames)}
        //                 for (const filename of cssChunkFileNames) {
        //                     const chunkStyle = document.createElement('link');
        //                     chunkStyle.rel = 'stylesheet';
        //                     chunkStyle.href = import.meta.url.replace('${chunk.fileName}', filename);
        //                     document.head.appendChild(chunkStyle);
        //                 }\n${chunk.code}
        //             `)
        //         }
        //     }
        // }

        // Inject css into the raw file
        // writeBundle({ dir }, bundle) {
        //     const chunks = Object.values(bundle)
        //     const cssChunk = chunks.find(chunk => chunk.fileName.endsWith('.css'))

        //     if(!cssChunk) return

        //     for (const chunk of chunks) {
        //         const chunkPath = path.resolve(dir || '', chunk.fileName)

        //         if(chunk.type === 'chunk' && chunk.isEntry) {
        //             fs.writeFileSync(chunkPath, `
        //             const chunkStyle = document.createElement('link');
        //             chunkStyle.rel = 'stylesheet';
        //             chunkStyle.href = import.meta.url.replace('${chunk.fileName}','${cssChunk.fileName}');
        //             document.head.appendChild(chunkStyle);\n${chunk.code}`)
        //         }
        //     }
        // }
    }
}

function PluginMicro(options: Options): PluginOption {
    return [PluginMicroServe(options), PluginMicroBuild(options)]
}

export default PluginMicro
