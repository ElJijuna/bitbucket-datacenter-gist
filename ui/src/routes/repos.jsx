import { createFileRoute } from '@tanstack/react-router';
import { Box, Text, Badge, Spinner, StatusPage, BoxedList, ActionRow, Button, Icon } from '@gnome-ui/react';
import { Applications, Refresh, Check, Warning } from '@gnome-ui/icons';
import { useApi } from '../hooks/useApi';

export const Route = createFileRoute('/repos')({
  component: Repos,
});

function RepoStatus({ ready, lastPulledAt }) {
  if (!ready) return <Badge variant="neutral">Not ready</Badge>;
  if (!lastPulledAt) return <Badge variant="warning">Never pulled</Badge>;
  const ago = Math.floor((Date.now() - new Date(lastPulledAt).getTime()) / 1000);
  const label = ago < 60 ? `${ago}s ago` : ago < 3600 ? `${Math.floor(ago / 60)}m ago` : `${Math.floor(ago / 3600)}h ago`;
  return <Badge variant="success">{label}</Badge>;
}

function Repos() {
  const { data, loading, error, refresh } = useApi('/api/repos', { interval: 15000 });
  const repos = data?.repos ?? [];

  return (
    <Box orientation="vertical" spacing={16} style={{ padding: '24px', maxWidth: 720, margin: '0 auto' }}>
      <Box orientation="horizontal" spacing={3} justify="space-between" style={{ alignItems: 'center' }}>
        <Text variant="heading">Cloned Repositories</Text>
        <Button variant="flat" onClick={refresh}>
          <Icon icon={Refresh} />
        </Button>
      </Box>

      {loading && <Spinner />}

      {error && (
        <StatusPage icon={Warning} title="Failed to load" description={error} compact />
      )}

      {!loading && !error && repos.length === 0 && (
        <StatusPage
          icon={Applications}
          title="No repositories cloned"
          description="Repos are cloned on first POST request to /api/projects/:project/repos/:repo/gists/:file"
          compact
        />
      )}

      {repos.length > 0 && (
        <BoxedList>
          {repos.map(r => (
            <ActionRow
              key={`${r.project}/${r.repo}`}
              title={`${r.project} / ${r.repo}`}
              subtitle={r.path}
              suffix={<RepoStatus ready={r.ready} lastPulledAt={r.lastPulledAt} />}
              prefix={<Icon icon={r.ready ? Check : Warning} />}
            />
          ))}
        </BoxedList>
      )}
    </Box>
  );
}
