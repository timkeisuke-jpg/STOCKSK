import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          // includeAssetsは削除（アイコンなしの要望のため）
          manifest: {
            name: 'STOCKSK',
            short_name: 'STOCKSK',
            description: 'Stock knowledge. Invest in yourself.',
            theme_color: '#1967D2',
            background_color: '#F0F4F9',
            display: 'standalone',
            // iconsは設定しない（アイコンなしの要望のため）
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
