# Bitbucket DataCenter Gist Manager

Write files into Bitbucket Data Center repositories via HTTP. Every request clones (or pulls) the target repo, writes the file, commits, and pushes — all automatically.

## Features

- Single endpoint to upsert any file in any whitelisted repository
- Clone-once strategy: repos are cached locally and pulled on each request
- Per-repo lock to handle concurrent requests safely
- `PROJECT:repo` whitelist for access control (403 if not listed)
- SSH-based clone (no credentials embedded in URLs)
- Docker ready with `oven/bun:1-alpine`
- Bun native server — no Express

## Requirements

- Docker (recommended) or Bun >= 1.0.0
- SSH key configured with access to Bitbucket Server / Data Center
- Git (included in the Docker image)

## Configuration

```bash
cp .env.example .env
```

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BITBUCKET_SERVER_HOST` | Yes | Bitbucket base URL (e.g. `https://bitbucket.example.com`) |
| `BITBUCKET_USER` | Yes | Bitbucket username (used for git commit author) |
| `ALLOWED_REPOS` | Yes | Whitelisted repos — see format below |
| `BITBUCKET_SSH_PORT` | No | SSH port (default: `7999`) |
| `BITBUCKET_API_HOST` | No | REST API URL — required only for `/api/repository/*` routes |
| `BITBUCKET_TOKEN` | No | API token — required only for `/api/repository/*` routes |
| `BITBUCKET_PROJECT` | No | Default project — required only for `/api/repository/*` routes |
| `BITBUCKET_REPOSITORY` | No | Default repo — required only for `/api/repository/*` routes |
| `GIT_USER_NAME` | No | Commit author name (default: `BITBUCKET_USER`) |
| `GIT_USER_EMAIL` | No | Commit author email (default: `BITBUCKET_USER@bitbucket-gist`) |
| `PORT` | No | Server port (default: `3000`) |
| `LOG_LEVEL` | No | `error` / `warn` / `info` / `debug` (default: `info`) |

### Repository whitelist

`ALLOWED_REPOS` defines which `PROJECT:repo` pairs this instance can manage.

```env
ALLOWED_REPOS=MYPROJECT:repo1,MYPROJECT:repo2,TOOLS:repotools
```

If `ALLOWED_REPOS` is empty or not set, **all requests return 403**.

## Usage

### Docker Compose (recommended)

```bash
docker-compose up -d
```

### Docker

```bash
docker build -t bitbucket-gist .

docker run -p 3000:3000 \
  -v ~/.ssh:/root/.ssh:ro \
  -e BITBUCKET_SERVER_HOST=https://bitbucket.example.com \
  -e BITBUCKET_USER=your-user \
  -e ALLOWED_REPOS=MYPROJECT:snippets,TOOLS:utils \
  bitbucket-gist
```

### Bun (local)

```bash
bun install
bun run dev
```

## API

### Health check

```
GET /health
```

### Write a file

```
POST /api/projects/:project/repos/:repo/gists/:file
```

**Body:**
```json
{ "content": "file content here" }
```

**Response `200`:**
```json
{ "file": "app-report.json", "updatedAt": "2026-04-20T10:00:00.000Z" }
```

**Error responses:**

| Status | Reason |
| ------ | ------ |
| `400` | Missing `content` or invalid file name |
| `403` | `PROJECT/repo` not in whitelist |
| `405` | Method not `POST` |
| `500` | Git clone / push failure |

### Repository utilities *(optional)*

These routes require `BITBUCKET_PROJECT`, `BITBUCKET_REPOSITORY`, `BITBUCKET_TOKEN` and `BITBUCKET_API_HOST` to be set.

```text
GET  /api/repository/status
POST /api/repository/pull
POST /api/repository/push
GET  /api/repository/info
GET  /api/repository/commits
```

## Examples

```bash
# Write a JSON report into PROJ/reportes
curl -X POST http://localhost:3000/api/projects/PROJ/repos/reportes/gists/app-report.json \
  -H "Content-Type: application/json" \
  -d '{"content": "{\"status\": \"ok\", \"ts\": \"2026-04-20\"}"}'

# Write a shell script into TOOLS/utils
curl -X POST http://localhost:3000/api/projects/TOOLS/repos/utils/gists/deploy.sh \
  -H "Content-Type: application/json" \
  -d '{"content": "#!/bin/bash\necho deployed"}'

# Health check
curl http://localhost:3000/health
```

## Local clone layout

Repos are cached under `cloned-repos/` namespaced by project key:

```
cloned-repos/
├── PROJ/
│   └── reportes/
└── TOOLS/
    └── utils/
```

## Project structure

```
src/
├── api/
│   ├── server.js              # Bun native server + env validation
│   ├── middleware/
│   │   ├── logger.js
│   │   └── error-handler.js
│   └── routes/
│       ├── index.js           # Main router
│       ├── health.js
│       ├── gists.js           # POST /api/projects/:project/repos/:repo/gists/:file
│       └── repository.js      # /api/repository/* utility routes
├── services/
│   ├── git-manager.js         # Clone-once, per-repo lock, SSH, commit, push
│   └── gist-manager.js        # upsertFile wrapper
└── config/
    ├── whitelist.js           # PROJECT:repo access control
    └── bitbucket-client.js    # Bitbucket REST API client
```

## Troubleshooting

**`403 Forbidden`**

- Verify `ALLOWED_REPOS` includes the `PROJECT:repo` you are calling (case-insensitive)

**`Failed to clone repository`**

- Check the SSH key mounted in the container has read access to the repo in Bitbucket
- Verify `BITBUCKET_SSH_PORT` matches your Bitbucket instance (default `7999`)
- Confirm `BITBUCKET_SERVER_HOST` has no trailing slash

**`Failed to push changes`**

- Verify the SSH key has write access to the repository

## License

MIT
