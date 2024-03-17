import { defineConfig } from "vite";
import vue from '@vitejs/plugin-vue'
import micro from 'vite-plugin-micro'

export default defineConfig(()=>{
    return {
        server: {
            port: 5175
        },
        preview: {
            port: 5175
        },
        plugins: [
            vue(),
            micro({
                exposes: {
                    'header': './src/shared-header.vue',
                    'footer': './src/shared-footer.vue',
                    page: './src/shared-page.vue'
                },
                shared: ['vue']
            })
        ]
    }
})
