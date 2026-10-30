import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defaultClientConditions, defineConfig } from 'vite';

const WEB_EXTENSIONS = ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'];

const API_DEV_URL = process.env['API_URL'] ?? 'http://localhost:3000';

export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^react-native$/,
        replacement: resolve(import.meta.dirname, 'web/react-native-shim.js'),
      },
    ],
    extensions: WEB_EXTENSIONS,
    conditions: ['@hawa/source', ...defaultClientConditions],
  },
  define: {
    __DEV__: JSON.stringify(mode !== 'production'),
    global: 'globalThis',
  },
  optimizeDeps: {
    // maplibre-gl locates its web worker relative to its own file; pre-bundling breaks that path.
    exclude: ['maplibre-gl'],
    rolldownOptions: {
      resolve: { extensions: WEB_EXTENSIONS },
    },
  },
  server: {
    proxy: { '/v1': API_DEV_URL },
  },
  build: {
    outDir: 'dist-web',
  },
}));
