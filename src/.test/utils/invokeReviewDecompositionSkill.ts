import { execSync } from 'child_process';
import * as path from 'path';

const SCRIPT_PATH = path.join(
  __dirname,
  '../../domain.roles/decomposer/skills/review.decomposition.sh',
);

/**
 * .what = invokes review.decomposition.sh via subshell
 * .why = reusable test utility for skill invocation
 */
export const invokeReviewDecompositionSkill = (input: {
  behaviorName: string;
  dir: string;
}): { stdout: string; exitCode: number } => {
  try {
    const stdout = execSync(
      `bash "${SCRIPT_PATH}" --of "${input.behaviorName}" --dir "${input.dir}"`,
      { encoding: 'utf-8' },
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
