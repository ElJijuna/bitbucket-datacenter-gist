class GistManager {
  constructor(gitManager) {
    this.gitManager = gitManager;
  }

  async upsertFile(filePath, content) {
    await this.gitManager.writeFile(filePath, content, `Update ${filePath} via gist API`);
    return { file: filePath, updatedAt: new Date().toISOString() };
  }
}

export default GistManager;
