/**
 * .what = clamps WHERE the saturation sweep and its spend peer reach a grove
 *
 * .why  = both read through the one reach reader (work/grovework.sh) and ssh as
 *         the prober's user, over the tailnet, never through the ssm-era alias.
 *         two defects are pinned here:
 *           - the probe once handed ssh `HostName=<host> <port>` — host and port
 *             fused — so every grove read `💥 unreadable` with ssh's own
 *             `keyword hostname extra arguments` (measured 2026-11-13, live)
 *           - the prober rode whichever entry sorted first, which is `.ground`,
 *             where every supervisor reach rides camper (fulcrum F03)
 *
 * .how  = real ssh against 127.0.0.2:1 — a loopback address with no listener,
 *         so ssh's own `Connection refused` comes back at once with no fleet
 *         in reach (rule.require.hermetic-tests). 127.0.0.2 is not one of the
 *         relic hosts, so the reach reader keeps it as the host.
 *
 * .note = a PART of the `git.grove.saturation` suite; shared fixtures live in
 *         git.grove.saturation.harness.ts.
 */
import { spawnSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../.test/tempDirs';
import { PATH_SAT, PATH_SPEND } from './git.grove.saturation.harness';

const ROW_CAMPER = {
  name: 'grove-sandpine-v20260901',
  sshAlias: 'grove-sandpine-v20260901',
  user: 'camper',
  host: '127.0.0.2',
  port: 1,
  exid: 'grove-sandpine-v20260901',
  account: '000000000000',
};
const ROW_GROUND = {
  ...ROW_CAMPER,
  name: 'grove-sandpine-v20260901.ground',
  sshAlias: 'grove-sandpine-v20260901.ground',
  user: 'ground',
};
const ROW_HETZNER = {
  name: 'grove-sandpine-hetzner-v20261022',
  host: '127.0.0.2',
  port: 2,
};
/** a tailnet name under `.invalid` (rfc 6761): it never names a box, so it fails at once with no dns in reach */
const ROW_HETZNER_UNKNOWN = {
  name: 'grove-sandpine-hetzner-v20261023',
  host: 'grove-sandpine-hetzner-v20261023.invalid',
};

/**
 * .what = an ssh that logs its argv, then runs the probe payload (its last arg)
 *         on this box — so a sweep reads a real load through the remote arm
 * .why  = the grove's sshd is the one part not in reach of a hermetic test; the
 *         payload, the reach argv, and the render are all the real ones
 */
const STUB_SSH_LOCAL = `#!/usr/bin/env bash
echo "ssh $*" >> "$STUB_LOG"
exec bash -c "\${@: -1}"
`;

/** .what = run one skill against a temp forest that holds the given rows */
const runSkill = (input: {
  path: string;
  rows: { name: string }[];
  args: string[];
  sshLocal?: boolean;
}) => {
  const forest = tempDirs.genOne({ slug: 'sat-reach' });
  const bin = join(forest, 'bin');
  const stubLog = join(forest, 'stub.log');
  mkdirSync(bin, { recursive: true });
  if (input.sshLocal)
    writeFileSync(join(bin, 'ssh'), STUB_SSH_LOCAL, { mode: 0o755 });
  writeFileSync(stubLog, '');
  mkdirSync(join(forest, 'groves'), { recursive: true });
  for (const row of input.rows)
    writeFileSync(
      join(forest, 'groves', `${row.name}.json`),
      JSON.stringify(row),
    );
  // a temp HOME whose alias for the hetzner row is converged, as after a wake:
  // the suite clamps the tailnet cure, never the box's own ~/.ssh/config
  const home = join(forest, 'home');
  mkdirSync(join(home, '.ssh'), { recursive: true });
  writeFileSync(
    join(home, '.ssh', 'config'),
    `Host ${ROW_HETZNER.name}\n  HostName ${ROW_HETZNER.host}\n  Port ${ROW_HETZNER.port}\n  User camper\n`,
  );
  const out = spawnSync('bash', [input.path, ...input.args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_FOREST_DIR: forest,
      HOME: home,
      STUB_LOG: stubLog,
      PATH: `${bin}:${process.env.PATH}`,
    },
    timeout: 60_000,
  });
  return {
    stdout: out.stdout ?? '',
    stderr: out.stderr ?? '',
    exit: out.status,
    calls: readFileSync(stubLog, 'utf8').split('\n').filter(Boolean),
  };
};

/** .what = a render with its volatile bytes masked: temp paths and clock values */
const asSnap = (text: string): string =>
  text
    .replace(/\S*\/sat-reach[^\s/]*/g, '$FOREST_TMP')
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/g, '$ISO_TIME')
    .replace(/\b\d{2}:\d{2}:\d{2}\b/g, '$CLOCK');

