import { defineConfig } from "vite";
import micro from 'vite-plugin-micro'

export default defineConfig(()=>{
    return {
        server: {
            port: 8888
        },
        preview: {
            port: 8888
        },
        plugins: [
            micro()
        ]
    }
})
