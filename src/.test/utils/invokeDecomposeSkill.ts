import { execSync } from 'child_process';
import { MalfunctionError } from 'helpful-errors';
import * as path from 'path';

const SCRIPT_PATH = path.join(
  __dirname,
  '../../domain.roles/decomposer/skills/decompose.behavior.sh',
);

/**
 * .what = the default kill budget for one skill run
 * .why = a loaded box runs the skill in ~10s; the budget sits under the 90s
 *        jest limit (jest.integration.env.ts), so jest never kills first
 */
export const MS_DECOMPOSE_SKILL_TIMEOUT = 60_000;

/**
 * .what = invokes decompose.behavior.sh via subshell
 * .why = reusable test utility for skill invocation
 * .note = a run the timeout killed throws; it never reads as a non-zero exit,
 *         else every "exit code is non-zero" case passes on a kill
 */
export const invokeDecomposeSkill = (input: {
  behaviorName: string;
  mode: 'plan' | 'apply';
  dir: string;
  planFile?: string;
  timeout?: number;
}): { stdout: string; stderr: string; exitCode: number } => {
  const timeout = input.timeout ?? MS_DECOMPOSE_SKILL_TIMEOUT;
  try {
    const planArg = input.planFile ? `--plan "${input.planFile}"` : '';
    const stdout = execSync(
      `bash "${SCRIPT_PATH}" --of "${input.behaviorName}" --mode "${input.mode}" --dir "${input.dir}" ${planArg}`,
      { encoding: 'utf-8', timeout },
    );
    return { stdout, stderr: '', exitCode: 0 };
  } catch (err: unknown) {
    const error = err as {
      stdout?: string;
      stderr?: string;
      status?: number | null;
      signal?: string | null;
    };

    // a killed run has no exit code; fail loud, never fake one
    if (error.status === null || error.status === undefined)
      throw new MalfunctionError('decompose.behavior.sh was killed', {
        signal: error.signal ?? null,
        timeout,
        behaviorName: input.behaviorName,
        stdout: error.stdout ?? '',
        stderr: error.stderr ?? '',
        hint: 'the box may be loaded; raise the timeout input, never the jest limit',
      });

    return {
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
      exitCode: error.status,
    };
  }
};
