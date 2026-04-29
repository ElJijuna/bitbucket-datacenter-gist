import { describe, it, expect, mock, beforeAll } from 'bun:test';

// ── module mocks (must be set up before dynamic import) ──────────────────────
const mockReadFile = mock(() => Promise.resolve('{"hello":"world"}'));
const mockWriteFile = mock(() => Promise.resolve());
const mockDeleteFile = mock(() => Promise.resolve());
const mockGitInstance = {
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  deleteFile: mockDeleteFile,
};

mock.module('../../config/whitelist.js', () => ({ isAllowed: () => true }));
mock.module('../../api/middleware/auth.js', () => ({ authMiddleware: () => null }));
mock.module('../../services/git-manager.js', () => ({
  default: { getInstance: () => mockGitInstance, getAll: () => [] },
}));
mock.module('../../services/queue-manager.js', () => ({
  enqueue: (_p, _r, _f, _m, fn) => fn(),
  getWaiting: () => [],
  _reset: () => {},
}));
mock.module('../../services/task-tracker.js', () => ({
  startTask: () => 'tid',
  endTask: () => {},
  getActiveTasks: () => [],
  getHistory: () => [],
  _reset: () => {},
}));

// ── helpers ──────────────────────────────────────────────────────────────────
function makeRequest(method, path, body) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function parseJson(res) {
  return res.json();
}

// ── tests ────────────────────────────────────────────────────────────────────
let gistRoutes;

beforeAll(async () => {
  ({ default: gistRoutes } = await import('../../api/routes/gists.js'));
});

describe('GET /api/gist/:project/:repo/:file', () => {
  it('returns 400 when branch query param is missing', async () => {
    const res = await gistRoutes(makeRequest('GET', '/api/gist/P/R/f.json'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when file does not exist', async () => {
    mockReadFile.mockImplementation(() => Promise.resolve(null));
    const res = await gistRoutes(makeRequest('GET', '/api/gist/P/R/f.json?branch=main'));
    expect(res.status).toBe(404);
    mockReadFile.mockImplementation(() => Promise.resolve('content'));
  });

  it('returns 200 with file content', async () => {
    mockReadFile.mockImplementation(() => Promise.resolve('{"x":1}'));
    const res = await gistRoutes(makeRequest('GET', '/api/gist/P/R/f.json?branch=main'));
    expect(res.status).toBe(200);
    const body = await parseJson(res);
    expect(body.content).toBe('{"x":1}');
  });
});

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
    mockReadFile.mockImplementation(() => Promise.resolve('existing'));
    const res = await gistRoutes(
      makeRequest('POST', '/api/gist/P/R/f.json', { branch: 'main', content: 'new' })
    );
    expect(res.status).toBe(409);
    mockReadFile.mockImplementation(() => Promise.resolve(null));
  });

  it('returns 201 on successful create', async () => {
    mockReadFile.mockImplementation(() => Promise.resolve(null));
    const res = await gistRoutes(
      makeRequest('POST', '/api/gist/P/R/f.json', { branch: 'main', content: '{"a":1}' })
    );
    expect(res.status).toBe(201);
  });
});

describe('PUT /api/gist/:project/:repo/:file', () => {
  it('returns 404 when file does not exist', async () => {
    mockReadFile.mockImplementation(() => Promise.resolve(null));
    const res = await gistRoutes(
      makeRequest('PUT', '/api/gist/P/R/f.json', { branch: 'main', content: 'updated' })
    );
    expect(res.status).toBe(404);
  });

  it('returns 200 on successful update', async () => {
    mockReadFile.mockImplementation(() => Promise.resolve('old'));
    const res = await gistRoutes(
      makeRequest('PUT', '/api/gist/P/R/f.json', { branch: 'main', content: 'new' })
    );
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/gist/:project/:repo/:file', () => {
  it('returns 400 when branch is missing', async () => {
    const res = await gistRoutes(makeRequest('DELETE', '/api/gist/P/R/f.json'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when file does not exist', async () => {
    mockReadFile.mockImplementation(() => Promise.resolve(null));
    const res = await gistRoutes(makeRequest('DELETE', '/api/gist/P/R/f.json?branch=main'));
    expect(res.status).toBe(404);
  });

  it('returns 200 on successful delete', async () => {
    mockReadFile.mockImplementation(() => Promise.resolve('content'));
    const res = await gistRoutes(makeRequest('DELETE', '/api/gist/P/R/f.json?branch=main'));
    expect(res.status).toBe(200);
  });
});

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
