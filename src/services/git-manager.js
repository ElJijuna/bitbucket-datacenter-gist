import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';
import logger from '../api/middleware/logger.js';
import { startTask, endTask } from './task-tracker.js';

const BASE_DIR = './cloned-repos';
const registry = new Map();
const locks = new Map();

const PULL_INTERVAL_MS = parseInt(process.env.GIT_PULL_INTERVAL ?? '30', 10) * 1000;
const PUSH_DEBOUNCE_MS = parseInt(process.env.GIT_PUSH_DEBOUNCE ?? '500', 10);

async function withLock(key, fn) {
  const prev = locks.get(key) ?? Promise.resolve();
  let release;
  const current = new Promise(r => { release = r; });
  locks.set(key, current);
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(key) === current) locks.delete(key);
  }
}

class GitManager {
  constructor(project, repo) {
    this.project = project;
    this.repo = repo;
    this.repoPath = path.join(BASE_DIR, project, repo);
    this.git = null;
    this.ready = false;
    this.lastPulledAt = 0;
    this.pushTimer = null;
  }

  static getInstance(project, repo) {
    const key = `${project}/${repo}`;
    if (!registry.has(key)) {
      registry.set(key, new GitManager(project, repo));
    }
    return registry.get(key);
  }

  static getAll() {
    return [...registry.values()];
  }

  buildRepoUrl() {
    const protocol = (process.env.GIT_CLONE_PROTOCOL || 'ssh').toLowerCase();
    const proj = this.project.toLowerCase();

    if (protocol === 'https') {
      const base = process.env.BITBUCKET_SERVER_HOST.replace(/\/$/, '');
      const user = encodeURIComponent(process.env.BITBUCKET_USER);
      const token = encodeURIComponent(process.env.BITBUCKET_TOKEN);
      return `${base.replace(/^(https?:\/\/)/, `$1${user}:${token}@`)}/scm/${proj}/${this.repo}.git`;
    }

    const host = process.env.BITBUCKET_SERVER_HOST.replace(/^https?:\/\//, '');
    const port = process.env.BITBUCKET_SSH_PORT || '7999';
    return `ssh://git@${host}:${port}/scm/${proj}/${this.repo}.git`;
  }

  async _init() {
    if (!this.ready) {
      if (!fs.existsSync(this.repoPath)) {
        logger.info(`Cloning ${this.project}/${this.repo}...`);
        fs.mkdirSync(path.dirname(this.repoPath), { recursive: true });
        await simpleGit().clone(this.buildRepoUrl(), this.repoPath);
        logger.info(`✓ Cloned ${this.project}/${this.repo}`);
      }
      this.git = simpleGit(this.repoPath);
      await this._configureUser();
      this.ready = true;
    }
    await this._pull();
  }

  async _configureUser() {
    const name = process.env.GIT_USER_NAME || process.env.BITBUCKET_USER;
    const email = process.env.GIT_USER_EMAIL || `${process.env.BITBUCKET_USER}@bitbucket-gist`;
    await this.git.addConfig('user.name', name);
    await this.git.addConfig('user.email', email);
  }

  async _pull() {
    if (Date.now() - this.lastPulledAt < PULL_INTERVAL_MS) return;
    try {
      await this.git.pull();
      this.lastPulledAt = Date.now();
    } catch (err) {
      logger.warn(`Pull warning for ${this.project}/${this.repo}: ${err.message}`);
    }
  }

  _schedulePush() {
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(async () => {
      this.pushTimer = null;
      try {
        await withLock(`${this.project}/${this.repo}`, async () => {
          await this.git.push();
          logger.info(`✓ Push: ${this.project}/${this.repo}`);
        });
      } catch (err) {
        logger.error({ err }, `Push failed for ${this.project}/${this.repo}`);
      }
    }, PUSH_DEBOUNCE_MS);
  }

  async writeFile(filePath, content, message) {
    const taskId = startTask(this.project, this.repo, filePath);
    try {
      await withLock(`${this.project}/${this.repo}`, async () => {
        await this._init();
        const fullPath = path.join(this.repoPath, filePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content, 'utf8');
        await this.git.add(filePath);
        const status = await this.git.status();
        if (status.staged.length > 0) {
          await this.git.commit(message);
          this._schedulePush();
          logger.info(`✓ Committed: ${filePath} (push scheduled)`);
        } else {
          logger.info(`No changes in ${filePath}`);
        }
      });
      endTask(taskId);
    } catch (err) {
      endTask(taskId, err.message);
      throw err;
    }
  }

  async flush() {
    if (this.pushTimer) {
      clearTimeout(this.pushTimer);
      this.pushTimer = null;
    }
    return withLock(`${this.project}/${this.repo}`, async () => {
      if (!this.git) throw new Error('Repository not initialized');
      await this.git.push();
      logger.info(`✓ Flushed: ${this.project}/${this.repo}`);
    });
  }

  async getStatus() {
    return withLock(`${this.project}/${this.repo}`, async () => {
      await this._init();
      return this.git.status();
    });
  }

  async pull() {
    this.lastPulledAt = 0;
    return withLock(`${this.project}/${this.repo}`, async () => {
      await this._init();
    });
  }

  async push() {
    return this.flush();
  }

  async getLog(maxCount = 10) {
    return withLock(`${this.project}/${this.repo}`, async () => {
      await this._init();
      return this.git.log({ maxCount });
    });
  }
}

export default GitManager;
