export function branchNameConflict(name: string, existing: string[]) {
  for (const branch of existing) {
    if (branch === name) return 'A branch with this name already exists.';
    if (name.startsWith(`${branch}/`) || branch.startsWith(`${name}/`)) {
      return `Conflicts with branch "${branch}": git cannot have both "a" and "a/b".`;
    }
  }
  return undefined;
}
