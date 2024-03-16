import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'tsup'

export default defineConfig(() => ({
    entry: ['src/index.ts'],
    external: ['vite'],
    format: ['esm', 'cjs'],
    splitting: true,
    clean: true,
    dts: true,
    esbuildPlugins: [{
        name: 'esbuild-cpoy',
        setup(build) {
            build.onEnd(() => {
                fs.copyFileSync(
                    path.resolve(__dirname, './src/_loader.js'),
                    path.resolve(__dirname, './dist/_loader.js')
                )
            })
        }
    }]
}))
