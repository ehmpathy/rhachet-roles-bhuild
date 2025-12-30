import { execSync } from 'child_process';
import * as path from 'path';

const SCRIPT_PATH = path.join(
  __dirname,
  '../../domain.roles/decomposer/skills/decompose.behavior.sh',
);

/**
 * .what = invokes decompose.behavior.sh via subshell
 * .why = reusable test utility for skill invocation
 */
export const invokeDecomposeSkill = (input: {
  behaviorName: string;
  mode: 'plan' | 'apply';
  dir: string;
  planFile?: string;
  timeout?: number;
}): { stdout: string; exitCode: number } => {
  try {
    const planArg = input.planFile ? `--plan "${input.planFile}"` : '';
    const stdout = execSync(
      `bash "${SCRIPT_PATH}" --of "${input.behaviorName}" --mode "${input.mode}" --dir "${input.dir}" ${planArg}`,
      { encoding: 'utf-8', timeout: input.timeout ?? 10000 },
    );
    return { stdout, exitCode: 0 };
  } catch (err: unknown) {
    const error = err as { stdout?: string; status?: number };
    return {
      stdout: error.stdout ?? '',
      exitCode: error.status ?? 1,
    };
  }
};
