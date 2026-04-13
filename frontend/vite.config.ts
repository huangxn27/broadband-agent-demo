import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SSE_LOGS_DIR = path.resolve(__dirname, 'data/sse_logs');

function sseLoggerPlugin(): Plugin {
  return {
    name: 'vite-plugin-sse-logger',
    configureServer(server) {
      fs.mkdirSync(SSE_LOGS_DIR, { recursive: true });
      server.middlewares.use('/dev/sse-log', (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405).end(); return; }
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
          try {
            const { convId, events } = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
            const ts = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15) + 'Z';
            const filename = `${convId}_${ts}.json`;
            fs.writeFileSync(path.join(SSE_LOGS_DIR, filename), JSON.stringify(events, null, 2), 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, file: filename }));
          } catch (e) {
            res.writeHead(500).end(String(e));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), sseLoggerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@mock': path.resolve(__dirname, 'docs/mock'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'echarts-vendor': ['echarts', 'echarts-for-react'],
          'markdown-vendor': ['react-markdown', 'remark-gfm'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
