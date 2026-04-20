import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';
import logger from '../api/middleware/logger.js';

const BASE_DIR = './cloned-repos';
const registry = new Map();
const locks = new Map();

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
  }

  static getInstance(project, repo) {
    const key = `${project}/${repo}`;
    if (!registry.has(key)) {
      registry.set(key, new GitManager(project, repo));
    }
    return registry.get(key);
  }

  buildSshUrl() {
    const host = process.env.BITBUCKET_SERVER_HOST.replace(/^https?:\/\//, '');
    const port = process.env.BITBUCKET_SSH_PORT || '7999';
    return `ssh://git@${host}:${port}/scm/${this.project.toLowerCase()}/${this.repo}.git`;
  }

  async _init() {
    if (this.ready) {
      await this._pull();
      return;
    }

    if (!fs.existsSync(this.repoPath)) {
      logger.info(`Cloning ${this.project}/${this.repo}...`);
      fs.mkdirSync(path.dirname(this.repoPath), { recursive: true });
      await simpleGit().clone(this.buildSshUrl(), this.repoPath);
      logger.info(`✓ Cloned ${this.project}/${this.repo}`);
    }

    this.git = simpleGit(this.repoPath);
    await this._configureUser();
    this.ready = true;
    await this._pull();
  }

  async _configureUser() {
    const name = process.env.GIT_USER_NAME || process.env.BITBUCKET_USER;
    const email = process.env.GIT_USER_EMAIL || `${process.env.BITBUCKET_USER}@bitbucket-gist`;
    await this.git.addConfig('user.name', name);
    await this.git.addConfig('user.email', email);
  }

  async _pull() {
    try {
      if (this.git) await this.git.pull();
    } catch (err) {
      logger.warn(`Pull warning for ${this.project}/${this.repo}: ${err.message}`);
    }
  }

  async writeFile(filePath, content, message) {
    return withLock(`${this.project}/${this.repo}`, async () => {
      await this._init();
      const fullPath = path.join(this.repoPath, filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, 'utf8');
      await this.git.add(filePath);
      const status = await this.git.status();
      if (status.staged.length > 0) {
        await this.git.commit(message);
        await this.git.push();
        logger.info(`✓ Pushed: ${filePath}`);
      } else {
        logger.info(`No changes in ${filePath}`);
      }
    });
  }

  async getStatus() {
    return withLock(`${this.project}/${this.repo}`, async () => {
      await this._init();
      return this.git.status();
    });
  }

  async pull() {
    return withLock(`${this.project}/${this.repo}`, async () => {
      await this._init();
    });
  }

  async push() {
    return withLock(`${this.project}/${this.repo}`, async () => {
      if (!this.git) throw new Error('Repository not initialized');
      await this.git.push();
      logger.info(`✓ Pushed ${this.project}/${this.repo}`);
    });
  }

  async getLog(maxCount = 10) {
    return withLock(`${this.project}/${this.repo}`, async () => {
      await this._init();
      return this.git.log({ maxCount });
    });
  }
}

export default GitManager;
