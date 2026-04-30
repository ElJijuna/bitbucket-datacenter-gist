import gistRoutes from './gists.js';
import repositoryRoutes from './repository.js';
import healthRoutes from './health.js';
import statusRoutes from './status.js';
import { authMiddleware } from '../middleware/auth.js';

export default async function router(request) {
  const { pathname } = new URL(request.url);

  if (pathname.startsWith('/health')) return healthRoutes(request);

  if (pathname.startsWith('/api/projects/')) {
    const denied = authMiddleware(request);
    if (denied) return denied;
  }

  if (pathname === '/api/repos' || pathname === '/api/tasks') return statusRoutes(request);
  if (pathname.startsWith('/api/projects/')) return gistRoutes(request);
  if (pathname.startsWith('/api/repository')) return repositoryRoutes(request);

  return null;
}
