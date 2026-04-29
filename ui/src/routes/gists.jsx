import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Box, Text, Spinner, StatusPage, Button, Badge, TerminalView } from '@gnome-ui/react';
import { PanelCard } from '@gnome-ui/layout';
import { Warning } from '@gnome-ui/icons';
import { useApi } from '../hooks/useApi';

export const Route = createFileRoute('/gists')({
  component: GistBrowser,
});

const FIELD_STYLE = {
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid var(--border-color, rgba(127,127,127,0.35))',
  background: 'var(--view-bg-color, rgba(0,0,0,0.2))',
  color: 'inherit',
  fontSize: '13px',
  width: '160px',
  boxSizing: 'border-box',
};

const FIELDS = [
  { key: 'project', label: 'Project', placeholder: 'MYPROJECT' },
  { key: 'repo', label: 'Repo', placeholder: 'backend-api' },
  { key: 'file', label: 'File', placeholder: 'config.json' },
  { key: 'branch', label: 'Branch', placeholder: 'main' },
];

function GistContent({ project, repo, file, branch }) {
  const url = `/api/gist/${encodeURIComponent(project)}/${encodeURIComponent(repo)}/${encodeURIComponent(file)}?branch=${encodeURIComponent(branch)}`;
  const { data, loading, error } = useApi(url, { interval: null });

  if (loading) return <Spinner />;
  if (error) return <StatusPage icon={Warning} title="Failed to load" description={error} compact />;
  if (!data) return null;

  const { content, meta } = data;
  const updatedAt = meta?.updatedAt ? new Date(meta.updatedAt).toLocaleString() : null;

  return (
    <PanelCard
      title={`${project} / ${repo} / ${file}`}
      collapsible={false}
    >
      <Box orientation="vertical" spacing={2} style={{ padding: '4px 0' }}>
        <Box orientation="horizontal" spacing={2} style={{ alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <Badge variant="accent">{branch}</Badge>
          {meta?.size != null && (
            <Text variant="caption" color="dim">{meta.size} bytes</Text>
          )}
          {updatedAt && (
            <Text variant="caption" color="dim">· updated {updatedAt}</Text>
          )}
        </Box>
        <TerminalView lines={content.split('\n')} autoScroll={false} />
      </Box>
    </PanelCard>
  );
}

function GistBrowser() {
  const [fields, setFields] = useState({
    project: 'MYPROJECT',
    repo: 'backend-api',
    file: 'config.json',
    branch: 'main',
  });
  const [query, setQuery] = useState(null);

  function set(key) {
    return e => setFields(f => ({ ...f, [key]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const { project, repo, file, branch } = fields;
    if (project && repo && file && branch) setQuery({ ...fields });
  }

  return (
    <Box orientation="vertical" spacing={16} style={{ padding: '24px', maxWidth: 760, margin: '0 auto' }}>
      <Text variant="heading">Gist Browser</Text>

      <PanelCard title="Look up a file" collapsible={false}>
        <form onSubmit={handleSubmit}>
          <Box orientation="vertical" spacing={3} style={{ padding: '8px 0' }}>
            <Box
              orientation="horizontal"
              spacing={2}
              style={{ flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}
            >
              {FIELDS.map(({ key, label, placeholder }) => (
                <Box key={key} orientation="vertical" spacing={1}>
                  <Text variant="caption">{label}</Text>
                  <input
                    value={fields[key]}
                    onChange={set(key)}
                    placeholder={placeholder}
                    required
                    style={FIELD_STYLE}
                  />
                </Box>
              ))}
              <Button type="submit">Fetch</Button>
            </Box>
          </Box>
        </form>
      </PanelCard>

      {query && (
        <GistContent
          key={`${query.project}/${query.repo}/${query.file}@${query.branch}`}
          {...query}
        />
      )}
    </Box>
  );
}
