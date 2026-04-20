export default async function healthRoutes(request) {
  const url = new URL(request.url);

  if (url.pathname === '/health' && request.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}
