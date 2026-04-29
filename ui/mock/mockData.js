import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

function readJson(relPath) {
  return JSON.parse(readFileSync(join(FIXTURES, relPath), 'utf-8'));
}

function readGistFile(file) {
  const p = join(FIXTURES, 'gists', file);
  return existsSync(p) ? readFileSync(p, 'utf-8') : null;
}

function ago(ms) {
  return new Date(Date.now() - ms).toISOString();
}

function buildRepos() {
  const { repos } = readJson('repos.json');
  return {
    repos: repos.map(({ lastPulledAtOffset, ...r }) => ({
      ...r,
      lastPulledAt: lastPulledAtOffset ? ago(lastPulledAtOffset) : null,
    })),
  };
}

function buildTasks() {
  const { active, history } = readJson('tasks.json');
  return {
    active: active.map(({ startedAtOffset, ...t }) => ({
      ...t,
      startedAt: ago(startedAtOffset),
    })),
    history: history.map(({ startedAtOffset, finishedAtOffset, ...t }) => ({
      ...t,
      startedAt: ago(startedAtOffset),
      finishedAt: ago(finishedAtOffset),
    })),
  };
}

function buildQueue() {
  const { waiting } = readJson('queue.json');
  return {
    waiting: waiting.map(({ queuedAtOffset, ...item }) => ({
      ...item,
      queuedAt: ago(queuedAtOffset),
    })),
  };
}

function buildGist(project, repo, file, branch) {
  const content = readGistFile(file) ?? readGistFile('config.json');
  return {
    content,
    meta: {
      project,
      repo,
      file,
      branch,
      updatedAt: ago(3_600_000),
      size: content.length,
    },
  };
}

export default [
  {
    url: '/health',
    method: 'GET',
    response: () => readJson('health.json'),
  },
  {
    url: '/api/repos',
    method: 'GET',
    response: () => buildRepos(),
  },
  {
    url: '/api/tasks',
    method: 'GET',
    response: () => buildTasks(),
  },
  {
    url: '/api/queue',
    method: 'GET',
    response: () => buildQueue(),
  },
  {
    match: req => req.method === 'GET' && req.url.startsWith('/api/gist/'),
    response: req => {
      const url = new URL(req.url, 'http://localhost');
      const [, , , project, repo, file] = url.pathname.split('/');
      const branch = url.searchParams.get('branch') || 'main';
      return buildGist(project, repo, file, branch);
    },
  },
];
