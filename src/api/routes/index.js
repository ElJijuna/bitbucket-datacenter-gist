import gistRoutes from './gists.js';
import repositoryRoutes from './repository.js';
import healthRoutes from './health.js';

export default async function router(request) {
  const { pathname } = new URL(request.url);

  if (pathname.startsWith('/health')) return healthRoutes(request);
  if (pathname.startsWith('/api/projects/')) return gistRoutes(request);
  if (pathname.startsWith('/api/repository')) return repositoryRoutes(request);

  return null;
}
