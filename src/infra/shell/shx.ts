import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * .what = execute a shell command and capture output
 * .why = enables dynamic token retrieval from cli tools (1password, vault, etc)
 *
 * .note = options.timeout kills the shell once it passes, so a stalled command (a vault
 *         wait, a hardware prompt) cannot hold a drain past its deadline; the kill rejects
 *         the call, as a failed command does
 *
 * .note = env is passed as process.env, explicitly. with no env option, node's child_process
 *         reads the host process's env, which is not always the process.env this code sees
 *         (a jest sandbox holds its own copy); a stub gh set on process.env.PATH would then
 *         never reach the shell, and the real gh would answer
 */
export const shx = async (
  command: string,
  options?: { timeout?: { milliseconds: number } },
): Promise<{ stdout: string; stderr: string }> => {
  const result = await execAsync(command, {
    env: process.env,
    timeout: options?.timeout
      ? Math.max(1, Math.floor(options.timeout.milliseconds))
      : 0,
    killSignal: 'SIGKILL',
  });
  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
};
