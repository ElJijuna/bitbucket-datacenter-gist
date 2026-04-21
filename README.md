# Bitbucket DataCenter Gist Manager

[![Docker Hub](https://img.shields.io/docker/v/pilmee/bitbucket-datacenter-gist?label=docker%20hub&logo=docker&logoColor=white)](https://hub.docker.com/r/pilmee/bitbucket-datacenter-gist)
[![Docker Pulls](https://img.shields.io/docker/pulls/pilmee/bitbucket-datacenter-gist?logo=docker&logoColor=white)](https://hub.docker.com/r/pilmee/bitbucket-datacenter-gist)
[![GitHub release](https://img.shields.io/github/v/release/ElJijuna/bitbucket-datacenter-gist?logo=github)](https://github.com/ElJijuna/bitbucket-datacenter-gist/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/runtime-bun-black?logo=bun)](https://bun.sh)

HTTP API to create, read, update and delete files inside Bitbucket Data Center repositories. Every write request clones (or pulls) the target repo, writes the file, commits, and pushes — all automatically.

## Features

- CRUD endpoints (`GET` / `POST` / `PUT` / `DELETE`) per file and branch
- `branch` is part of every request — target any existing or new branch
- Orphan branch auto-creation when the branch does not yet exist in the remote
- Blobless clone (`--filter=blob:none`) — only downloads file content on demand
- Clone-once, pull-on-request — repos are cached locally under `cloned-repos/`
- Per-repo lock — concurrent requests for the same repo are serialized safely
- `PROJECT:repo` whitelist — returns `403` for anything not explicitly allowed
- Optional API key protection (`X-API-Key` / `Authorization: Bearer`)
- SSH and HTTPS clone support
- Web dashboard (React 19 + GNOME UI) on the same port as the API
- Docker multi-stage build, multi-arch (`linux/amd64`, `linux/arm64`)
- Bun native server — no Express

## Quick start

```bash
# Pull from Docker Hub
docker pull pilmee/bitbucket-datacenter-gist

# Run with SSH clone (default)
docker run -d -p 3000:3000 \
  -v ~/.ssh:/root/.ssh:ro \
  -e BITBUCKET_SERVER_HOST=https://bitbucket.example.com \
  -e BITBUCKET_USER=your-user \
  -e ALLOWED_REPOS=MYPROJECT:snippets,TOOLS:utils \
  pilmee/bitbucket-datacenter-gist
```

Open **[http://localhost:3000](http://localhost:3000)** — the web dashboard and the API run on the same port.

## Requirements

- Docker (recommended) or Bun >= 1.0.0
- SSH key with read/write access to the Bitbucket repos (SSH mode)
- Bitbucket API token (HTTPS mode)

## Configuration

```bash
cp .env.example .env
# edit .env with your values
```

### Environment variables

| Variable | Required | Default | Description |
| -------- | :------: | ------- | ----------- |
| `BITBUCKET_SERVER_HOST` | Yes | — | Bitbucket base URL (e.g. `https://bitbucket.example.com`) |
| `BITBUCKET_USER` | Yes | — | Bitbucket username (used for git commit author) |
| `ALLOWED_REPOS` | Yes | — | Whitelisted repos — see format below |
| `GIT_CLONE_PROTOCOL` | No | `ssh` | `ssh` or `https` |
| `BITBUCKET_SSH_PORT` | No | `7999` | SSH port — only used when `GIT_CLONE_PROTOCOL=ssh` |
| `BITBUCKET_TOKEN` | No | — | API token — required when `GIT_CLONE_PROTOCOL=https` |
| `BITBUCKET_API_HOST` | No | — | REST API base URL — required for `/api/repository/*` routes |
| `GIT_USER_NAME` | No | `BITBUCKET_USER` | Commit author name |
| `GIT_USER_EMAIL` | No | `BITBUCKET_USER@bitbucket-gist` | Commit author email |
| `API_SECRET_KEY` | No | — | When set, all `/api/gist/*` requests must include this key |
| `GIT_PULL_INTERVAL` | No | `30` | Seconds between pulls per repo |
| `GIT_PUSH_DEBOUNCE` | No | `500` | Milliseconds to wait before pushing (coalesces rapid writes) |
| `PORT` | No | `3000` | Server port |
| `LOG_LEVEL` | No | `info` | `error` / `warn` / `info` / `debug` |

### Repository whitelist

`ALLOWED_REPOS` defines which `PROJECT:repo` pairs this instance can manage.

```env
ALLOWED_REPOS=MYPROJECT:repo1,MYPROJECT:repo2,TOOLS:repotools
```

If `ALLOWED_REPOS` is empty or not set, **all requests return 403**.

## Installation

### Docker Hub (recommended)

```bash
docker run -d -p 3000:3000 \
  -v ~/.ssh:/root/.ssh:ro \
  -e BITBUCKET_SERVER_HOST=https://bitbucket.example.com \
  -e BITBUCKET_USER=your-user \
  -e ALLOWED_REPOS=MYPROJECT:snippets \
  -e API_SECRET_KEY=change-me \
  pilmee/bitbucket-datacenter-gist
```

Available tags: `latest`, `edge` (main branch), `0.2.0`, `0.2`, `0` and short SHA tags.

### Docker Compose

```bash
cp .env.example .env   # fill in your values
docker-compose up -d
```

### Build from source

```bash
git clone https://github.com/ElJijuna/bitbucket-datacenter-gist.git
cd bitbucket-datacenter-gist
docker build -t bitbucket-gist .
docker run -d -p 3000:3000 \
  -v ~/.ssh:/root/.ssh:ro \
  --env-file .env \
  bitbucket-gist
```

### Bun (local development)

```bash
bun install

# Terminal 1 — API server (hot reload)
bun run dev

# Terminal 2 — UI dev server with HMR (proxies /api to :3000)
bun run ui:dev
```

Open **[http://localhost:5173](http://localhost:5173)** for the UI in dev mode, or run `bun run ui:build && bun run dev` to serve everything on `:3000`.

## API

### Authentication

When `API_SECRET_KEY` is set, all `/api/gist/*` requests must include the key:

```http
X-API-Key: your-secret
```

or

```http
Authorization: Bearer your-secret
```

Status routes (`/api/repos`, `/api/tasks`) and the health check do not require authentication.

### Health check

```http
GET /health
```

### Gist CRUD

Base: `/api/gist/:project/:repo/:file`

| Method | Endpoint | Body / Query | Description |
| ------ | -------- | ------------ | ----------- |
| `GET` | `/api/gist/:project/:repo/:file` | `?branch=<b>` | Read file content |
| `POST` | `/api/gist/:project/:repo/:file` | `{ branch, content }` | Create file — fails `409` if it exists |
| `PUT` | `/api/gist/:project/:repo/:file` | `{ branch, content }` | Update file — fails `404` if not found |
| `DELETE` | `/api/gist/:project/:repo/:file` | `?branch=<b>` | Delete file |

`content` can be a **string** or any **JSON value** (objects/arrays are serialized automatically).

> **Branch auto-creation:** if `branch` does not exist in the remote, it is created as an orphan branch (no prior history) containing only the file being written.

#### Responses

| Method | Success | Body |
| ------ | ------- | ---- |
| `GET` | `200` | `{ file, branch, content }` |
| `POST` | `201` | `{ file, branch, createdAt }` |
| `PUT` | `200` | `{ file, branch, updatedAt }` |
| `DELETE` | `200` | `{ file, branch, deletedAt }` |

#### Error codes

| Status | Reason |
| ------ | ------ |
| `400` | Missing `branch`, `content`, or invalid file name |
| `401` | Missing or invalid `API_SECRET_KEY` |
| `403` | `PROJECT/repo` not in whitelist |
| `404` | File not found (GET / PUT / DELETE) |
| `409` | File already exists (POST) |
| `500` | Git clone / push failure |

### Repository utilities *(optional)*

Require `BITBUCKET_TOKEN` and `BITBUCKET_API_HOST`.

```http
GET  /api/repository/status
POST /api/repository/pull
POST /api/repository/push
GET  /api/repository/info
GET  /api/repository/commits
```

## Examples

Replace `your-secret`, `PROJ`, `my-repo`, and the host with your actual values.

### Create a file

```bash
curl -X POST http://localhost:3000/api/gist/PROJ/my-repo/report.json \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret" \
  -d '{"branch": "main", "content": "{\"status\": \"ok\", \"ts\": \"2026-04-21\"}"}'
```

```json
{ "file": "report.json", "branch": "main", "createdAt": "2026-04-21T10:00:00.000Z" }
```

### Read a file

```bash
curl "http://localhost:3000/api/gist/PROJ/my-repo/report.json?branch=main" \
  -H "X-API-Key: your-secret"
```

```json
{ "file": "report.json", "branch": "main", "content": "{\"status\": \"ok\", \"ts\": \"2026-04-21\"}" }
```

### Update a file

```bash
curl -X PUT http://localhost:3000/api/gist/PROJ/my-repo/report.json \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret" \
  -d '{"branch": "main", "content": "{\"status\": \"degraded\", \"ts\": \"2026-04-21\"}"}'
```

```json
{ "file": "report.json", "branch": "main", "updatedAt": "2026-04-21T10:05:00.000Z" }
```

### Write a JSON object directly (no manual serialization)

```bash
curl -X PUT http://localhost:3000/api/gist/PROJ/my-repo/config.json \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret" \
  -d '{"branch": "main", "content": {"env": "prod", "replicas": 3}}'
```

### Create on a new (non-existent) branch

The branch is created automatically as an orphan with only this file.

```bash
curl -X POST http://localhost:3000/api/gist/PROJ/my-repo/init.json \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret" \
  -d '{"branch": "reports/2026-04", "content": "{}"}'
```

### Delete a file

```bash
curl -X DELETE "http://localhost:3000/api/gist/PROJ/my-repo/report.json?branch=main" \
  -H "X-API-Key: your-secret"
```

```json
{ "file": "report.json", "branch": "main", "deletedAt": "2026-04-21T10:10:00.000Z" }
```

### Check health

```bash
curl http://localhost:3000/health
```

## Local clone layout

Repos are cached under `cloned-repos/` namespaced by project key:

```text
cloned-repos/
├── PROJ/
│   └── my-repo/
└── TOOLS/
    └── utils/
```

## Project structure

```text
src/
├── api/
│   ├── server.js              # Bun native server + env validation
│   ├── middleware/
│   │   ├── auth.js            # X-API-Key / Bearer token guard
│   │   ├── logger.js          # Pino structured logging
│   │   └── error-handler.js
│   └── routes/
│       ├── index.js           # Main router
│       ├── health.js
│       ├── gists.js           # CRUD /api/gist/:project/:repo/:file
│       ├── repository.js      # /api/repository/* utility routes
│       └── status.js          # /api/repos, /api/tasks
├── services/
│   ├── git-manager.js         # Blobless clone, per-repo lock, branch, commit, push
│   ├── gist-manager.js        # CRUD logic on top of git-manager
│   └── task-tracker.js        # In-flight task registry
└── config/
    ├── whitelist.js           # PROJECT:repo access control
    └── bitbucket-client.js    # Bitbucket REST API client
```

## Troubleshooting

**`401 Unauthorized`**

- Check that `X-API-Key` or `Authorization: Bearer` matches the value of `API_SECRET_KEY`

**`403 Forbidden`**

- Verify `ALLOWED_REPOS` includes `PROJECT:repo` (case-insensitive, colon-separated)

**`Failed to clone repository`**

- SSH mode: confirm the key at `~/.ssh` has read access to the repo in Bitbucket
- SSH mode: verify `BITBUCKET_SSH_PORT` matches your instance (default `7999`)
- HTTPS mode: confirm `BITBUCKET_TOKEN` is set and has repo read/write scope
- Confirm `BITBUCKET_SERVER_HOST` has no trailing slash

**`Failed to push changes`**

- SSH mode: verify the SSH key has **write** access to the repository
- HTTPS mode: verify `BITBUCKET_TOKEN` has write scope

## License

MIT
