import GitManager from '../../services/git-manager.js';
import GistManager from '../../services/gist-manager.js';
import { isAllowed } from '../../config/whitelist.js';
import logger from '../middleware/logger.js';

const ROUTE_RE = /^\/api\/projects\/([^/]+)\/repos\/([^/]+)\/gists\/([^/]+)$/;
const SAFE_FILE_RE = /^[a-zA-Z0-9._-]+$/;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function gistRoutes(request) {
  const { pathname } = new URL(request.url);
  const match = pathname.match(ROUTE_RE);

  if (!match) return null;
  if (request.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

  const [, project, repo, file] = match;

  if (!SAFE_FILE_RE.test(file)) {
    return json({ error: 'Invalid file name' }, 400);
  }

  if (!isAllowed(project, repo)) {
    logger.warn(`Blocked: ${project}/${repo}`);
    return json({ error: 'Repository not allowed' }, 403);
  }

  try {
    const body = await request.json();
    const { content } = body;

    if (!content) return json({ error: 'content is required' }, 400);

    const gitManager = GitManager.getInstance(project, repo);
    const gistManager = new GistManager(gitManager);
    const result = await gistManager.upsertFile(file, content);

    return json(result, 200);
  } catch (error) {
    logger.error('Gist route error', error);
    return json({ error: error.message }, 500);
  }
}
