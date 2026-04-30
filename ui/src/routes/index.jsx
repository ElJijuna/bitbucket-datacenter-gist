import { createFileRoute } from '@tanstack/react-router';
import { Box, Text, Badge, Spinner, StatusPage, Button, Icon } from '@gnome-ui/react';
import { PanelCard } from '@gnome-ui/layout';
import { Check, Error, Warning, Refresh } from '@gnome-ui/icons';
import { PieChart, BarChart, LineChart } from '@gnome-ui/charts';
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

function buildPieData(history) {
  const success = history.filter(t => t.status === 'success').length;
  const error = history.filter(t => t.status === 'error').length;
  return [
    { label: 'Success', value: success, color: 'var(--success-color)' },
    { label: 'Failed',  value: error,   color: 'var(--error-color)'   },
  ].filter(d => d.value > 0);
}

function buildBarData(history) {
  const counts = {};
  for (const t of history) {
    const key = `${t.project}/${t.repo}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts).map(([repo, count]) => ({ repo, count }));
}

function buildLineData(history) {
  const buckets = {};
  for (const t of history) {
    const d = new Date(t.startedAt);
    const label = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (!buckets[label]) buckets[label] = { time: label, success: 0, error: 0 };
    buckets[label][t.status === 'error' ? 'error' : 'success']++;
  }
  return Object.values(buckets).sort((a, b) => a.time.localeCompare(b.time));
}

function Dashboard() {
  const { data: health, loading, error, refresh } = useApi('/health', { interval: 10000 });
  const { data: tasks } = useApi('/api/tasks', { interval: 5000 });
  const { data: repos } = useApi('/api/repos', { interval: 15000 });

  const appStatus = loading ? 'loading' : error ? 'down' : health?.status === 'ok' ? 'ok' : 'degraded';
  const activeCount = tasks?.active?.length ?? 0;
  const failedCount = tasks?.history?.filter(t => t.status === 'error').length ?? 0;
  const repoCount = repos?.repos?.length ?? 0;
  const history = tasks?.history ?? [];

  const pieData = buildPieData(history);
  const barData = buildBarData(history);
  const lineData = buildLineData(history);

  return (
    <Box orientation="vertical" spacing={16} style={{ padding: '24px', maxWidth: 720, margin: '0 auto' }}>
      <Box orientation="horizontal" spacing={3} justify="space-between" style={{ alignItems: 'center' }}>
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

      {pieData.length > 0 && (
        <PanelCard icon={<Icon icon={Check} />} title="Task Results" collapsible={false}>
          <PieChart
            data={pieData}
            height={220}
            donut
            showLegend
            aria-label="Task results breakdown"
          />
        </PanelCard>
      )}

      {barData.length > 0 && (
        <PanelCard icon={<Icon icon={Refresh} />} title="Tasks per Repo" collapsible={false}>
          <BarChart
            data={barData}
            series={[{ dataKey: 'count', name: 'Tasks' }]}
            xAxisKey="repo"
            height={220}
            showGrid
          />
        </PanelCard>
      )}

      {lineData.length > 1 && (
        <PanelCard icon={<Icon icon={Check} />} title="Activity over Time" collapsible={false}>
          <LineChart
            data={lineData}
            series={[
              { dataKey: 'success', name: 'Success', color: 'var(--success-color)' },
              { dataKey: 'error',   name: 'Failed',  color: 'var(--error-color)'   },
            ]}
            xAxisKey="time"
            height={220}
            showGrid
            showLegend
          />
        </PanelCard>
      )}

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
