import { describe, it, expect, beforeEach, mock } from 'bun:test';
import GistManager from '../../services/gist-manager.js';

function makeMockGit({ fileContent = null } = {}) {
  return {
    readFile: mock(() => Promise.resolve(fileContent)),
    writeFile: mock(() => Promise.resolve()),
    deleteFile: mock(() => Promise.resolve()),
  };
}

describe('GistManager.readFile', () => {
  it('returns null when file does not exist', async () => {
    const gm = new GistManager(makeMockGit({ fileContent: null }));
    expect(await gm.readFile('f.json', 'main')).toBeNull();
  });

  it('returns file data when file exists', async () => {
    const gm = new GistManager(makeMockGit({ fileContent: '{"a":1}' }));
    const result = await gm.readFile('f.json', 'main');
    expect(result).toEqual({ file: 'f.json', branch: 'main', content: '{"a":1}' });
  });
});

describe('GistManager.createFile', () => {
  it('throws 409 if file already exists', async () => {
    const gm = new GistManager(makeMockGit({ fileContent: 'existing' }));
    const err = await gm.createFile('f.json', 'new', 'main').catch(e => e);
    expect(err.status).toBe(409);
  });

  it('writes and returns metadata when file does not exist', async () => {
    const git = makeMockGit({ fileContent: null });
    const gm = new GistManager(git);
    const result = await gm.createFile('f.json', '{"x":1}', 'main');
    expect(result).toMatchObject({ file: 'f.json', branch: 'main' });
    expect(typeof result.createdAt).toBe('string');
    expect(git.writeFile).toHaveBeenCalledTimes(1);
  });

  it('serializes object content to JSON string', async () => {
    const git = makeMockGit({ fileContent: null });
    const gm = new GistManager(git);
    await gm.createFile('f.json', { key: 'value' }, 'main');
    const [, written] = git.writeFile.mock.calls[0];
    expect(written).toBe(JSON.stringify({ key: 'value' }, null, 2));
  });
});

describe('GistManager.updateFile', () => {
  it('throws 404 if file does not exist', async () => {
    const gm = new GistManager(makeMockGit({ fileContent: null }));
    const err = await gm.updateFile('f.json', 'content', 'main').catch(e => e);
    expect(err.status).toBe(404);
  });

  it('writes and returns metadata when file exists', async () => {
    const git = makeMockGit({ fileContent: 'old' });
    const gm = new GistManager(git);
    const result = await gm.updateFile('f.json', 'new', 'main');
    expect(result).toMatchObject({ file: 'f.json', branch: 'main' });
    expect(typeof result.updatedAt).toBe('string');
    expect(git.writeFile).toHaveBeenCalledTimes(1);
  });
});

describe('GistManager.deleteFile', () => {
  it('throws 404 if file does not exist', async () => {
    const gm = new GistManager(makeMockGit({ fileContent: null }));
    const err = await gm.deleteFile('f.json', 'main').catch(e => e);
    expect(err.status).toBe(404);
  });

  it('deletes and returns metadata when file exists', async () => {
    const git = makeMockGit({ fileContent: 'content' });
    const gm = new GistManager(git);
    const result = await gm.deleteFile('f.json', 'main');
    expect(result).toMatchObject({ file: 'f.json', branch: 'main' });
    expect(typeof result.deletedAt).toBe('string');
    expect(git.deleteFile).toHaveBeenCalledTimes(1);
  });
});
