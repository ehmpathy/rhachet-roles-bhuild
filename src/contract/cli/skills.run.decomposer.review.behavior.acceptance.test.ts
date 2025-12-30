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
    path.join(os.tmpdir(), 'decomposer-review-test-'),
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
};

/**
 * .what = runs review.behavior skill via shell script directly
 * .why = acceptance tests verify the shell script works end-to-end
 */
const runReviewBehaviorSkill = (input: {
  behaviorName: string;
  fixtureDir: string;
}): { stdout: string; stderr: string; output: string; exitCode: number } => {
  const scriptPath = path.join(
    __dirname,
    '../../domain.roles/decomposer/skills/review.behavior.sh',
  );

  try {
    const stdout = execSync(
      `bash "${scriptPath}" --of "${input.behaviorName}" --dir "${input.fixtureDir}"`,
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

describe('decomposer.review.behavior acceptance', () => {
  given('[case1] behavior with criteria under threshold', () => {
    let fixture: { fixtureDir: string; cleanup: () => void };

    beforeAll(() => {
      fixture = createTestFixture();
      createBehaviorFixture({
        fixtureDir: fixture.fixtureDir,
        behaviorName: 'small-feature',
        withCriteria: true,
      });
    });

    afterAll(() => {
      fixture.cleanup();
    });

    when('[t0] skill is invoked', () => {
      then('exits with code 0', () => {
        const result = runReviewBehaviorSkill({
          behaviorName: 'small-feature',
          fixtureDir: fixture.fixtureDir,
        });

        expect(result.exitCode).toBe(0);
      });

      then('outputs recommendation', () => {
        const result = runReviewBehaviorSkill({
          behaviorName: 'small-feature',
          fixtureDir: fixture.fixtureDir,
        });

        expect(result.output).toMatch(/DECOMPOSE_(REQUIRED|UNNEEDED)/);
      });

      then('outputs beaver intro', () => {
        const result = runReviewBehaviorSkill({
          behaviorName: 'small-feature',
          fixtureDir: fixture.fixtureDir,
        });

        expect(result.output).toContain("let's review!");
      });
    });
  });

  given('[case2] behavior without criteria', () => {
    let fixture: { fixtureDir: string; cleanup: () => void };

    beforeAll(() => {
      fixture = createTestFixture();
      createBehaviorFixture({
        fixtureDir: fixture.fixtureDir,
        behaviorName: 'incomplete-feature',
        withCriteria: false,
      });
    });

    afterAll(() => {
      fixture.cleanup();
    });

    when('[t0] skill is invoked', () => {
      then('exits with non-zero code', () => {
        const result = runReviewBehaviorSkill({
          behaviorName: 'incomplete-feature',
          fixtureDir: fixture.fixtureDir,
        });

        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions criteria requirement', () => {
        const result = runReviewBehaviorSkill({
          behaviorName: 'incomplete-feature',
          fixtureDir: fixture.fixtureDir,
        });

        expect(result.output).toContain('criteria');
      });
    });
  });

  given('[case3] behavior not found', () => {
    let fixture: { fixtureDir: string; cleanup: () => void };

    beforeAll(() => {
      fixture = createTestFixture();
      createBehaviorFixture({
        fixtureDir: fixture.fixtureDir,
        behaviorName: 'existing-feature',
        withCriteria: true,
      });
    });

    afterAll(() => {
      fixture.cleanup();
    });

    when('[t0] skill invoked with unknown name', () => {
      then('exits with non-zero code', () => {
        const result = runReviewBehaviorSkill({
          behaviorName: 'nonexistent',
          fixtureDir: fixture.fixtureDir,
        });

        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions behavior not found', () => {
        const result = runReviewBehaviorSkill({
          behaviorName: 'nonexistent',
          fixtureDir: fixture.fixtureDir,
        });

        expect(result.output).toContain('no behavior found');
      });
    });
  });
});
