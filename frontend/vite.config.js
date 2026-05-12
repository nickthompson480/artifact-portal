import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { outDir: '../public', emptyOutDir: true },
  server: {
    proxy: {
      '/login':     'http://127.0.0.1:4567',
      '/logout':    'http://127.0.0.1:4567',
      '/me':        'http://127.0.0.1:4567',
      '/setup':     'http://127.0.0.1:4567',
      '/artifacts': 'http://127.0.0.1:4567',
      '/api':       'http://127.0.0.1:4567',
      '/settings':  'http://127.0.0.1:4567',
      '/share':     'http://127.0.0.1:4567',
      '/p':         'http://127.0.0.1:4567',
      '/public':    'http://127.0.0.1:4567',
      '/healthz':   'http://127.0.0.1:4567',
    },
  },
});
