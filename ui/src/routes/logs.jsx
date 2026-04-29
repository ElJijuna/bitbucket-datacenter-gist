import { createFileRoute } from '@tanstack/react-router';
import { TerminalView, Box, Text, Badge, Button, Icon } from '@gnome-ui/react';
import { Refresh } from '@gnome-ui/icons';
import { useState, useEffect, useRef } from 'react';

export const Route = createFileRoute('/logs')({
  component: Logs,
});

const LEVEL_PREFIX = {
  info:  '[INF]',
  warn:  '[WRN]',
  error: '[ERR]',
  debug: '[DBG]',
  trace: '[TRC]',
  fatal: '[FTL]',
};

function formatLine({ level, message, timestamp }) {
  const time = new Date(timestamp).toLocaleTimeString('en-US', { hour12: false });
  return `${time} ${LEVEL_PREFIX[level] ?? `[${level.toUpperCase()}]`} ${message}`;
}

function Logs() {
  const [lines, setLines] = useState([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  function connect() {
    if (esRef.current) esRef.current.close();
    setLines([]);
    const es = new EventSource('/api/logs/stream');
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onmessage = (e) => {
      const entry = JSON.parse(e.data);
      setLines(prev => [...prev, formatLine(entry)]);
    };
    es.onerror = () => setConnected(false);
  }

  useEffect(() => {
    connect();
    return () => esRef.current?.close();
  }, []);

  return (
    <Box orientation="vertical" spacing={16} style={{ padding: '24px', maxWidth: 860, margin: '0 auto' }}>
      <Box orientation="horizontal" spacing={8} style={{ alignItems: 'center' }}>
        <Text variant="heading" style={{ flex: 1 }}>Logs</Text>
        <Badge variant={connected ? 'success' : 'error'}>
          {connected ? 'Live' : 'Disconnected'}
        </Badge>
        <Button variant="flat" onClick={connect}>
          <Icon icon={Refresh} />
        </Button>
      </Box>

      <TerminalView
        lines={lines.length > 0 ? lines : ['Waiting for events…']}
        maxLines={500}
      />
    </Box>
  );
}
