/**
 * .what = clamps the reach of a grove row, and the cure for one that did not answer
 *
 * .why  = wake, list, saturation, spend, and every no-answer cure ask
 *         grovework.sh where a grove answers. a wrong read here sends every
 *         one of them to the wrong host at once, so the rules are pinned per row
 *         shape: tailnet row, ssm-tunnel relic, `.ground` seat, hetzner row
 *
 * .note = it writes rows to a temp forest dir and spawns bash, so it is an
 *         integration test (rule.forbid.unit.remote-boundaries)
 */
import { spawnSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';

const PATH_GROVEWORK = join(__dirname, 'grovework.sh');

/**
 * .what = run a bash body with grovework.sh sourced, against one forest dir
 * .note = HOME is a temp dir, so the alias read sees only `sshcfg` (never the
 *         ~/.ssh/config of the box that runs the suite)
 */
const runGrovework = (input: {
  forest: string;
  body: string;
  sshcfg?: string;
}) => {
  const home = tempDirs.genOne({ slug: 'grovework-home' });
  mkdirSync(join(home, '.ssh'), { recursive: true });
  if (input.sshcfg !== undefined)
    writeFileSync(join(home, '.ssh', 'config'), input.sshcfg);
  const run = spawnSync(
    'bash',
    ['-c', `set -euo pipefail\nsource '${PATH_GROVEWORK}'\n${input.body}`],
    {
      encoding: 'utf8',
      env: { ...process.env, GIT_FOREST_DIR: input.forest, HOME: home },
      timeout: 30_000,
    },
  );
  return {
    stdout: run.stdout ?? '',
    stderr: run.stderr ?? '',
    exit: run.status,
  };
};

/** .what = a temp forest that holds the given rows */
const genForest = (input: { rows: { name: string }[] }) => {
  const forest = tempDirs.genOne({ slug: 'grovework-forest' });
  mkdirSync(join(forest, 'groves'), { recursive: true });
  for (const row of input.rows)
    writeFileSync(
      join(forest, 'groves', `${row.name}.json`),
      JSON.stringify(row),
    );
  return forest;
};

const ROW_EC2_RELIC = {
  name: 'grove-sandpine-v20260901',
  sshAlias: 'grove-sandpine-v20260901',
  user: 'camper',
  host: 'localhost',
  port: 36903,
  exid: 'grove-sandpine-v20260901',
  account: '000000000000',
  type: 'ec2',
};
const ROW_EC2_GROUND_RELIC = {
  ...ROW_EC2_RELIC,
  name: 'grove-sandpine-v20260901.ground',
  sshAlias: 'grove-sandpine-v20260901.ground',
  user: 'ground',
};
const ROW_HETZNER = {
  name: 'grove-sandpine-hetzner-v20261022',
  host: 'grove-sandpine-hetzner-v20261022-1',
};
const SSHCFG_HETZNER_CONVERGED = [
  'Host grove-sandpine-hetzner-v20261022',
  '  HostName grove-sandpine-hetzner-v20261022-1',
  '  Port 22',
  '  User camper',
  '',
].join('\n');
/** .what = the vision's case=1 shape: name only, so the alias equals its host */
const ROW_HETZNER_SAMENAME = { name: 'grove-sandpine-hetzner-v20261023' };
const SSHCFG_HETZNER_HOSTNAME_ONLY = [
  'Host grove-sandpine-hetzner-v20261022',
  '  HostName grove-sandpine-hetzner-v20261022-1',
  '',
].join('\n');
const ROW_EC2_TAILNET = {
  name: 'grove-sandpine-v20261101',
  host: '100.113.22.92',
  port: 2222,
  user: 'surfer',
  account: '000000000000',
};
const ROW_LOOPBACK_V4 = {
  name: 'grove-sandpine-v4',
  host: '127.0.0.1',
  port: 36901,
};
const ROW_LOOPBACK_V6 = { name: 'grove-sandpine-v6', host: '::1', port: 36902 };
const ROW_HOSTLESS_PORT = { name: 'grove-sandpine-sshd2222', port: 2222 };

const TEST_CASES = [
  {
    description: 'an ssm-tunnel relic reads its exid on port 22, power aws',
    row: ROW_EC2_RELIC,
    expect:
      'aws\tgrove-sandpine-v20260901\t22\tcamper\tgrove-sandpine-v20260901\tgrove-sandpine-v20260901',
  },
  {
    description: 'a .ground relic reads the exid as host, never its seat name',
    row: ROW_EC2_GROUND_RELIC,
    expect:
      'aws\tgrove-sandpine-v20260901\t22\tground\tgrove-sandpine-v20260901.ground\tgrove-sandpine-v20260901.ground',
  },
  {
    description:
      'a hetzner row pins its drifted tailnet name, as camper on 22, power none',
    row: ROW_HETZNER,
    expect:
      'none\tgrove-sandpine-hetzner-v20261022-1\t22\tcamper\tgrove-sandpine-hetzner-v20261022\tgrove-sandpine-hetzner-v20261022',
  },
  {
    description: 'a tailnet row keeps its own host, port, and user',
    row: ROW_EC2_TAILNET,
    expect:
      'aws\t100.113.22.92\t2222\tsurfer\tgrove-sandpine-v20261101\tgrove-sandpine-v20261101',
  },
  {
    description: 'a 127.0.0.1 host is a relic too',
    row: ROW_LOOPBACK_V4,
    expect:
      'none\tgrove-sandpine-v4\t22\tcamper\tgrove-sandpine-v4\tgrove-sandpine-v4',
  },
  {
    description: 'a ::1 host is a relic too',
    row: ROW_LOOPBACK_V6,
    expect:
      'none\tgrove-sandpine-v6\t22\tcamper\tgrove-sandpine-v6\tgrove-sandpine-v6',
  },
  {
    description:
      'a row with no host keeps its own port — no ssm-era row lacked a host',
    row: ROW_HOSTLESS_PORT,
    expect:
      'none\tgrove-sandpine-sshd2222\t2222\tcamper\tgrove-sandpine-sshd2222\tgrove-sandpine-sshd2222',
  },
  {
    description:
      'empty-string fields fall back as absent ones do, so no column shifts',
    row: {
      name: 'grove-sandpine-blanks',
      host: '',
      exid: '',
      user: '',
      sshAlias: '',
      port: '',
      account: '',
    },
    expect:
      'none\tgrove-sandpine-blanks\t22\tcamper\tgrove-sandpine-blanks\tgrove-sandpine-blanks',
  },
];

const ROWS_REFUSED = [
  {
    description:
      '🔴 type ec2 with no account is refused, never read as power none',
    row: { name: 'grove-sandpine-ec2-noacct', type: 'ec2', host: 'h1' },
    cause: 'type ec2, but no account',
    fix: 'git grove set <grove> --account',
  },
  {
    description:
      '🔴 a nat with no account is refused, never a nat dropped in silence',
    row: { name: 'grove-sandpine-nat-noacct', nat: 'i-0nat', host: 'h1' },
    cause: 'nat, but no account',
    fix: 'git grove set <grove> --account',
  },
  {
    description:
      'a user that starts with "-" is refused (it would be an ssh option)',
    row: {
      name: 'grove-sandpine-dashuser',
      host: 'h1',
      user: '-oProxyCommand=x',
    },
    cause: "user '-oProxyCommand=x'",
    fix: 'git grove set <grove> --at',
  },
  {
    description: 'a host with a byte outside its grammar is refused',
    row: { name: 'grove-sandpine-badhost', host: 'h1\nProxyCommand x' },
    cause: 'host',
    fix: 'git grove set <grove> --at',
  },
  {
    description: 'a port that is not a number is refused',
    row: { name: 'grove-sandpine-badport', host: 'h1', port: '22x' },
    cause: "port '22x' is not a number",
    fix: 'git grove set <grove> --at',
  },
];

describe('grovework', () => {
  afterAll(() => tempDirs.delAll());

  given('[case1] a row of each shape', () => {
    const scene = useBeforeAll(async () => ({
      forest: genForest({ rows: TEST_CASES.map((c) => c.row) }),
    }));

    when('[t0] the reach of each row is read', () => {
      TEST_CASES.map((thisCase) =>
        then(thisCase.description, () => {
          const run = runGrovework({
            forest: scene.forest,
            body: `__grove_reach_of "$(__grove_rows_dir)/${thisCase.row.name}.json"`,
          });
          expect(run.exit).toEqual(0);
          expect(run.stdout.trim()).toEqual(thisCase.expect);
        }),
      );
    });
  });

  given('[case2] the ssh options of a reach probe', () => {
    when('[t0] they are built for a host and port', () => {
      const run = useBeforeAll(async () =>
        runGrovework({
          forest: genForest({ rows: [] }),
          body: `__grove_reach_ssh_opts host=grove-sandpine-v20260901 port=22 wait=5\nprintf '%s\\n' "\${GROVE_REACH_SSH_OPTS[@]}"`,
        }),
      );

      then(
        '🔴 HostName is pinned, so a stale ssm-era alias cannot shadow it',
        () => {
          expect(run.stdout).toContain('HostName=grove-sandpine-v20260901');
        },
      );

      then(
        'a new grove key is accepted on first contact, never a changed one',
        () => {
          expect(run.stdout).toContain('StrictHostKeyChecking=accept-new');
          expect(run.stdout).toContain('BatchMode=yes');
        },
      );

      then("the connect timeout and port are the caller's", () => {
        expect(run.stdout.split('\n')).toEqual(
          expect.arrayContaining(['ConnectTimeout=5', '-p', '22']),
        );
      });
    });
  });

  given('[case3] a grove that did not answer', () => {
    const scene = useBeforeAll(async () => ({
      forest: genForest({
        rows: [
          ROW_EC2_RELIC,
          ROW_EC2_GROUND_RELIC,
          ROW_HETZNER,
          ROW_HETZNER_SAMENAME,
        ],
      }),
    }));

    when('[t0] its row has no power lever (hetzner), alias on disk', () => {
      const run = useBeforeAll(async () =>
        runGrovework({
          forest: scene.forest,
          body: '__grove_unreached_cure grove-sandpine-hetzner-v20261022',
          sshcfg: SSHCFG_HETZNER_CONVERGED,
        }),
      );

      then('🔴 the cure names the tailnet, never the wake', () => {
        expect(run.stdout).toContain('tailscale status');
        expect(run.stdout).toContain(
          'tailscale ping grove-sandpine-hetzner-v20261022-1',
        );
        expect(run.stdout).not.toContain('git.grove.wake');
        expect(run.stdout).not.toContain('ssm');
      });

      then('the cure reads as a snapshot', () => {
        expect(run.stdout).toMatchSnapshot();
      });
    });

    when('[t1] its row powers up through aws (ec2)', () => {
      const run = useBeforeAll(async () =>
        runGrovework({
          forest: scene.forest,
          body: '__grove_unreached_cure grove-sandpine-v20260901',
        }),
      );

      then('the cure is the wake', () => {
        expect(run.stdout.trim()).toEqual(
          'wake it — rhx git.grove.wake grove-sandpine-v20260901',
        );
      });
    });

    when('[t2] the alias is a .ground seat', () => {
      const run = useBeforeAll(async () =>
        runGrovework({
          forest: scene.forest,
          body: '__grove_unreached_cure grove-sandpine-v20260901.ground',
        }),
      );

      then('the cure wakes that row', () => {
        expect(run.stdout.trim()).toEqual(
          'wake it — rhx git.grove.wake grove-sandpine-v20260901.ground',
        );
      });
    });

    when(
      '[t4] its row has no power lever, and this machine never woke it (no alias)',
      () => {
        const run = useBeforeAll(async () =>
          runGrovework({
            forest: scene.forest,
            body: '__grove_unreached_cure grove-sandpine-hetzner-v20261022',
          }),
        );

        then(
          '🔴 the cure is the alias write first — the one step that fixes it — and says it touches no aws',
          () => {
            expect(run.stdout.trim()).toEqual(
              'write its ssh alias first — rhx git.grove.wake grove-sandpine-hetzner-v20261022 (power none: it touches no aws), then retry',
            );
          },
        );
      },
    );

    when(
      '[t5] its row is name-only, so the alias equals its host, and no alias is on disk',
      () => {
        const run = useBeforeAll(async () =>
          runGrovework({
            forest: scene.forest,
            body: '__grove_unreached_cure grove-sandpine-hetzner-v20261023',
          }),
        );

        then(
          '🔴 the cure is still the alias write: ssh would dial that name as the local user, never camper',
          () => {
            expect(run.stdout.trim()).toEqual(
              'write its ssh alias first — rhx git.grove.wake grove-sandpine-hetzner-v20261023 (power none: it touches no aws), then retry',
            );
          },
        );
      },
    );

    when(
      '[t6] an alias on disk holds the tailnet host, yet no User camper',
      () => {
        const run = useBeforeAll(async () =>
          runGrovework({
            forest: scene.forest,
            body: '__grove_unreached_cure grove-sandpine-hetzner-v20261022',
            sshcfg: SSHCFG_HETZNER_HOSTNAME_ONLY,
          }),
        );

        then(
          'the alias reads as not converged: host alone is not the reach, so the cure is the alias write',
          () => {
            expect(run.stdout.trim()).toContain(
              'write its ssh alias first — rhx git.grove.wake grove-sandpine-hetzner-v20261022',
            );
          },
        );
      },
    );

    when('[t3] no row holds the alias', () => {
      const run = useBeforeAll(async () =>
        runGrovework({
          forest: scene.forest,
          body: '__grove_unreached_cure grove-sandpine-absent',
        }),
      );

      then('the cure is the wake, which names the absent row itself', () => {
        expect(run.stdout.trim()).toEqual(
          'wake it — rhx git.grove.wake grove-sandpine-absent',
        );
      });
    });
  });

  given('[case4] a row that is not json', () => {
    const scene = useBeforeAll(async () => {
      const forest = genForest({ rows: [] });
      writeFileSync(
        join(forest, 'groves', 'grove-sandpine-corrupt.json'),
        '{ "name": "grove-sandpine-corrupt", ',
      );
      return { forest };
    });

    when('[t0] its reach is read', () => {
      const run = useBeforeAll(async () =>
        runGrovework({
          forest: scene.forest,
          body: '__grove_reach_of "$(__grove_rows_dir)/grove-sandpine-corrupt.json"',
        }),
      );

      then('🔴 it fails loud, exit 2, and prints no reach', () => {
        expect(run.exit).toEqual(2);
        expect(run.stdout).toEqual('');
      });

      then('stderr names the row and the fix', () => {
        expect(run.stderr).toContain('grove row unreadable');
        expect(run.stderr).toContain('grove-sandpine-corrupt.json');
        expect(run.stderr).toContain('git grove set');
      });

      then('the refusal reads as a snapshot', () => {
        expect(
          run.stderr.split(scene.forest).join('$FOREST_TMP'),
        ).toMatchSnapshot();
      });
    });

    when('[t1] its cure is asked for', () => {
      const run = useBeforeAll(async () =>
        runGrovework({
          forest: scene.forest,
          body: '__grove_unreached_cure grove-sandpine-corrupt',
        }),
      );

      then('the cure still answers, with the alias as given', () => {
        expect(run.exit).toEqual(0);
        expect(run.stdout.trim()).toEqual(
          'wake it — rhx git.grove.wake grove-sandpine-corrupt',
        );
      });
    });
  });

  given(
    '[case5] a row that is json, yet contradicts itself or its grammar',
    () => {
      const scene = useBeforeAll(async () => ({
        forest: genForest({ rows: ROWS_REFUSED.map((c) => c.row) }),
      }));

      when('[t0] the reach of each row is read', () => {
        ROWS_REFUSED.map((thisCase) =>
          then(thisCase.description, () => {
            const run = runGrovework({
              forest: scene.forest,
              body: `__grove_reach_of "$(__grove_rows_dir)/${thisCase.row.name}.json"`,
            });
            expect(run.exit).toEqual(2);
            expect(run.stdout).toEqual('');
            expect(run.stderr).toContain(
              '✋ ConstraintError: grove row unreadable',
            );
            expect(run.stderr).toContain(thisCase.cause);
            expect(run.stderr).toContain(thisCase.fix);
            // the whole refusal tree, with the temp forest masked
            expect(
              run.stderr.split(scene.forest).join('$FOREST_TMP'),
            ).toMatchSnapshot();
          }),
        );
      });
    },
  );
});
