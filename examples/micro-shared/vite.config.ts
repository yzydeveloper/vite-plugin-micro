import { defineConfig } from "vite";
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
            micro()
        ]
    }
})
