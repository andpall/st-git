import * as vscode from 'vscode';
import { repoGit } from '../../api/git';

const LOCAL_CHANGES_IN_THE_WAY = /would be overwritten by checkout|commit your changes or stash them/i;
const SMART_CHECKOUT = 'Smart Checkout';
const STASH_POP_CONFLICT = 'Switched branch, but re-applying your local changes caused conflicts. Resolve them in the Conflicts panel. A copy of your changes is kept in the stash as "st-git smart checkout".';
const SMART_CHECKOUT_DETAIL = 'Smart Checkout stashes your local changes, switches the branch and re-applies them.';

async function checkoutWithStash(args: string[]) {
  await repoGit(['stash', 'push', '--include-untracked', '-m', 'st-git smart checkout']);
  try {
    await repoGit(['checkout', ...args, '--']);
  } catch (error) {
    await repoGit(['stash', 'pop']);
    throw error;
  }
  try {
    await repoGit(['stash', 'pop']);
  } catch {
    throw new Error(STASH_POP_CONFLICT);
  }
}

export async function checkout(args: string[]) {
  try {
    await repoGit(['checkout', ...args, '--']);
    return;
  } catch (error) {
    if (!LOCAL_CHANGES_IN_THE_WAY.test((error as Error).message)) throw error;
  }
  const choice = await vscode.window.showWarningMessage(
    'Your local changes would be overwritten by checkout.', { modal: true, detail: SMART_CHECKOUT_DETAIL }, SMART_CHECKOUT);
  if (choice === SMART_CHECKOUT) await checkoutWithStash(args);
}

export async function checkoutRemote(remoteBranch: string, localNames: Set<string>) {
  const localName = remoteBranch.slice(remoteBranch.indexOf('/') + 1);
  if (localNames.has(localName)) await checkout([localName]);
  else await checkout(['-b', localName, '--track', remoteBranch]);
}
