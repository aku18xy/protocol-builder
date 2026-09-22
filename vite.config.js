import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
<<<<<<< HEAD
import { viteSingleFile } from 'vite-plugin-singlefile'
import tailwindcss from '@tailwindcss/vite' // <-- Import the new Tailwind v4 plugin

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- Add it to the plugins list
    viteSingleFile() 
  ]
=======
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
>>>>>>> 8904274b7fc74ca3907f95b9ff7e2ac60555bbe9
})
