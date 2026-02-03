import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * .what = execute a shell command and capture output
 * .why = enables dynamic token retrieval from cli tools (1password, vault, etc)
 */
export const shx = async (
  command: string,
): Promise<{ stdout: string; stderr: string }> => {
  const result = await execAsync(command);
  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
};
