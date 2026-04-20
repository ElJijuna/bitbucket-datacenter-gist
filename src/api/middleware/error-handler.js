import logger from './logger.js';

export default function errorHandler(error) {
  logger.error('Request error', error);

  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal Server Error';

  return new Response(
    JSON.stringify({
      error: message,
      status: statusCode,
      timestamp: new Date().toISOString(),
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
