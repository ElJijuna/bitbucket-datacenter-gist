import crypto from 'crypto';

const MAX_HISTORY = 100;
const active = new Map();
const history = [];

export function startTask(project, repo, file) {
  const id = crypto.randomUUID();
  const task = { id, project, repo, file, status: 'running', startedAt: new Date().toISOString() };
  active.set(id, task);
  return id;
}

export function endTask(id, error = null) {
  const task = active.get(id);
  if (!task) return;
  task.status = error ? 'error' : 'success';
  task.endedAt = new Date().toISOString();
  if (error) task.error = error;
  active.delete(id);
  history.unshift({ ...task });
  if (history.length > MAX_HISTORY) history.pop();
}

export function getActiveTasks() {
  return [...active.values()];
}

export function getHistory() {
  return [...history];
}
