import { spawn } from 'child_process';
import { openSync } from 'fs';

/**
 * .what = starts a node process detached from this one, its stdout and stderr appended to a log
 * .why = a long-lived worker (a daemon) must outlive the short cli call that starts it; the log is
 *        the only place its output can go once the caller has exited
 *
 * .note = `program` is node source run via `node -e`; `args` follow it after `--`
 */
export const genProcessDetached = (input: {
  program: string;
  args: string[];
  logPath: string;
  env: NodeJS.ProcessEnv;
}): { pid: number | null } => {
  const log = openSync(input.logPath, 'a');
  const child = spawn(
    process.execPath,
    ['-e', input.program, '--', ...input.args],
    { detached: true, stdio: ['ignore', log, log], env: input.env },
  );
  child.unref();
  return { pid: child.pid ?? null };
};
