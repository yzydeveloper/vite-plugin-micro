import { defineConfig,loadEnv } from "vite";
import vue from '@vitejs/plugin-vue'
import micro from 'vite-plugin-micro'

export default defineConfig(({mode})=>{
    const env = loadEnv(mode, process.cwd(), '')
    
    return {
        server: {
            port: 8888
        },
        preview: {
            port: 8888
        },
        build: {
            rollupOptions: {
                external: ['vue']
            }
        },
        plugins: [
            vue(),
            micro({
                remotes: {
                    '@micro/sub-app': env.MICRO_SUB_APP_URL,
                    '@micro/shared': env.MICRO_SHARED_URL
                }
            })
        ]
    }
})
