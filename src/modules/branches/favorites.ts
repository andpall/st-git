import type * as vscode from 'vscode';

const FAVORITES_KEY = 'st-git.favoriteBranches';
let storage: vscode.Memento;

export function setBranchStorage(memento: vscode.Memento) {
  storage = memento;
}

export function favoriteBranches() {
  return new Set(storage.get<string[]>(FAVORITES_KEY, []));
}

export async function toggleFavorite(name: string) {
  const favorites = favoriteBranches();
  if (favorites.has(name)) favorites.delete(name);
  else favorites.add(name);
  await storage.update(FAVORITES_KEY, [...favorites]);
}
