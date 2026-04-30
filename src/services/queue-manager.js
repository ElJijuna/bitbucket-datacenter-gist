import crypto from 'crypto';

// Per-repo serial promise chains
const chains = new Map();
// Items waiting to start (key → [{id, project, repo, file, method, queuedAt}])
const waiting = new Map();

export function enqueue(project, repo, file, method, fn) {
  const key = `${project}/${repo}`;
  const id = crypto.randomUUID();
  const item = { id, project, repo, file, method, queuedAt: new Date().toISOString() };

  if (!waiting.has(key)) waiting.set(key, []);
  waiting.get(key).push(item);

  const prev = chains.get(key) ?? Promise.resolve();

  const next = prev.then(() => {
    const arr = waiting.get(key) ?? [];
    const idx = arr.findIndex(i => i.id === id);
    if (idx !== -1) arr.splice(idx, 1);
    if (arr.length === 0) waiting.delete(key);
    return fn();
  });

  // Keep chain alive even on error so subsequent items still run
  chains.set(key, next.catch(() => {}));
  return next;
}

export function getWaiting() {
  const result = [];
  for (const items of waiting.values()) result.push(...items);
  return result.sort((a, b) => new Date(a.queuedAt) - new Date(b.queuedAt));
}
