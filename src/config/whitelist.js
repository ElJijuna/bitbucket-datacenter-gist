const allowed = new Set(
  (process.env.ALLOWED_REPOS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
);

export function isAllowed(project, repo) {
  return allowed.size > 0 && allowed.has(`${project.toLowerCase()}:${repo.toLowerCase()}`);
}
