import fs from 'fs';
import path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { genConsumerRepo } from '../.test/infra';

import {
  asSnapshotStable,
  runInitBehaviorSkillDirect,
  shim,
} from './.test/skill.init.behavior.utils';

/**
 * .what = get sorted list of files in behavior directory
 * .why = stable comparison for snapshots
 */
const getBehaviorFiles = (repoDir: string): string[] => {
  const behaviorRoot = path.join(repoDir, '.behavior');
  if (!fs.existsSync(behaviorRoot)) return [];

  const behaviorDirs = fs.readdirSync(behaviorRoot);
  if (behaviorDirs.length === 0) return [];

  const behaviorDir = path.join(behaviorRoot, behaviorDirs[0]!);

  const getAllFiles = (dir: string, prefix = ''): string[] => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        // skip .bind and .route directories (contain dynamic content)
        if (entry.name === '.bind' || entry.name === '.route') continue;
        files.push(...getAllFiles(path.join(dir, entry.name), relPath));
      } else {
        files.push(relPath);
      }
    }
    return files;
  };

  return getAllFiles(behaviorDir).sort();
};

describe('init.behavior.sizes', () => {
  given('[case1] --size nano', () => {
    when('[t0] init.behavior executed with --size nano', () => {
      const result = useThen('it succeeds', () => {
        const { repoDir } = genConsumerRepo({
          branchName: 'feature/size-nano-test',
        });
        const execResult = runInitBehaviorSkillDirect({
          args: '--name nano-test --size nano',
          repoDir,
        });
        return { ...execResult, repoDir };
      });

      then('exit code is 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output shows behave message', () => {
        expect(result.stdout).toContain(shim('🦫 oh, behave!'));
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('creates only nano-level files', () => {
        const files = getBehaviorFiles(result.repoDir);
        expect(files).toMatchSnapshot();
      });

      then('does NOT create criteria files', () => {
        const files = getBehaviorFiles(result.repoDir);
        expect(files.some((f) => f.includes('criteria'))).toBe(false);
      });

      then('does NOT create research files', () => {
        const files = getBehaviorFiles(result.repoDir);
        // 3.3.1.blueprint is allowed, but no 3.1.x research
        expect(files.some((f) => f.startsWith('3.1.'))).toBe(false);
      });
    });
  });

  given('[case2] --size mini', () => {
    when('[t0] init.behavior executed with --size mini', () => {
      const result = useThen('it succeeds', () => {
        const { repoDir } = genConsumerRepo({
          branchName: 'feature/size-mini-test',
        });
        const execResult = runInitBehaviorSkillDirect({
          args: '--name mini-test --size mini',
          repoDir,
        });
        return { ...execResult, repoDir };
      });

      then('exit code is 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('creates mini-level files', () => {
        const files = getBehaviorFiles(result.repoDir);
        expect(files).toMatchSnapshot();
      });

      then('includes criteria files', () => {
        const files = getBehaviorFiles(result.repoDir);
        expect(files.some((f) => f.includes('2.1.criteria'))).toBe(true);
      });

      then('includes code research files', () => {
        const files = getBehaviorFiles(result.repoDir);
        expect(files.some((f) => f.includes('3.1.3.research'))).toBe(true);
      });

      then('includes playtest', () => {
        const files = getBehaviorFiles(result.repoDir);
        expect(files.some((f) => f.includes('5.5.playtest'))).toBe(true);
      });
    });
  });

  given('[case3] --size medi (default)', () => {
    when('[t0] init.behavior executed without --size flag', () => {
      const result = useThen('it succeeds', () => {
        const { repoDir } = genConsumerRepo({
          branchName: 'feature/size-medi-default-test',
        });
        const execResult = runInitBehaviorSkillDirect({
          args: '--name medi-default-test',
          repoDir,
        });
        return { ...execResult, repoDir };
      });

      then('exit code is 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('creates medi-level files (default)', () => {
        const files = getBehaviorFiles(result.repoDir);
        expect(files).toMatchSnapshot();
      });

      then('includes reflection research', () => {
        const files = getBehaviorFiles(result.repoDir);
        expect(files.some((f) => f.includes('3.1.5.research.reflection'))).toBe(
          true,
        );
      });

      then('includes playtest', () => {
        const files = getBehaviorFiles(result.repoDir);
        expect(files.some((f) => f.includes('5.5.playtest'))).toBe(true);
      });

      then('does NOT include factory research', () => {
        const files = getBehaviorFiles(result.repoDir);
        expect(files.some((f) => f.includes('3.1.2.research'))).toBe(false);
      });
    });
  });

  given('[case4] --size mega', () => {
    when('[t0] init.behavior executed with --size mega', () => {
      const result = useThen('it succeeds', () => {
        const { repoDir } = genConsumerRepo({
          branchName: 'feature/size-mega-test',
        });
        const execResult = runInitBehaviorSkillDirect({
          args: '--name mega-test --size mega',
          repoDir,
        });
        return { ...execResult, repoDir };
      });

      then('exit code is 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('creates mega-level files', () => {
        const files = getBehaviorFiles(result.repoDir);
        expect(files).toMatchSnapshot();
      });

      then('includes factory research', () => {
        const files = getBehaviorFiles(result.repoDir);
        expect(
          files.some((f) => f.includes('3.1.2.research.external.factory')),
        ).toBe(true);
      });

      then('includes domain distillation', () => {
        const files = getBehaviorFiles(result.repoDir);
        expect(files.some((f) => f.includes('3.2.distill.domain'))).toBe(true);
      });

      then('includes factory blueprint', () => {
        const files = getBehaviorFiles(result.repoDir);
        expect(files.some((f) => f.includes('3.3.0.blueprint.factory'))).toBe(
          true,
        );
      });
    });
  });

  given('[case5] --size giga', () => {
    when('[t0] init.behavior executed with --size giga', () => {
      const gigaResult = useThen('giga succeeds', () => {
        const { repoDir } = genConsumerRepo({
          branchName: 'feature/size-giga-test',
        });
        const execResult = runInitBehaviorSkillDirect({
          args: '--name giga-test --size giga',
          repoDir,
        });
        return { ...execResult, repoDir };
      });

      const megaResult = useThen('mega succeeds for comparison', () => {
        const { repoDir } = genConsumerRepo({
          branchName: 'feature/size-mega-compare-test',
        });
        const execResult = runInitBehaviorSkillDirect({
          args: '--name mega-compare-test --size mega',
          repoDir,
        });
        return { ...execResult, repoDir };
      });

      then('exit code is 0', () => {
        expect(gigaResult.exitCode).toBe(0);
      });

      then('creates same files as mega', () => {
        const gigaFiles = getBehaviorFiles(gigaResult.repoDir);
        const megaFiles = getBehaviorFiles(megaResult.repoDir);
        expect(gigaFiles).toEqual(megaFiles);
      });
    });
  });

  given('[case6] --size composes with --guard', () => {
    when('[t0] init.behavior executed with --size mini --guard heavy', () => {
      const result = useThen('it succeeds', () => {
        const { repoDir } = genConsumerRepo({
          branchName: 'feature/size-guard-compose-test',
        });
        const execResult = runInitBehaviorSkillDirect({
          args: '--name compose-test --size mini --guard heavy',
          repoDir,
        });
        return { ...execResult, repoDir };
      });

      then('exit code is 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('creates mini-level files', () => {
        const files = getBehaviorFiles(result.repoDir);
        // should have criteria and playtest
        expect(files.some((f) => f.includes('2.1.criteria'))).toBe(true);
        expect(files.some((f) => f.includes('5.5.playtest'))).toBe(true);
      });

      then('guard file has heavy content', () => {
        const behaviorRoot = path.join(result.repoDir, '.behavior');
        const behaviorDirs = fs.readdirSync(behaviorRoot);
        const behaviorDir = path.join(behaviorRoot, behaviorDirs[0]!);
        const guardPath = path.join(behaviorDir, '1.vision.guard');
        const guardContent = fs.readFileSync(guardPath, 'utf-8');

        // heavy guards have more self-review prompts (defined via slug:)
        expect(guardContent).toContain('slug:');
        // heavy guards have many review slugs
        expect(guardContent.split('slug:').length).toBeGreaterThan(3);
      });
    });
  });

  given('[case7] invalid --size value', () => {
    when('[t0] init.behavior executed with --size invalid', () => {
      then('fails with validation error', () => {
        const { repoDir } = genConsumerRepo({
          branchName: 'feature/size-invalid-test',
        });
        const result = runInitBehaviorSkillDirect({
          args: '--name invalid-test --size invalid',
          repoDir,
        });

        expect(result.exitCode).not.toBe(0);
        expect(result.stdout).toContain('expected one of');
        expect(result.stdout).toContain('nano');
        expect(result.stdout).toContain('mega');
      });
    });
  });
});
