import { createFileRoute } from '@tanstack/react-router';
import { Box, Text, Badge, Spinner, StatusPage, BoxedList, ActionRow, ProgressBar, Button, Icon } from '@gnome-ui/react';
import { Check, Error, Warning, Refresh } from '@gnome-ui/icons';
import { useApi } from '../hooks/useApi';

export const Route = createFileRoute('/tasks')({
  component: Tasks,
});

function TaskBadge({ status }) {
  if (status === 'running') return <Badge variant="accent">Running</Badge>;
  if (status === 'success') return <Badge variant="success">Done</Badge>;
  return <Badge variant="error">Failed</Badge>;
}

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString();
}

function duration(start, end) {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function Tasks() {
  const { data, loading, error, refresh } = useApi('/api/tasks', { interval: 3000 });
  const active = data?.active ?? [];
  const history = data?.history ?? [];

  return (
    <Box orientation="vertical" spacing={16} style={{ padding: '24px', maxWidth: 720, margin: '0 auto' }}>
      <Box orientation="horizontal" spacing={2} justify="space-between" style={{ alignItems: 'center' }}>
        <Text variant="heading">Tasks</Text>
        <Button variant="flat" onClick={refresh}>
          <Icon icon={Refresh} />
        </Button>
      </Box>

      {loading && <Spinner />}
      {error && <StatusPage icon={Warning} title="Failed to load" description={error} compact />}

      <Box orientation="vertical" spacing={16}>
        <Text variant="title-3">Active</Text>
        {active.length === 0 ? (
          <Text variant="body" color="dim">No tasks running</Text>
        ) : (
          <BoxedList>
            {active.map(t => (
              <ActionRow
                key={t.id}
                title={`${t.project}/${t.repo} — ${t.file}`}
                subtitle={`Started ${formatTime(t.startedAt)}`}
                prefix={<Icon icon={Check} />}
                suffix={
                  <Box orientation="vertical" spacing={1} style={{ minWidth: 120 }}>
                    <TaskBadge status="running" />
                    <ProgressBar aria-label="Task running" />
                  </Box>
                }
              />
            ))}
          </BoxedList>
        )}
      </Box>

      <Box orientation="vertical" spacing={16}>
        <Text variant="title-3">History</Text>
        {history.length === 0 ? (
          <Text variant="body" color="dim">No completed tasks yet</Text>
        ) : (
          <BoxedList>
            {history.map(t => (
              <ActionRow
                key={t.id}
                title={`${t.project}/${t.repo} — ${t.file}`}
                subtitle={
                  t.status === 'error'
                    ? t.error
                    : `${formatTime(t.startedAt)} · ${duration(t.startedAt, t.endedAt)}`
                }
                prefix={<Icon icon={t.status === 'success' ? Check : Error} />}
                suffix={<TaskBadge status={t.status} />}
              />
            ))}
          </BoxedList>
        )}
      </Box>
    </Box>
  );
}
