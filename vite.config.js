import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import mockData from './ui/mock/mockData.js';

const mockPlugin = () => ({
  name: 'mock-server',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const mock = mockData.find(m => {
        if (m.match) return m.match(req);
        const [pathname] = req.url.split('?');
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
