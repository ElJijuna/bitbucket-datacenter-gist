import { createFileRoute } from '@tanstack/react-router';
import { Box, Text, Badge, Spinner, StatusPage, BoxedList, ActionRow, ProgressBar, Button, Icon } from '@gnome-ui/react';
import { Check, Error, Warning, Refresh } from '@gnome-ui/icons';
import { useApi } from '../hooks/useApi';

export const Route = createFileRoute('/tasks')({
  component: Tasks,
});

const METHOD_VARIANT = { POST: 'success', PUT: 'accent', DELETE: 'error' };

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

function waitingSince(iso) {
  if (!iso) return '';
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  return secs < 60 ? `${secs}s ago` : `${Math.floor(secs / 60)}m ago`;
}

function Tasks() {
  const { data: tasksData, loading, error, refresh } = useApi('/api/tasks', { interval: 3000 });
  const { data: queueData } = useApi('/api/queue', { interval: 2000 });

  const active = tasksData?.active ?? [];
  const history = tasksData?.history ?? [];
  const waiting = queueData?.waiting ?? [];

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

      {/* Queue */}
      <Box orientation="vertical" spacing={16}>
        <Box orientation="horizontal" spacing={2} style={{ alignItems: 'center' }}>
          <Text variant="title-3">Queue</Text>
          {waiting.length > 0 && <Badge variant="neutral">{waiting.length}</Badge>}
        </Box>
        {waiting.length === 0 ? (
          <Text variant="body" color="dim">No requests queued</Text>
        ) : (
          <BoxedList>
            {waiting.map((item, i) => (
              <ActionRow
                key={item.id}
                title={`${item.project}/${item.repo} — ${item.file}`}
                subtitle={`Queued ${waitingSince(item.queuedAt)}`}
                prefix={<Icon icon={Warning} />}
                suffix={
                  <Box orientation="horizontal" spacing={1} style={{ alignItems: 'center' }}>
                    <Badge variant={METHOD_VARIANT[item.method] ?? 'neutral'}>{item.method}</Badge>
                    <Badge variant="neutral">#{i + 1}</Badge>
                  </Box>
                }
              />
            ))}
          </BoxedList>
        )}
      </Box>

      {/* Active */}
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

      {/* History */}
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
