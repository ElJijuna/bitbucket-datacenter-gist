import 'dotenv/config';
import { serve } from 'bun';
import path from 'path';
import fs from 'fs';
import router from './routes/index.js';
import errorHandler from './middleware/error-handler.js';
import logger from './middleware/logger.js';

const { PORT = 3000 } = process.env;
const UI_DIST = path.resolve('./ui/dist');

const requiredEnvVars = ['BITBUCKET_SERVER_HOST', 'BITBUCKET_USER', 'ALLOWED_REPOS'];
if ((process.env.GIT_CLONE_PROTOCOL || 'ssh') === 'https') {
  requiredEnvVars.push('BITBUCKET_TOKEN');
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

function serveStatic(pathname) {
  if (!fs.existsSync(UI_DIST)) return null;
  const filePath = path.join(UI_DIST, pathname === '/' ? 'index.html' : pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return new Response(Bun.file(filePath));
  }
  const indexPath = path.join(UI_DIST, 'index.html');
  if (fs.existsSync(indexPath)) {
    return new Response(Bun.file(indexPath));
  }
  return null;
}

serve({
  port: PORT,
  fetch: async (request) => {
    const { pathname } = new URL(request.url);
    logger.info(`${request.method} ${pathname}`);

    try {
      const apiResponse = await router(request);
      if (apiResponse) return apiResponse;

      const staticResponse = serveStatic(pathname);
      if (staticResponse) return staticResponse;

      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return errorHandler(error);
    }
  },
});

logger.info(`Bitbucket Gist API running on http://localhost:${PORT}`);
