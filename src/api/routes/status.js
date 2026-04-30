import GitManager from '../../services/git-manager.js';
import { getActiveTasks, getHistory } from '../../services/task-tracker.js';
import { getWaiting } from '../../services/queue-manager.js';

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default function statusRoutes(request) {
  const { pathname } = new URL(request.url);
  if (request.method !== 'GET') return null;

  if (pathname === '/api/repos') {
    const repos = GitManager.getAll().map(gm => ({
      project: gm.project,
      repo: gm.repo,
      path: gm.repoPath,
      ready: gm.ready,
      lastPulledAt: gm.lastPulledAt ? new Date(gm.lastPulledAt).toISOString() : null,
    }));
    return json({ repos }, 200);
  }

  if (pathname === '/api/tasks') {
    return json({ active: getActiveTasks(), history: getHistory() }, 200);
  }

  if (pathname === '/api/queue') {
    return json({ waiting: getWaiting() }, 200);
  }

  return null;
}
