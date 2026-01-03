import { execSync } from 'child_process';

export interface InitResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * .what = runs npx rhachet roles init
 * .why  = tests role initialization as a consumer would use it
 */
export const runRolesInit = (input: {
  repo: string;
  role: string;
  repoDir: string;
  timeout?: number;
}): InitResult => {
  const timeout = input.timeout ?? 60000;

  try {
    const stdout = execSync(
      `npx rhachet roles init --repo ${input.repo} --role ${input.role}`,
      {
      cwd: input.repoDir,
      encoding: 'utf-8',
      timeout,
      env: {
        ...process.env,
        PATH: process.env.PATH,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout: stdout.trim(), stderr: '', exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: Buffer | string;
      stderr?: Buffer | string;
      status?: number;
    };
    const stdout = (execError.stdout ?? '').toString().trim();
    const stderr = (execError.stderr ?? '').toString().trim();

    if (stderr) console.error('stderr:', stderr);
    if (stdout) console.log('stdout:', stdout);

    return {
      stdout,
      stderr,
      exitCode: execError.status ?? 1,
    };
  }
};
