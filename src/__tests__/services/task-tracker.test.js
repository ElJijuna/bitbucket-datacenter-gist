import { describe, it, expect, beforeEach } from 'bun:test';
import { startTask, endTask, getActiveTasks, getHistory, _reset } from '../../services/task-tracker.js';

describe('task-tracker', () => {
  beforeEach(_reset);

  it('startTask adds an active task', () => {
    const id = startTask('P', 'R', 'f.json');
    const tasks = getActiveTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({ id, project: 'P', repo: 'R', file: 'f.json', status: 'running' });
    expect(typeof tasks[0].startedAt).toBe('string');
  });

  it('endTask moves task to history with success status', () => {
    const id = startTask('P', 'R', 'f.json');
    endTask(id);

    expect(getActiveTasks()).toHaveLength(0);

    const [task] = getHistory();
    expect(task.id).toBe(id);
    expect(task.status).toBe('success');
    expect(typeof task.endedAt).toBe('string');
  });

  it('endTask with error records failure and message', () => {
    const id = startTask('P', 'R', 'f.json');
    endTask(id, 'something went wrong');

    const [task] = getHistory();
    expect(task.status).toBe('error');
    expect(task.error).toBe('something went wrong');
  });

  it('endTask with unknown id does nothing', () => {
    endTask('non-existent-id');
    expect(getActiveTasks()).toHaveLength(0);
    expect(getHistory()).toHaveLength(0);
  });

  it('tracks multiple concurrent active tasks', () => {
    const id1 = startTask('P', 'R', 'a.json');
    const id2 = startTask('P', 'R', 'b.json');

    expect(getActiveTasks()).toHaveLength(2);

    endTask(id1);
    expect(getActiveTasks()).toHaveLength(1);
    expect(getActiveTasks()[0].id).toBe(id2);
  });

  it('history is ordered most-recent first', () => {
    const id1 = startTask('P', 'R', 'a.json');
    const id2 = startTask('P', 'R', 'b.json');
    endTask(id1);
    endTask(id2);

    const history = getHistory();
    expect(history[0].id).toBe(id2);
    expect(history[1].id).toBe(id1);
  });

  it('history is capped at MAX_HISTORY (100)', () => {
    for (let i = 0; i < 105; i++) {
      endTask(startTask('P', 'R', `f${i}.json`));
    }
    expect(getHistory().length).toBe(100);
  });

  it('returns snapshots so mutations do not affect internal state', () => {
    startTask('P', 'R', 'f.json');
    const tasks = getActiveTasks();
    tasks.push({ fake: true });
    expect(getActiveTasks()).toHaveLength(1);
  });
});
