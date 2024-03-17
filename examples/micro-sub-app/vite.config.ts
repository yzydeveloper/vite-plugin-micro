import { defineConfig } from "vite";
import vue from '@vitejs/plugin-vue'
import micro from 'vite-plugin-micro'

export default defineConfig(()=>{
    return {
        server: {
            port: 5174
        },
        preview: {
            port: 5174
        },
        plugins: [
            vue(),
            micro({
                entry: './src/index.ts'
            })
        ]
    }
})
