import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: {
        port: 3000,
        open: true,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        target: 'esnext',
        assetsInlineLimit: 8192, // Inline assets smaller than 8kb as base64 to save HTTP requests
        cssCodeSplit: true, // Allow Vite to load CSS asynchronously per chunk
        rollupOptions: {
            output: {
                manualChunks: {
                    reactCore: ['react', 'react-dom'],
                    router: ['react-router-dom'],
                    ui: ['react-icons', '@headlessui/react', 'react-easy-crop']
                }
            }
        }
    }
});
