import { spawn } from 'child_process';
import { openSync } from 'fs';

/**
 * .what = starts a node process detached from this one, its stdout and stderr appended to a log
 * .why = a long-lived worker (a daemon) must outlive the short cli call that starts it; the log is
 *        the only place its output can go once the caller has exited
 *
 * .note = `program` is node source run via `node -e`; `args` follow it after `--`
 * .note = `cwd` is the dir the worker serves, by design (fulcrum F1, as `sdkRhachetClone`): a
 *         phone daemon serves the tree its cwd names, and loads that tree's own installed
 *         package, so a sender that wakes a receiver tree's daemon starts it as that tree would
 */
export const genProcessDetached = (input: {
  program: string;
  args: string[];
  logPath: string;
  env: NodeJS.ProcessEnv;
  cwd: string;
}): { pid: number | null } => {
  const log = openSync(input.logPath, 'a');
  const child = spawn(
    process.execPath,
    ['-e', input.program, '--', ...input.args],
    {
      detached: true,
      stdio: ['ignore', log, log],
      env: input.env,
      cwd: input.cwd,
    },
  );
  child.unref();
  return { pid: child.pid ?? null };
};
