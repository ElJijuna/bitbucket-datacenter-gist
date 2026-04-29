import { describe, it, expect, beforeEach } from 'bun:test';
import { enqueue, getWaiting, _reset } from '../../services/queue-manager.js';

const tick = () => Promise.resolve();

describe('queue-manager', () => {
  beforeEach(_reset);

  it('executes a single task and returns its value', async () => {
    const result = await enqueue('P', 'R', 'f.json', 'PUT', () => Promise.resolve('ok'));
    expect(result).toBe('ok');
  });

  it('serializes tasks for the same repo', async () => {
    const log = [];
    const delay = ms => new Promise(r => setTimeout(r, ms));

    const p1 = enqueue('P', 'R', 'a.json', 'PUT', async () => { await delay(30); log.push(1); });
    const p2 = enqueue('P', 'R', 'b.json', 'POST', () => { log.push(2); });

    await Promise.all([p1, p2]);
    expect(log).toEqual([1, 2]);
  });

  it('runs tasks for different repos concurrently', async () => {
    const log = [];
    const delay = ms => new Promise(r => setTimeout(r, ms));

    const p1 = enqueue('P', 'R1', 'f.json', 'PUT', async () => { await delay(30); log.push('R1'); });
    const p2 = enqueue('P', 'R2', 'f.json', 'PUT', async () => { log.push('R2'); });

    await Promise.all([p1, p2]);
    expect(log[0]).toBe('R2');
    expect(log[1]).toBe('R1');
  });

  it('shows items waiting behind a running task', async () => {
    let resolve1;
    const p1 = enqueue('P', 'R', 'a.json', 'PUT', () => new Promise(r => { resolve1 = r; }));
    const p2 = enqueue('P', 'R', 'b.json', 'POST', () => Promise.resolve());

    // Let microtasks run so p1 starts (item1 dequeued from waiting)
    await tick();
    await tick();

    const w = getWaiting();
    expect(w).toHaveLength(1);
    expect(w[0].file).toBe('b.json');
    expect(w[0].method).toBe('POST');

    resolve1();
    await Promise.all([p1, p2]);
  });

  it('waiting is empty when all tasks have started', async () => {
    await enqueue('P', 'R', 'f.json', 'PUT', () => Promise.resolve());
    expect(getWaiting()).toHaveLength(0);
  });

  it('continues processing subsequent tasks after an error', async () => {
    const log = [];

    const p1 = enqueue('P', 'R', 'a.json', 'PUT', () => Promise.reject(new Error('boom')));
    const p2 = enqueue('P', 'R', 'b.json', 'POST', () => { log.push('ran'); });

    await p1.catch(() => {});
    await p2;
    expect(log).toEqual(['ran']);
  });

  it('items include project, repo, file, method and queuedAt', async () => {
    let resolve1;
    enqueue('PROJ', 'myrepo', 'config.json', 'DELETE', () => new Promise(r => { resolve1 = r; }));
    enqueue('PROJ', 'myrepo', 'settings.json', 'PUT', () => Promise.resolve());

    await tick();
    await tick();

    const [item] = getWaiting();
    expect(item.project).toBe('PROJ');
    expect(item.repo).toBe('myrepo');
    expect(item.file).toBe('settings.json');
    expect(item.method).toBe('PUT');
    expect(typeof item.queuedAt).toBe('string');

    resolve1();
  });
});
