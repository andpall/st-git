const SPECIAL_CHARACTERS = /[*?[\\]/g;

export function ignorePattern(relativePath: string, isFolder: boolean) {
  const escaped = relativePath.replace(SPECIAL_CHARACTERS, '\\$&');
  return isFolder ? `/${escaped}/` : `/${escaped}`;
}

export function appendIgnoreLines(content: string, patterns: string[]) {
  const lines = content.split(/\r?\n/);
  const existing = new Set(lines);
  const missing = patterns.filter(isMissingFrom(existing));
  if (!missing.length) return content;
  const separator = content && !content.endsWith('\n') ? '\n' : '';
  return `${content}${separator}${missing.join('\n')}\n`;
}

function isMissingFrom(existing: Set<string>) {
  return function isMissing(pattern: string) {
    return !existing.has(pattern);
  };
}