describe('git.grove.saturation.reach', () => {
  afterAll(() => tempDirs.delAll());

  given('[case1] one ec2 grove registered twice: camper, and .ground', () => {
    when('[t0] the sweep reads it', () => {
      const run = useBeforeAll(async () =>
        runSkill({
          path: PATH_SAT,
          rows: [ROW_GROUND, ROW_CAMPER],
          args: ['--only', 'grove-sandpine-v20260901', '--timeout', '15'],
        }),
      );

      then(
        '🔴 ssh is handed a well-formed host — never host and port fused',
        () => {
          expect(run.stdout).not.toContain('extra arguments at end of line');
          expect(run.stdout).not.toContain('💥 unreadable');
        },
      );

      then(
        '🔴 a refused connect reads as refused — the box is up, so the cure is sshd and its port, never a wake',
        () => {
          expect(run.stdout).toContain('🔴 refused');
          expect(run.stdout).toContain('is sshd up there, and is 1 its port?');
          expect(run.stdout).not.toContain('git.grove.wake');
          expect(run.stdout).not.toContain('tailscale');
        },
      );

      then('the refused render reads as a snapshot', () => {
        expect(asSnap(run.stdout)).toMatchSnapshot();
      });
    });

    when(
      '[t1] the whole forest is swept, so both entries fold onto one grove',
      () => {
        const run = useBeforeAll(async () =>
          runSkill({
            path: PATH_SAT,
            rows: [ROW_GROUND, ROW_CAMPER],
            args: ['--timeout', '15'],
          }),
        );

        then('one grove is reported, under both its entry names', () => {
          expect(run.stdout).toContain(
            '🌳 grove-sandpine-v20260901.ground + grove-sandpine-v20260901',
          );
        });

        then('🔴 the probe rides the camper entry, never .ground (F03)', () => {
          expect(run.stdout).toContain(
            'git grove set grove-sandpine-v20260901 --at',
          );
          expect(run.stdout).not.toContain(
            'git grove set grove-sandpine-v20260901.ground',
          );
        });

        then('the folded render reads as a snapshot', () => {
          // a whole-forest sweep reads this box too (`🌳 local`); its live load
          // never holds twice, so the snapshot keeps only the folded grove
          const folded = run.stdout.split(/\n\s*🌳 local /)[0] ?? '';
          expect(folded).toContain('🌳 grove-sandpine-v20260901.ground');
          expect(asSnap(folded)).toMatchSnapshot();
        });
      },
    );
  });

  given('[case2] a grove with no aws lever (hetzner)', () => {
    when('[t0] the sweep reads it and the box refuses the connect', () => {
      const run = useBeforeAll(async () =>
        runSkill({
          path: PATH_SAT,
          rows: [ROW_HETZNER],
          args: [
            '--only',
            'grove-sandpine-hetzner-v20261022',
            '--timeout',
            '15',
          ],
        }),
      );

      then(
        '🔴 a refusal proves the tailnet carried it: sshd and its port, never the tailnet, never the wake (c34)',
        () => {
          expect(run.stdout).toContain('🔴 refused');
          expect(run.stdout).toContain('is sshd up there, and is 2 its port?');
          expect(run.stdout).not.toContain('tailscale');
          expect(run.stdout).not.toContain('git.grove.wake');
        },
      );

      then('the refused render reads as a snapshot', () => {
        expect(asSnap(run.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] the sweep reads it and its tailnet name is unknown', () => {
      const run = useBeforeAll(async () =>
        runSkill({
          path: PATH_SAT,
          rows: [ROW_HETZNER_UNKNOWN],
          args: [
            '--only',
            'grove-sandpine-hetzner-v20261023',
            '--timeout',
            '15',
          ],
        }),
      );

      then('🔴 its cure names the tailnet, never the wake (c26)', () => {
        expect(run.stdout).toContain('💤 asleep');
        expect(run.stdout).toContain('tailscale status');
        expect(run.stdout).toContain(
          'tailscale ping grove-sandpine-hetzner-v20261023.invalid',
        );
        expect(run.stdout).not.toContain('git.grove.wake');
      });

      then('the asleep render reads as a snapshot', () => {
        expect(asSnap(run.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] the sweep reads it and its sshd answers (c25)', () => {
      const run = useBeforeAll(async () =>
        runSkill({
          path: PATH_SAT,
          rows: [ROW_HETZNER],
          args: [
            '--only',
            'grove-sandpine-hetzner-v20261022',
            '--timeout',
            '30',
          ],
          sshLocal: true,
        }),
      );

      then('🔴 the probe rides camper at the row host, over ssh', () => {
        const probes = run.calls.filter((c) => c.includes('camper@127.0.0.2'));
        expect(probes).toHaveLength(1);
        expect(probes[0]).toContain('-p 2');
      });

      then(
        'it reads the real load, under the row name and the box it reached',
        () => {
          // the header names the box by the hostname IT reports, so the stub's box
          expect(run.stdout).toMatch(
            /🌳 grove-sandpine-hetzner-v20261022 {2}· {2}\S+ {2}· {2}\d+ cpu · /,
          );
          expect(run.stdout).toMatch(/ cpu {4}load \d/);
        },
      );

      then('no reach failure is claimed on a box that answered', () => {
        expect(run.stdout).not.toContain('🔴 refused');
        expect(run.stdout).not.toContain('💤 asleep');
        expect(run.stdout).not.toContain('💥 unreadable');
        expect(run.stdout).not.toContain('git.grove.wake');
      });
    });
  });

  given('[case3] the spend peer reads the same pair', () => {
    when('[t0] spend reads it', () => {
      const run = useBeforeAll(async () =>
        runSkill({
          path: PATH_SPEND,
          rows: [ROW_GROUND, ROW_CAMPER],
          args: ['--only', 'grove-sandpine-v20260901', '--timeout', '15'],
        }),
      );

      then('🔴 ssh is handed a well-formed host there too', () => {
        expect(`${run.stdout}${run.stderr}`).not.toContain(
          'extra arguments at end of line',
        );
      });

      then(
        'its refusal reads with the cure the sweep and the list share',
        () => {
          expect(run.stdout).toContain('🔴 refused');
          expect(run.stdout).toContain('is sshd up there, and is 1 its port?');
          expect(run.stdout).not.toContain('git.grove.wake');
        },
      );

      then('the spend render reads as a snapshot', () => {
        expect(asSnap(run.stdout)).toMatchSnapshot();
      });
    });
  });
});
