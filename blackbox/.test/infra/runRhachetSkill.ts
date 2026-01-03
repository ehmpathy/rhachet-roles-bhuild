import { execSync } from 'child_process';

export interface SkillResult {
  stdout: string;
  stderr: string;
  output: string;
  exitCode: number;
}

/**
 * .what = runs a rhachet skill via npx rhachet run
 * .why  = tests the full flow as a consumer would use it
 */
export const runRhachetSkill = (input: {
  repo: string;
  role?: string;
  skill: string;
  args?: string;
  repoDir: string;
  timeout?: number;
}): SkillResult => {
  const args = input.args ? `-- ${input.args}` : '';
  const timeout = input.timeout ?? 60000;
  const roleFlag = input.role ? `--role ${input.role}` : '';

  try {
    const stdout = execSync(
      `npx rhachet run --repo ${input.repo} ${roleFlag} --skill ${input.skill} ${args}`,
      {
        cwd: input.repoDir,
        encoding: 'utf-8',
        timeout,
        env: {
          ...process.env,
          PATH: process.env.PATH,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    return {
      stdout: stdout.trim(),
      stderr: '',
      output: stdout.trim(),
      exitCode: 0,
    };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: Buffer | string;
      stderr?: Buffer | string;
      status?: number;
    };
    const stdout = (execError.stdout ?? '').toString().trim();
    const stderr = (execError.stderr ?? '').toString().trim();

    // debug: log errors during test development
    if (stderr) console.error('stderr:', stderr);
    if (stdout) console.log('stdout:', stdout);

    return {
      stdout,
      stderr,
      output: [stdout, stderr].filter(Boolean).join('\n'),
      exitCode: execError.status ?? 1,
    };
  }
};
