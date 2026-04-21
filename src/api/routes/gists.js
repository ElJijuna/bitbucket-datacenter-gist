import GitManager from '../../services/git-manager.js';
import GistManager from '../../services/gist-manager.js';
import { isAllowed } from '../../config/whitelist.js';
import logger from '../middleware/logger.js';

const ROUTE_RE = /^\/api\/gist\/([^/]+)\/([^/]+)\/([^/]+)$/;
const SAFE_FILE_RE = /^[a-zA-Z0-9._-]+$/;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function gistRoutes(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(ROUTE_RE);

  if (!match) return null;

  const [, project, repo, file] = match;
  const { method } = request;

  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  if (!SAFE_FILE_RE.test(file)) {
    return json({ error: 'Invalid file name' }, 400);
  }

  if (!isAllowed(project, repo)) {
    logger.warn(`Blocked: ${project}/${repo}`);
    return json({ error: 'Repository not allowed' }, 403);
  }

  const gitManager = GitManager.getInstance(project, repo);
  const gistManager = new GistManager(gitManager);

  try {
    if (method === 'GET') {
      const branch = url.searchParams.get('branch');
      if (!branch) return json({ error: 'branch query param is required' }, 400);

      const result = await gistManager.readFile(file, branch);
      if (!result) return json({ error: 'File not found' }, 404);
      return json(result, 200);
    }

    if (method === 'DELETE') {
      const branch = url.searchParams.get('branch');
      if (!branch) return json({ error: 'branch query param is required' }, 400);

      const result = await gistManager.deleteFile(file, branch);
      return json(result, 200);
    }

    // POST and PUT — branch and content come from body
    const body = await request.json();
    const { branch, content } = body;

    if (!branch) return json({ error: 'branch is required' }, 400);
    if (content === undefined || content === null) return json({ error: 'content is required' }, 400);

    if (method === 'POST') {
      const result = await gistManager.createFile(file, content, branch);
      return json(result, 201);
    }

    if (method === 'PUT') {
      const result = await gistManager.updateFile(file, content, branch);
      return json(result, 200);
    }
  } catch (error) {
    logger.error('Gist route error', error);
    return json({ error: error.message }, error.status ?? 500);
  }
}
