import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { outDir: '../public', emptyOutDir: true },
  server: {
    proxy: {
      '/login':     'http://127.0.0.1:3000',
      '/logout':    'http://127.0.0.1:3000',
      '/me':        'http://127.0.0.1:3000',
      '/setup':     'http://127.0.0.1:3000',
      '/artifacts': 'http://127.0.0.1:3000',
      '/api':       'http://127.0.0.1:3000',
      '/settings':  'http://127.0.0.1:3000',
      '/share':     'http://127.0.0.1:3000',
      '/p':         'http://127.0.0.1:3000',
      '/public':    'http://127.0.0.1:3000',
      '/healthz':   'http://127.0.0.1:3000',
    },
  },
});
