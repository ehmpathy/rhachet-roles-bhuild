import { execSync } from 'child_process';

export interface InitResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * .what = runs npx rhachet roles init, then init --hooks
 * .why  = tests role initialization as a consumer would use it
 *         roles init runs inits.exec commands
 *         init --hooks syncs Role.hooks declarations to brain configs
 */
export const runRolesInit = (input: {
  repo: string;
  role: string;
  repoDir: string;
  timeout?: number;
}): InitResult => {
  const timeout = input.timeout ?? 60000;

  try {
    // run roles init (executes inits.exec commands)
    const rolesInitStdout = execSync(
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
      },
    );

    // run init --hooks (syncs Role.hooks declarations to brain configs)
    const hooksStdout = execSync(`npx rhachet init --hooks`, {
      cwd: input.repoDir,
      encoding: 'utf-8',
      timeout,
      env: {
        ...process.env,
        PATH: process.env.PATH,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const stdout = [rolesInitStdout, hooksStdout]
      .map((s) => s.toString().trim())
      .filter(Boolean)
      .join('\n');

    return { stdout, stderr: '', exitCode: 0 };
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
