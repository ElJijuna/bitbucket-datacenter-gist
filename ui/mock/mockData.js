// Mock data for development
const mockData = {
  health: {
    status: 'ok',
    uptime: 3600,
    version: '0.2.0',
  },
  repos: {
    repos: [
      {
        project: 'MYPROJECT',
        repo: 'backend-api',
        path: '/data/gists/MYPROJECT/backend-api',
        ready: true,
        lastPulledAt: new Date(Date.now() - 300000).toISOString(),
      },
      {
        project: 'MYPROJECT',
        repo: 'frontend-web',
        path: '/data/gists/MYPROJECT/frontend-web',
        ready: true,
        lastPulledAt: new Date(Date.now() - 600000).toISOString(),
      },
      {
        project: 'TEAM',
        repo: 'shared-lib',
        path: '/data/gists/TEAM/shared-lib',
        ready: false,
        lastPulledAt: null,
      },
    ],
  },
  tasks: {
    active: [
      {
        id: 'task-1',
        project: 'MYPROJECT',
        repo: 'backend-api',
        file: 'src/utils/helper.ts',
        status: 'running',
        startedAt: new Date(Date.now() - 20000).toISOString(),
      },
    ],
    history: [
      {
        id: 'task-2',
        project: 'MYPROJECT',
        repo: 'frontend-web',
        file: 'components/Button.jsx',
        status: 'success',
        startedAt: new Date(Date.now() - 120000).toISOString(),
        finishedAt: new Date(Date.now() - 80000).toISOString(),
      },
      {
        id: 'task-3',
        project: 'MYPROJECT',
        repo: 'backend-api',
        file: 'services/auth.js',
        status: 'error',
        error: 'Repository not found',
        startedAt: new Date(Date.now() - 300000).toISOString(),
        finishedAt: new Date(Date.now() - 280000).toISOString(),
      },
      {
        id: 'task-4',
        project: 'TEAM',
        repo: 'shared-lib',
        file: 'index.ts',
        status: 'success',
        startedAt: new Date(Date.now() - 600000).toISOString(),
        finishedAt: new Date(Date.now() - 550000).toISOString(),
      },
    ],
  },
};

export default [
  {
    url: '/health',
    method: 'GET',
    response: () => mockData.health,
  },
  {
    url: '/api/repos',
    method: 'GET',
    response: () => mockData.repos,
  },
  {
    url: '/api/tasks',
    method: 'GET',
    response: () => mockData.tasks,
  },
];