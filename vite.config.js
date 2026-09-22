import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import tailwindcss from '@tailwindcss/vite' // <-- Import the new Tailwind v4 plugin

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- Add it to the plugins list
    viteSingleFile() 
  ]
})
