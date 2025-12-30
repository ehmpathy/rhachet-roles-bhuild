import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { given, then, when } from 'test-fns';

/**
 * .what = creates a temporary directory with behavior fixtures
 * .why = acceptance tests need isolated fixtures without modifying real files
 */
const createTestFixture = (): { fixtureDir: string; cleanup: () => void } => {
  const fixtureDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'decomposer-decompose-test-'),
  );

  return {
    fixtureDir,
    cleanup: () => fs.rmSync(fixtureDir, { recursive: true, force: true }),
  };
};

/**
 * .what = creates a behavior directory structure with fixtures
 * .why = skill tests need behavior artifacts to operate on
 */
const createBehaviorFixture = (input: {
  fixtureDir: string;
  behaviorName: string;
  withCriteria: boolean;
  alreadyDecomposed?: boolean;
}): void => {
  const behaviorDir = path.join(
    input.fixtureDir,
    '.behavior',
    `v2025_01_01.${input.behaviorName}`,
  );
  fs.mkdirSync(behaviorDir, { recursive: true });

  fs.writeFileSync(
    path.join(behaviorDir, '0.wish.md'),
    `enable ${input.behaviorName} functionality for the platform`,
  );

  if (input.withCriteria) {
    fs.writeFileSync(
      path.join(behaviorDir, '2.criteria.md'),
      `# criteria for ${input.behaviorName}\n\n- must support basic operations\n- must handle edge cases`,
    );
  }

  if (input.alreadyDecomposed) {
    fs.writeFileSync(
      path.join(behaviorDir, 'z.decomposed.md'),
      `# decomposed\n\nthis behavior was decomposed into:\n\n- sub-behavior-1\n- sub-behavior-2\n`,
    );
  }
};

/**
 * .what = runs decompose skill via shell script directly
 * .why = acceptance tests verify the shell script works end-to-end
 */
const runDecomposeSkill = (input: {
  behaviorName: string;
  mode: 'plan' | 'apply';
  fixtureDir: string;
  planFile?: string;
}): { stdout: string; stderr: string; output: string; exitCode: number } => {
  const scriptPath = path.join(
    __dirname,
    '../../domain.roles/decomposer/skills/decompose.behavior.sh',
  );
  const planArg = input.planFile ? `--plan "${input.planFile}"` : '';

  try {
    const stdout = execSync(
      `bash "${scriptPath}" --of "${input.behaviorName}" --mode "${input.mode}" --dir "${input.fixtureDir}" ${planArg}`,
      {
        encoding: 'utf-8',
        timeout: 30000,
        cwd: process.cwd(),
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

    return {
      stdout,
      stderr,
      output: [stdout, stderr].filter(Boolean).join('\n'),
      exitCode: execError.status ?? 1,
    };
  }
};

describe('decomposer.decompose acceptance', () => {
  given('[case1] behavior already decomposed', () => {
    let fixture: { fixtureDir: string; cleanup: () => void };

    beforeAll(() => {
      fixture = createTestFixture();
      createBehaviorFixture({
        fixtureDir: fixture.fixtureDir,
        behaviorName: 'decomposed-feature',
        withCriteria: true,
        alreadyDecomposed: true,
      });
    });

    afterAll(() => {
      fixture.cleanup();
    });

    when('[t0] --mode plan is invoked', () => {
      then('exits with code 0 (warns only)', () => {
        const result = runDecomposeSkill({
          behaviorName: 'decomposed-feature',
          mode: 'plan',
          fixtureDir: fixture.fixtureDir,
        });

        expect(result.exitCode).toBe(0);
      });

      then('output warns about prior decomposition', () => {
        const result = runDecomposeSkill({
          behaviorName: 'decomposed-feature',
          mode: 'plan',
          fixtureDir: fixture.fixtureDir,
        });

        expect(result.output).toContain('already decomposed');
      });
    });
  });

  given('[case2] behavior without criteria', () => {
    let fixture: { fixtureDir: string; cleanup: () => void };

    beforeAll(() => {
      fixture = createTestFixture();
      createBehaviorFixture({
        fixtureDir: fixture.fixtureDir,
        behaviorName: 'no-criteria-feature',
        withCriteria: false,
      });
    });

    afterAll(() => {
      fixture.cleanup();
    });

    when('[t0] --mode plan is invoked', () => {
      then('exits with non-zero code', () => {
        const result = runDecomposeSkill({
          behaviorName: 'no-criteria-feature',
          mode: 'plan',
          fixtureDir: fixture.fixtureDir,
        });

        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions criteria requirement', () => {
        const result = runDecomposeSkill({
          behaviorName: 'no-criteria-feature',
          mode: 'plan',
          fixtureDir: fixture.fixtureDir,
        });

        expect(result.output).toContain('criteria');
      });
    });
  });

  given('[case3] --mode apply without --plan', () => {
    let fixture: { fixtureDir: string; cleanup: () => void };

    beforeAll(() => {
      fixture = createTestFixture();
      createBehaviorFixture({
        fixtureDir: fixture.fixtureDir,
        behaviorName: 'apply-test-feature',
        withCriteria: true,
      });
    });

    afterAll(() => {
      fixture.cleanup();
    });

    when('[t0] invoked without plan file', () => {
      then('exits with non-zero code', () => {
        const result = runDecomposeSkill({
          behaviorName: 'apply-test-feature',
          mode: 'apply',
          fixtureDir: fixture.fixtureDir,
        });

        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions --plan requirement', () => {
        const result = runDecomposeSkill({
          behaviorName: 'apply-test-feature',
          mode: 'apply',
          fixtureDir: fixture.fixtureDir,
        });

        expect(result.output).toContain('--plan');
      });
    });
  });
});
