import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { invokeDecomposeSkill } from '../../../.test/utils/invokeDecomposeSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/example.repo');

describe('decompose.behavior.sh', () => {
  given('[case1] behavior already decomposed', () => {
    when('[t0] --mode plan invoked', () => {
      then('exit code is 0 (warn only)', () => {
        const result = invokeDecomposeSkill({
          behaviorName: 'feature',
          mode: 'plan',
          dir: path.join(ASSETS_DIR, 'already-decomposed'),
        });
        expect(result.exitCode).toEqual(0);
      });

      then('output warns about prior decomposition', () => {
        const result = invokeDecomposeSkill({
          behaviorName: 'feature',
          mode: 'plan',
          dir: path.join(ASSETS_DIR, 'already-decomposed'),
        });
        expect(result.stdout).toContain('already decomposed');
      });
    });

    when('[t1] --mode apply invoked', () => {
      then('exit code is non-zero', () => {
        const result = invokeDecomposeSkill({
          behaviorName: 'feature',
          mode: 'apply',
          dir: path.join(ASSETS_DIR, 'already-decomposed'),
          planFile: '/tmp/fake-plan.json',
        });
        expect(result.exitCode).not.toEqual(0);
      });
    });
  });

  given('[case2] behavior without criteria', () => {
    when('[t0] --mode plan invoked', () => {
      then('exit code is non-zero', () => {
        const result = invokeDecomposeSkill({
          behaviorName: 'incomplete',
          mode: 'plan',
          dir: path.join(ASSETS_DIR, 'no-criteria'),
        });
        expect(result.exitCode).not.toEqual(0);
      });

      then('output mentions criteria requirement', () => {
        const result = invokeDecomposeSkill({
          behaviorName: 'incomplete',
          mode: 'plan',
          dir: path.join(ASSETS_DIR, 'no-criteria'),
        });
        expect(result.stderr).toContain('criteria');
      });
    });
  });

  given('[case3] behavior not found', () => {
    when('[t0] --mode plan invoked with unknown name', () => {
      then('exit code is non-zero', () => {
        const result = invokeDecomposeSkill({
          behaviorName: 'nonexistent',
          mode: 'plan',
          dir: path.join(ASSETS_DIR, 'already-decomposed'),
        });
        expect(result.exitCode).not.toEqual(0);
      });
    });
  });

  given('[case4] --mode apply without --plan', () => {
    when('[t0] invoked without plan file', () => {
      then('exit code is non-zero', () => {
        const result = invokeDecomposeSkill({
          behaviorName: 'large-feature',
          mode: 'apply',
          dir: path.join(ASSETS_DIR, 'needs-decomposition'),
        });
        expect(result.exitCode).not.toEqual(0);
      });

      then('output mentions --plan requirement', () => {
        const result = invokeDecomposeSkill({
          behaviorName: 'large-feature',
          mode: 'apply',
          dir: path.join(ASSETS_DIR, 'needs-decomposition'),
        });
        expect(result.stderr).toContain('--plan');
      });
    });
  });

  given('[case5] --mode apply with nonexistent plan file', () => {
    when('[t0] invoked with plan file not found', () => {
      then('exit code is non-zero', () => {
        const result = invokeDecomposeSkill({
          behaviorName: 'large-feature',
          mode: 'apply',
          dir: path.join(ASSETS_DIR, 'needs-decomposition'),
          planFile: '/tmp/nonexistent-plan-file.json',
        });
        expect(result.exitCode).not.toEqual(0);
      });

      then('output mentions plan file not found', () => {
        const result = invokeDecomposeSkill({
          behaviorName: 'large-feature',
          mode: 'apply',
          dir: path.join(ASSETS_DIR, 'needs-decomposition'),
          planFile: '/tmp/nonexistent-plan-file.json',
        });
        expect(result.stderr).toContain('not found');
      });
    });
  });

  given('[case6] --mode apply with valid plan file', () => {
    // setup temp directory with fixture copy
    let tempDir: string;
    let planFilePath: string;

    beforeEach(() => {
      // create temp directory and copy fixture
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'decompose-apply-test-'));
      const sourceDir = path.join(ASSETS_DIR, 'needs-decomposition');
      execSync(`cp -r "${sourceDir}/." "${tempDir}/"`);

      // create plan file with correct paths pointing to temp location
      const behaviorDir = path.join(
        tempDir,
        '.behavior/v2025_01_01.large-feature',
      );
      const plan = {
        behaviorSource: {
          name: 'large-feature',
          path: behaviorDir,
        },
        behaviorsProposed: [
          {
            name: 'user-auth',
            dependsOn: [],
            decomposed: {
              wish: 'enable user authentication and session management.',
              vision: null,
            },
          },
          {
            name: 'data-persistence',
            dependsOn: [],
            decomposed: {
              wish: 'enable data persistence with cache invalidation.',
              vision: null,
            },
          },
        ],
        contextAnalysis: {
          usage: {
            characters: { quantity: 10355 },
            tokens: { estimate: 2589 },
            window: { percentage: 2 },
          },
          recommendation: 'DECOMPOSE_UNNEEDED',
        },
        generatedAt: new Date().toISOString(),
      };
      planFilePath = path.join(tempDir, 'decomposition-plan.json');
      fs.writeFileSync(planFilePath, JSON.stringify(plan, null, 2));
    });

    afterEach(() => {
      // cleanup temp directory
      if (tempDir) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    when('[t0] invoked with valid plan', () => {
      then('exit code is 0', () => {
        const result = invokeDecomposeSkill({
          behaviorName: 'large-feature',
          mode: 'apply',
          dir: tempDir,
          planFile: planFilePath,
        });
        expect(result.exitCode).toEqual(0);
      });

      then('output confirms behaviors created', () => {
        const result = invokeDecomposeSkill({
          behaviorName: 'large-feature',
          mode: 'apply',
          dir: tempDir,
          planFile: planFilePath,
        });
        expect(result.stdout).toContain('user-auth');
        expect(result.stdout).toContain('data-persistence');
      });

      then('sub-behavior directories are created', () => {
        invokeDecomposeSkill({
          behaviorName: 'large-feature',
          mode: 'apply',
          dir: tempDir,
          planFile: planFilePath,
        });

        // verify sub-behavior directories exist
        const behaviorBase = path.join(tempDir, '.behavior');
        const dirs = fs.readdirSync(behaviorBase);

        // should have user-auth and data-persistence sub-behaviors
        const hasUserAuth = dirs.some((d) => d.includes('user-auth'));
        const hasDataPersistence = dirs.some((d) =>
          d.includes('data-persistence'),
        );

        expect(hasUserAuth).toBe(true);
        expect(hasDataPersistence).toBe(true);
      });

      then('sub-behavior wish files contain expected content', () => {
        invokeDecomposeSkill({
          behaviorName: 'large-feature',
          mode: 'apply',
          dir: tempDir,
          planFile: planFilePath,
        });

        // find user-auth behavior dir and check wish file
        const behaviorBase = path.join(tempDir, '.behavior');
        const dirs = fs.readdirSync(behaviorBase);
        const userAuthDir = dirs.find((d) => d.includes('user-auth'));

        expect(userAuthDir).toBeDefined();
        const wishPath = path.join(behaviorBase, userAuthDir!, '0.wish.md');
        const wishContent = fs.readFileSync(wishPath, 'utf-8');
        expect(wishContent).toContain('authentication');
      });
    });
  });
});
