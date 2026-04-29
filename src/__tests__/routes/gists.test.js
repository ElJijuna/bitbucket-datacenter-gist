import { describe, it, expect, mock, beforeAll, beforeEach } from 'bun:test';
import { _reset as resetQueue } from '../../services/queue-manager.js';
import { _reset as resetTracker } from '../../services/task-tracker.js';

// Only mock external I/O boundaries — queue-manager and task-tracker
// are pure JS with no side effects, so we use them real + _reset().
mock.module('../../config/whitelist.js', () => ({ isAllowed: () => true }));
mock.module('../../api/middleware/auth.js', () => ({ authMiddleware: () => null }));

const mockGit = {
  readFile: mock(() => Promise.resolve(null)),
  writeFile: mock(() => Promise.resolve()),
  deleteFile: mock(() => Promise.resolve()),
};

mock.module('../../services/git-manager.js', () => ({
  default: { getInstance: () => mockGit, getAll: () => [] },
}));

// ── helpers ──────────────────────────────────────────────────────────────────
function makeRequest(method, path, body) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

let gistRoutes;

beforeAll(async () => {
  ({ default: gistRoutes } = await import('../../api/routes/gists.js'));
});

beforeEach(() => {
  resetQueue();
  resetTracker();
  mockGit.readFile.mockReset();
  mockGit.writeFile.mockReset();
  mockGit.deleteFile.mockReset();
  mockGit.readFile.mockImplementation(() => Promise.resolve(null));
  mockGit.writeFile.mockImplementation(() => Promise.resolve());
  mockGit.deleteFile.mockImplementation(() => Promise.resolve());
});

// ── GET ───────────────────────────────────────────────────────────────────────
describe('GET /api/gist/:project/:repo/:file', () => {
  it('returns 400 when branch query param is missing', async () => {
    const res = await gistRoutes(makeRequest('GET', '/api/gist/P/R/f.json'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when file does not exist', async () => {
    mockGit.readFile.mockImplementation(() => Promise.resolve(null));
    const res = await gistRoutes(makeRequest('GET', '/api/gist/P/R/f.json?branch=main'));
    expect(res.status).toBe(404);
  });

  it('returns 200 with file content', async () => {
    mockGit.readFile.mockImplementation(() => Promise.resolve('{"x":1}'));
    const res = await gistRoutes(makeRequest('GET', '/api/gist/P/R/f.json?branch=main'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.content).toBe('{"x":1}');
  });
});

// ── POST ──────────────────────────────────────────────────────────────────────
describe('POST /api/gist/:project/:repo/:file', () => {
  it('returns 400 when branch is missing', async () => {
    const res = await gistRoutes(makeRequest('POST', '/api/gist/P/R/f.json', { content: 'x' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when content is missing', async () => {
    const res = await gistRoutes(makeRequest('POST', '/api/gist/P/R/f.json', { branch: 'main' }));
    expect(res.status).toBe(400);
  });

  it('returns 409 when file already exists', async () => {
    mockGit.readFile.mockImplementation(() => Promise.resolve('existing'));
    const res = await gistRoutes(
      makeRequest('POST', '/api/gist/P/R/f.json', { branch: 'main', content: 'new' })
    );
    expect(res.status).toBe(409);
  });

  it('returns 201 on successful create', async () => {
    mockGit.readFile.mockImplementation(() => Promise.resolve(null));
    const res = await gistRoutes(
      makeRequest('POST', '/api/gist/P/R/f.json', { branch: 'main', content: '{"a":1}' })
    );
    expect(res.status).toBe(201);
  });
});

// ── PUT ───────────────────────────────────────────────────────────────────────
describe('PUT /api/gist/:project/:repo/:file', () => {
  it('returns 404 when file does not exist', async () => {
    mockGit.readFile.mockImplementation(() => Promise.resolve(null));
    const res = await gistRoutes(
      makeRequest('PUT', '/api/gist/P/R/f.json', { branch: 'main', content: 'updated' })
    );
    expect(res.status).toBe(404);
  });

  it('returns 200 on successful update', async () => {
    mockGit.readFile.mockImplementation(() => Promise.resolve('old'));
    const res = await gistRoutes(
      makeRequest('PUT', '/api/gist/P/R/f.json', { branch: 'main', content: 'new' })
    );
    expect(res.status).toBe(200);
  });
});

// ── DELETE ────────────────────────────────────────────────────────────────────
describe('DELETE /api/gist/:project/:repo/:file', () => {
  it('returns 400 when branch is missing', async () => {
    const res = await gistRoutes(makeRequest('DELETE', '/api/gist/P/R/f.json'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when file does not exist', async () => {
    mockGit.readFile.mockImplementation(() => Promise.resolve(null));
    const res = await gistRoutes(makeRequest('DELETE', '/api/gist/P/R/f.json?branch=main'));
    expect(res.status).toBe(404);
  });

  it('returns 200 on successful delete', async () => {
    mockGit.readFile.mockImplementation(() => Promise.resolve('content'));
    const res = await gistRoutes(makeRequest('DELETE', '/api/gist/P/R/f.json?branch=main'));
    expect(res.status).toBe(200);
  });
});

// ── invalid requests ──────────────────────────────────────────────────────────
describe('invalid requests', () => {
  it('returns 400 for unsafe file names', async () => {
    // %3B = ';' — not in [a-zA-Z0-9._-], fails SAFE_FILE_RE
    const res = await gistRoutes(makeRequest('GET', '/api/gist/P/R/inv%3Blid.json?branch=main'));
    expect(res.status).toBe(400);
  });

  it('returns 405 for unsupported methods', async () => {
    const res = await gistRoutes(makeRequest('PATCH', '/api/gist/P/R/f.json'));
    expect(res.status).toBe(405);
  });

  it('returns null for non-matching paths', async () => {
    const res = await gistRoutes(makeRequest('GET', '/api/other'));
    expect(res).toBeNull();
  });
});
