class GistManager {
  constructor(gitManager) {
    this.gitManager = gitManager;
  }

  async readFile(filePath, branch) {
    const content = await this.gitManager.readFile(filePath, branch);

    if (content === null) {
      return null;
    }

    return { file: filePath, branch, content };
  }

  async createFile(filePath, content, branch) {
    const existing = await this.gitManager.readFile(filePath, branch);

    if (existing !== null) {
      throw Object.assign(new Error(`File already exists: ${filePath}`), { status: 409 });
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    await this.gitManager.writeFile(filePath, contentStr, `Create ${filePath} via gist API`, branch);

    return { file: filePath, branch, createdAt: new Date().toISOString() };
  }

  async updateFile(filePath, content, branch) {
    const existing = await this.gitManager.readFile(filePath, branch);

    if (existing === null) {
      throw Object.assign(new Error(`File not found: ${filePath}`), { status: 404 });
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    await this.gitManager.writeFile(filePath, contentStr, `Update ${filePath} via gist API`, branch);

    return { file: filePath, branch, updatedAt: new Date().toISOString() };
  }

  async deleteFile(filePath, branch) {
    const existing = await this.gitManager.readFile(filePath, branch);

    if (existing === null) {
      throw Object.assign(new Error(`File not found: ${filePath}`), { status: 404 });
    }

    await this.gitManager.deleteFile(filePath, `Delete ${filePath} via gist API`, branch);

    return { file: filePath, branch, deletedAt: new Date().toISOString() };
  }
}

export default GistManager;
