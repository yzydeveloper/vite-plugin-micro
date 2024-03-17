import { defineConfig } from "vite";
import vue from '@vitejs/plugin-vue'
import micro from 'vite-plugin-micro'

export default defineConfig(()=>{
    return {
        server: {
            port: 8888
        },
        preview: {
            port: 8888
        },
        build: {
            rollupOptions: {
                external: ['vue', /@micro.*/]
            }
        },
        plugins: [
            vue(),
            micro({
                remotes: {
                    '@micro/sub-app': 'http://localhost:5174/',
                    '@micro/shared': 'http://localhost:5175/'
                }
            })
        ]
    }
})
