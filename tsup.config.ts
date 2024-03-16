import fs from 'node:fs'
import { defineConfig } from 'tsup'

export default defineConfig(() => ({
    entry: ['src/index.ts'],
    external: ['vite'],
    format: ['esm', 'cjs'],
    splitting: true,
    clean: true,
    dts: true
}))
