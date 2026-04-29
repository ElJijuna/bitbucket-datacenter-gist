import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import mockData from './ui/mock/mockData.js';

const SSE_MOCK_LINES = [
  { level: 'info',  message: 'Bitbucket Gist API running on http://localhost:3000' },
  { level: 'info',  message: 'GET /api/repos' },
  { level: 'info',  message: 'Cloning PROJECT/my-repo...' },
  { level: 'debug', message: 'git clone: counting 100%' },
  { level: 'debug', message: 'git clone: compressing 100%' },
  { level: 'debug', message: 'git clone: receiving 45%' },
  { level: 'debug', message: 'git clone: receiving 100%' },
  { level: 'debug', message: 'git clone: resolving 100%' },
  { level: 'info',  message: '✓ Cloned PROJECT/my-repo' },
  { level: 'info',  message: 'GET /api/gists/PROJECT/my-repo' },
  { level: 'info',  message: '✓ Committed: gists/example.md (push scheduled)' },
  { level: 'debug', message: 'git push: writing 100%' },
  { level: 'info',  message: '✓ Push: PROJECT/my-repo' },
  { level: 'warn',  message: 'Pull warning for PROJECT/my-repo: could not read Username' },
  { level: 'error', message: 'Push failed for PROJECT/other-repo: remote rejected' },
  { level: 'info',  message: '✓ Deleted & pushed: gists/old.md → main' },
];

const mockPlugin = () => ({
  name: 'mock-server',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const [pathname] = req.url.split('?');

      if (pathname === '/api/logs/stream') {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        let i = 0;
        const send = () => {
          const entry = { ...SSE_MOCK_LINES[i % SSE_MOCK_LINES.length], timestamp: new Date().toISOString() };
          res.write(`data: ${JSON.stringify(entry)}\n\n`);
          i++;
        };
        send();
        const timer = setInterval(send, 1500);
        req.on('close', () => clearInterval(timer));
        return;
      }

      const mock = mockData.find(m => {
        if (m.match) return m.match(req);
        return pathname === m.url && req.method === m.method;
      });
      if (mock) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(mock.response(req)));
      } else {
        next();
      }
    });
  },
});

const useMocks = process.env.MOCK !== 'false';

export default defineConfig({
  root: './ui',
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.js',
      quoteStyle: 'single',
      disableTypes: true,
    }),
    react(),
    ...(useMocks ? [mockPlugin()] : []),
  ],
  server: {
    port: 5173,
    proxy: useMocks ? {} : {
      '/api': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
  },
});
