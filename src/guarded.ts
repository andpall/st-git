import * as vscode from 'vscode';
import { currentOperation, isMissingCommitError } from './api/git';
import { OPERATION_LABELS } from './ui/operationState';
import { focusConflicts, refreshConflicts } from './modules/conflicts/provider';
import { abortOperation } from './commands/operation';
import { refreshAll } from './refresh';

const ABORT = 'Abort';
const STALE_LOG = 'That commit no longer exists: the log was out of date and has been refreshed. Try again.';

export function guarded<Args extends unknown[]>(action: (...args: Args) => Promise<unknown>) {
  return async function guardedAction(...args: Args) {
    let failure: unknown;
    let result: unknown;
    try {
      result = await action(...args);
    } catch (error) {
      failure = error;
    }
    await refreshAll();
    if (failure) await reportError(failure);
    return !failure && result !== false;
  };
}

function errorText(error: unknown) {
  return isMissingCommitError(error) ? STALE_LOG : (error as Error).message;
}

async function reportError(error: unknown) {
  const operation = await currentOperation();
  const conflictCount = await refreshConflicts();
  if (operation || conflictCount) await focusConflicts();
  const message = operation
    ? `${OPERATION_LABELS[operation]} stopped on conflicts. Resolve them in the Conflicts panel, then press Continue.`
    : errorText(error);
  const buttons = operation ? [ABORT] : [];
  const choice = await vscode.window.showErrorMessage(message, ...buttons);
  if (choice === ABORT) await guardedAbort();
}

const guardedAbort = guarded(abortOperation);
