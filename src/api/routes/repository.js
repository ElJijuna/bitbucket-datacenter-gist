import GitManager from '../../services/git-manager.js';
import getBitbucketClient from '../../config/bitbucket-client.js';
import logger from '../middleware/logger.js';

function getDefaultGitManager() {
  const { BITBUCKET_PROJECT: project, BITBUCKET_REPOSITORY: repo } = process.env;

  if (!project || !repo) {
    throw new Error('BITBUCKET_PROJECT and BITBUCKET_REPOSITORY are required for repository routes');
  }

  return GitManager.getInstance(project, repo);
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function repositoryRoutes(request) {
  const { pathname } = new URL(request.url);
  const method = request.method;

  try {
    if (pathname === '/api/repository/status' && method === 'GET') {
      const status = await getDefaultGitManager().getStatus();
      return json({ status }, 200);
    }

    if (pathname === '/api/repository/pull' && method === 'POST') {
      await getDefaultGitManager().pull();
      return json({ message: 'Repository pulled successfully' }, 200);
    }

    if (pathname === '/api/repository/push' && method === 'POST') {
      await getDefaultGitManager().push();
      return json({ message: 'Changes pushed successfully' }, 200);
    }

    if (pathname === '/api/repository/info' && method === 'GET') {
      const client = getBitbucketClient();
      const repo = await client.repositories.get({
        project: process.env.BITBUCKET_PROJECT,
        repo: process.env.BITBUCKET_REPOSITORY,
      });
      return json({ repository: repo }, 200);
    }

    if (pathname === '/api/repository/commits' && method === 'GET') {
      const client = getBitbucketClient();
      const commits = await client.repositories.commits.getAll({
        project: process.env.BITBUCKET_PROJECT,
        repo: process.env.BITBUCKET_REPOSITORY,
        limit: 10,
      });
      return json({ commits }, 200);
    }

    return null;
  } catch (error) {
    logger.error('Repository route error', error);
    return json({ error: error.message }, 500);
  }
}
