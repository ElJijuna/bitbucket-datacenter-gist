import GitManager from '../../services/git-manager.js';
import { getActiveTasks, getHistory } from '../../services/task-tracker.js';
import { getWaiting } from '../../services/queue-manager.js';
import { logEmitter } from '../../services/log-emitter.js';

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

  if (pathname === '/api/logs/stream') {
    const encoder = new TextEncoder();
    let listener;
    const body = new ReadableStream({
      start(controller) {
        listener = (entry) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(entry)}\n\n`));
        };
        logEmitter.on('log', listener);
      },
      cancel() {
        if (listener) logEmitter.off('log', listener);
      },
    });
    return new Response(body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  return null;
}
