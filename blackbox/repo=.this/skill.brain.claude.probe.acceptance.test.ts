import { spawnSync } from 'child_process';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = the deterministic arms of the repo-local `brain.claude.probe` skill
 * .why  = its help and its three refusals are a cli contract, snapped so a change to an arm or to
 *         the header fences the help slice reads shows in review
 *
 * .note = the positive arm (one paid api call per brain id) is not run here; it is an operator's
 *         diagnosis, run by hand with the key unlocked
 */
const SKILL_PATH = path.join(
  __dirname,
  '../../.agent/repo=.this/role=any/skills/brain.claude.probe.sh',
);

const runProbe = (input: {
  args: string[];
}): { code: number | null; stdout: string; stderr: string } => {
  const result = spawnSync('bash', [SKILL_PATH, ...input.args]);

  // trim the end, so a snap closes on its last text row, as the journey snaps do
  return {
    code: result.status,
    stdout: result.stdout.toString().trimEnd(),
    stderr: result.stderr.toString().trimEnd(),
  };
};

describe('skill.brain.claude.probe', () => {
  given('[case1] the probe asked for help', () => {
    when('[t0] --help is passed', () => {
      const result = useBeforeAll(async () => runProbe({ args: ['--help'] }));

      then('it exits 0 and prints the header, with its usage line', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('.what = ask the pinned claude cli');
        expect(result.stdout).toContain('usage:');
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] the probe called with no brain id', () => {
    when('[t0] it runs with no args', () => {
      const result = useBeforeAll(async () => runProbe({ args: [] }));

      then('it refuses with exit 2 and names the fix', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain('name at least one brain id');
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case3] the probe called with a flag it does not declare', () => {
    when('[t0] --verbose is passed', () => {
      const result = useBeforeAll(async () =>
        runProbe({ args: ['--verbose', 'claude-sonnet-5-5[1m]'] }),
      );

      then('it refuses with exit 2 and names the flag', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain("unknown flag '--verbose'");
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case4] the probe called with a rhachet arg and no value', () => {
    when('[t0] --repo is passed last', () => {
      const result = useBeforeAll(async () => runProbe({ args: ['--repo'] }));

      then('it refuses with exit 2 and names the arg', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain('--repo needs a value');
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });
});
