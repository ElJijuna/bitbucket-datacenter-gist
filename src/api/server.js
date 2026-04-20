import 'dotenv/config';
import { serve } from 'bun';
import router from './routes/index.js';
import errorHandler from './middleware/error-handler.js';
import logger from './middleware/logger.js';

const { PORT = 3000 } = process.env;

const server = serve({
  port: PORT,
  fetch: async (request) => {
    logger.info(`${request.method} ${new URL(request.url).pathname}`);

    try {
      const response = await router(request);
      if (response) return response;

      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return errorHandler(error);
    }
  },
});

console.log(`✓ Bitbucket Gist API Server running on http://localhost:${PORT}`);
console.log('Press Ctrl+C to stop');

const requiredEnvVars = [
  'BITBUCKET_SERVER_HOST',
  'BITBUCKET_USER',
  'ALLOWED_REPOS',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`✗ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

console.log('✓ Environment variables validated');
