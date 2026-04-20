import logger from './logger.js';

const SECRET = process.env.API_SECRET_KEY;

export function authMiddleware(request) {
  if (!SECRET) return null;

  const apiKey = request.headers.get('x-api-key');
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const token = apiKey ?? bearer;

  if (token !== SECRET) {
    logger.warn(`Unauthorized request: ${request.method} ${new URL(request.url).pathname}`);
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
