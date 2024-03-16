import { defineConfig } from "vite";
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
            micro()
        ]
    }
})
