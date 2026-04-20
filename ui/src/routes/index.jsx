import { createFileRoute } from '@tanstack/react-router';
import { Box, Text, Badge, Spinner, StatusPage, Button, Icon } from '@gnome-ui/react';
import { PanelCard } from '@gnome-ui/layout';
import { Check, Error, Warning, Refresh } from '@gnome-ui/icons';
import { useApi } from '../hooks/useApi';

export const Route = createFileRoute('/')({
  component: Dashboard,
});

function AppStatusBadge({ status }) {
  if (status === 'loading') return <Spinner size="small" />;
  if (status === 'ok') return <Badge variant="success">Running</Badge>;
  if (status === 'degraded') return <Badge variant="warning">Degraded</Badge>;
  return <Badge variant="error">Down</Badge>;
}

function Dashboard() {
  const { data: health, loading, error, refresh } = useApi('/health', { interval: 10000 });
  const { data: tasks } = useApi('/api/tasks', { interval: 5000 });
  const { data: repos } = useApi('/api/repos', { interval: 15000 });

  const appStatus = loading ? 'loading' : error ? 'down' : health?.status === 'ok' ? 'ok' : 'degraded';
  const activeCount = tasks?.active?.length ?? 0;
  const failedCount = tasks?.history?.filter(t => t.status === 'error').length ?? 0;
  const repoCount = repos?.repos?.length ?? 0;

  return (
    <Box orientation="vertical" spacing={4} style={{ padding: '24px', maxWidth: 720, margin: '0 auto' }}>
      <Box orientation="horizontal" spacing={3} style={{ alignItems: 'center' }}>
        <Text variant="heading">Dashboard</Text>
        <Button variant="flat" onClick={refresh}>
          <Icon icon={Refresh} />
        </Button>
      </Box>

      <PanelCard
        icon={<Icon icon={appStatus === 'ok' ? Check : appStatus === 'degraded' ? Warning : Error} />}
        title="App Status"
        collapsible={false}
        footer={<Text variant="caption" color="dim">Refreshes every 10s</Text>}
      >
        <Box orientation="horizontal" spacing={3} style={{ padding: '8px 0', alignItems: 'center' }}>
          <AppStatusBadge status={appStatus} />
          {health?.uptime && (
            <Text variant="body" color="dim">Uptime: {Math.floor(health.uptime / 60)}m</Text>
          )}
        </Box>
      </PanelCard>

      <PanelCard icon={<Icon icon={Check} />} title="Stats" collapsible={false}>
        <Box orientation="horizontal" spacing={4} style={{ padding: '8px 0' }}>
          <Box orientation="vertical" spacing={1}>
            <Text variant="caption" color="dim">Repos cloned</Text>
            <Text variant="title-2">{repoCount}</Text>
          </Box>
          <Box orientation="vertical" spacing={1}>
            <Text variant="caption" color="dim">Active tasks</Text>
            <Text variant="title-2">{activeCount}</Text>
          </Box>
          <Box orientation="vertical" spacing={1}>
            <Text variant="caption" color="dim">Failed tasks</Text>
            <Text variant="title-2" style={{ color: failedCount > 0 ? 'var(--error-color)' : undefined }}>
              {failedCount}
            </Text>
          </Box>
        </Box>
      </PanelCard>

      {error && (
        <StatusPage
          icon={Error}
          title="API Unreachable"
          description="Cannot connect to the Bitbucket Gist API server."
          compact
        />
      )}
    </Box>
  );
}
