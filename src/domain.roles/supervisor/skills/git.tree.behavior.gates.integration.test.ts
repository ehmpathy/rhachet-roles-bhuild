/**
 * .what = the four sprout gates of `git.tree.behavior`, run at the entrypoint
 *
 * .why  = the lift gave this verb REACH — it now resolves on any box with the
 *         package installed. reach must not cost refusal: each gate that held
 *         in the origin repo must still hold where the verb now resolves
 *         (vision case=1, `[t6]`–`[t9]`).
 *
 *         the feat gate's lib half is clamped in crewwork.grove `[case30]`. this
 *         suite grades what that one cannot: the ENTRYPOINT — the flag parse,
 *         the gate order, and the exit code a caller actually meets.
 *
 * .note = every gate refuses before the verb resolves a grove or touches git,
 *         so the suite runs hermetic: no network, no worktree, no duct
 */
import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../.test/tempDirs';

const PATH_SKILL = join(__dirname, 'git.tree.behavior.sh');

afterAll(() => tempDirs.delAll());

/**
 * .what = runs the entrypoint once and captures its exit code and stderr
 * .why  = each gate is graded on the same two observables, gathered once
 *         (rule.forbid.redundant-expensive-operations)
 */
const runSprout = (input: {
  args: string[];
  cwd: string;
}): { exit: number; stderr: string } => {
  try {
    execFileSync('bash', [PATH_SKILL, ...input.args], {
      cwd: input.cwd,
      encoding: 'utf-8',
      timeout: 20000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1' },
    });
    return { exit: 0, stderr: '' };
  } catch (thrown: unknown) {
    const said = thrown as {
      stderr?: Buffer | string;
      status?: number | null;
      signal?: string | null;
    };
    return {
      // a timeout kills by signal and leaves status null — surface it as a
      // distinct code rather than let it read as a clean refusal
      exit: said.signal ? 124 : (said.status ?? 1),
      stderr: (said.stderr ?? '').toString(),
    };
  }
};

/**
 * .what = a scratch dir that holds a real wish file
 * .why  = the wish gate must be the ONE gate a case trips — so every other
 *         case passes a wish that exists, and cannot trip it by accident
 */
const genSproutScene = (): { cwd: string; wish: string } => {
  const cwd = tempDirs.genOne({ slug: 'git-tree-behavior-gates' });
  writeFileSync(join(cwd, 'w.md'), 'wish = fix the queue\n');
  return { cwd, wish: './w.md' };
};

describe('git.tree.behavior', () => {
  given('[case1] a sprout with no --wish', () => {
    when('[t0] the supervisor omits the wish', () => {
      const result = useBeforeAll(async () =>
        runSprout({
          cwd: genSproutScene().cwd,
          args: [
            '--into',
            'sandpine/svc-coaches',
            '--name',
            'beav/fix-queue',
            '--size',
            'nano',
          ],
        }),
      );

      then('🔴 it refuses with exit 2 — the caller must fix it', () => {
        expect(result.exit).toEqual(2);
      });

      then('and the refusal names rule.require.behaviors-over-adhoc', () => {
        expect(result.stderr).toContain('--wish required');
        expect(result.stderr).toContain('rule.require.behaviors-over-adhoc');
      });
    });

    when('[t1] the wish path names no file', () => {
      const result = useBeforeAll(async () =>
        runSprout({
          cwd: genSproutScene().cwd,
          args: [
            '--into',
            'sandpine/svc-coaches',
            '--name',
            'beav/fix-queue',
            '--size',
            'nano',
            '--wish',
            './absent.md',
          ],
        }),
      );

      then('🔴 it refuses with exit 2, and names the absent path', () => {
        expect(result.exit).toEqual(2);
        expect(result.stderr).toContain('absent.md');
      });
    });
  });

  given('[case2] a sprout above nano', () => {
    when('[t0] --size is mini and no --size-why rides along', () => {
      const result = useBeforeAll(async () => {
        const scene = genSproutScene();
        return runSprout({
          cwd: scene.cwd,
          args: [
            '--into',
            'sandpine/svc-coaches',
            '--name',
            'beav/fix-queue',
            '--size',
            'mini',
            '--wish',
            scene.wish,
          ],
        });
      });

      then('🔴 it refuses with exit 2', () => {
        expect(result.exit).toEqual(2);
      });

      then('and the refusal names the flag and the rule', () => {
        expect(result.stderr).toContain('--size-why');
        expect(result.stderr).toContain(
          'rule.require.confirm-behavior-size-above-nano',
        );
      });
    });
  });

  given('[case3] a sprout whose name claims a feat', () => {
    when('[t0] --name is beav/feat-* and no --feat-why rides along', () => {
      const result = useBeforeAll(async () => {
        const scene = genSproutScene();
        return runSprout({
          cwd: scene.cwd,
          args: [
            '--into',
            'sandpine/svc-coaches',
            '--name',
            'beav/feat-queue',
            '--size',
            'nano',
            '--wish',
            scene.wish,
          ],
        });
      });

      then('🔴 it refuses with exit 2 at the entrypoint', () => {
        expect(result.exit).toEqual(2);
      });

      then('and the refusal names the way out', () => {
        expect(result.stderr).toContain('--feat-why');
        expect(result.stderr).toContain('--name beav/fix-queue');
      });
    });
  });

  given('[case4] a sprout whose name holds declapract', () => {
    when('[t0] the name names a declapract upgrade', () => {
      const result = useBeforeAll(async () => {
        const scene = genSproutScene();
        return runSprout({
          cwd: scene.cwd,
          args: [
            '--into',
            'sandpine/svc-coaches',
            '--name',
            'beav/feat-declapract-upgrade',
            '--size',
            'nano',
            '--wish',
            scene.wish,
          ],
        });
      });

      then('🔴 it refuses with exit 2', () => {
        expect(result.exit).toEqual(2);
      });

      then('and the refusal names the paved verb for that work', () => {
        expect(result.stderr).toContain('boots its OWN route');
        expect(result.stderr).toContain('rhx git.tree.declapract.upgrade');
      });

      // the declapract refusal is about the WHOLE command; the feat gate is
      // about one flag on it. a caller told first to justify a feat composes a
      // reason for a verb that was never the right one
      then('and it fires AHEAD of the feat gate', () => {
        expect(result.stderr).not.toContain('--feat-why');
      });
    });
  });
});
