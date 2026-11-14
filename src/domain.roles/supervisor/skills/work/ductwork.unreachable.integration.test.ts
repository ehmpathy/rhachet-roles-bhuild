/**
 * .what = clamps what a crew or duct verb SAYS when ssh cannot reach a grove
 *
 * .why  = `__duct_say_unreachable` is the render a human meets first on any
 *         crew verb against a grove that did not answer. it matches ssh's own
 *         words to one cause and names one fix — and for a grove with no aws
 *         lever, that fix must be the tailnet, or the alias write when this
 *         machine never woke it, never a bare wake. the source-text clamps in
 *         work.surface read its words; this suite reads what it RENDERS
 *
 * .how  = hermetic: a temp HOME holds the ssh config, a temp forest holds the
 *         row. the function reads only those and its two inputs
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import { genSocket, SOCKETS_MADE } from './ductwork.harness';
import { delTmuxServer, hasTmux, runDuct } from './work.harness';

beforeAll(() => {
  if (!hasTmux())
    throw new Error(
      'tmux is required for the ductwork clamps. fix: sudo apt install tmux',
    );
});

afterAll(() => {
  for (const socket of SOCKETS_MADE) delTmuxServer({ socket });
  tempDirs.delAll();
});

const ROW_HETZNER = {
  name: 'grove-sandpine-hetzner-v20261022',
  host: 'grove-sandpine-hetzner-v20261022-1',
};
const SSHCFG_CONVERGED = `Host ${ROW_HETZNER.name}\n  HostName ${ROW_HETZNER.host}\n  Port 22\n  User camper\n`;

/** an ec2 row from the ssm era, and the relic alias every extant laptop holds for it */
const ROW_EC2_RELIC = {
  name: 'grove-sandpine-v20260901',
  host: 'localhost',
  port: 36903,
  exid: 'grove-sandpine-v20260901',
  account: '000000000000',
};
const SSHCFG_RELIC = `Host ${ROW_EC2_RELIC.name}\n  HostName localhost\n  Port 36903\n  User camper\n`;

/** .what = render the unreachable message for one ssh error, against one row (hetzner by default) */
const runSay = (input: {
  said: string;
  sshcfg: string | null;
  row?: { name: string };
}) => {
  const row = input.row ?? ROW_HETZNER;
  const root = tempDirs.genOne({ slug: 'duct-unreachable' });
  const home = join(root, 'home');
  const forest = join(root, 'forest');
  mkdirSync(join(home, '.ssh'), { recursive: true });
  mkdirSync(join(forest, 'groves'), { recursive: true });
  writeFileSync(
    join(forest, 'groves', `${row.name}.json`),
    JSON.stringify(row),
  );
  if (input.sshcfg !== null)
    writeFileSync(join(home, '.ssh', 'config'), input.sshcfg);
  const out = runDuct({
    socket: genSocket('unreachable'),
    ductworkDir: join(root, 'registry'),
    body: [
      `export HOME='${home}' GIT_FOREST_DIR='${forest}'`,
      `DUCT_HOST='${row.name}'`,
      `DUCT_PROBE_STDERR='${input.said}'`,
      '__duct_say_unreachable read 2>&1',
    ].join('\n'),
  });
  return { said: out.stdout };
};

describe('ductwork.unreachable', () => {
  given('[case1] a hetzner grove (no aws lever) that ssh cannot reach', () => {
    when('[t0] ssh timed out, and the alias is on disk', () => {
      const run = useBeforeAll(async () =>
        runSay({
          said: 'ssh: connect to host grove-sandpine-hetzner-v20261022-1 port 22: Connection timed out',
          sshcfg: SSHCFG_CONVERGED,
        }),
      );

      then('🔴 the fix is the tailnet, never the wake, never ssm', () => {
        expect(run.said).toContain(
          'fix:   check the tailnet — tailscale status',
        );
        expect(run.said).toContain(
          'tailscale ping grove-sandpine-hetzner-v20261022-1',
        );
        expect(run.said).not.toContain('git.grove.wake');
        expect(run.said).not.toMatch(/\bssm\b/);
      });

      then('the render reads as a snapshot', () => {
        expect(run.said).toMatchSnapshot();
      });
    });

    when(
      '[t1] ssh timed out, and this machine never woke it (no alias)',
      () => {
        const run = useBeforeAll(async () =>
          runSay({
            said: 'ssh: connect to host grove-sandpine-hetzner-v20261022 port 22: Connection timed out',
            sshcfg: null,
          }),
        );

        then(
          '🔴 the fix is the alias write first, and says it touches no aws',
          () => {
            expect(run.said).toContain(
              'fix:   write its ssh alias first — rhx git.grove.wake grove-sandpine-hetzner-v20261022 (power none: it touches no aws), then retry',
            );
          },
        );
      },
    );

    when('[t2] the bare name was refused as the local user (no alias)', () => {
      const run = useBeforeAll(async () =>
        runSay({
          said: 'surfer@grove-sandpine-hetzner-v20261022: Permission denied (publickey).',
          sshcfg: null,
        }),
      );

      then(
        '🔴 the refusal is read as the absent alias, not a key to debug',
        () => {
          expect(run.said).toContain('cause: the endpoint refused our key');
          expect(run.said).toContain(
            'write its ssh alias first — rhx git.grove.wake grove-sandpine-hetzner-v20261022',
          );
          expect(run.said).not.toContain('IdentityFile');
        },
      );

      then('the render reads as a snapshot', () => {
        expect(run.said).toMatchSnapshot();
      });
    });

    when('[t3] the alias is on disk, and the key is refused', () => {
      const run = useBeforeAll(async () =>
        runSay({
          said: 'camper@grove-sandpine-hetzner-v20261022-1: Permission denied (publickey).',
          sshcfg: SSHCFG_CONVERGED,
        }),
      );

      then('the fix is the key, with no wake', () => {
        expect(run.said).toContain("check the alias' IdentityFile");
        expect(run.said).not.toContain('git.grove.wake');
      });
    });

    when('[t4] the box answered with a changed host key', () => {
      const run = useBeforeAll(async () =>
        runSay({
          said: '@@@ WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED! @@@',
          sshcfg: SSHCFG_CONVERGED,
        }),
      );

      then("the fix names the row's own host, never a placeholder", () => {
        expect(run.said).toContain(
          'ssh-keygen -R grove-sandpine-hetzner-v20261022-1',
        );
        expect(run.said).not.toContain('<tailnet-host>');
      });
    });

    when('[t5] the box refused the connect (no sshd on its port)', () => {
      const run = useBeforeAll(async () =>
        runSay({
          said: 'ssh: connect to host grove-sandpine-hetzner-v20261022-1 port 22: Connection refused',
          sshcfg: SSHCFG_CONVERGED,
        }),
      );

      then(
        '🔴 a refusal proves the tailnet carried it: the fix is sshd and its port, never the tailnet checks',
        () => {
          expect(run.said).toContain('no sshd listens on its port');
          expect(run.said).not.toContain('tailscale');
          expect(run.said).not.toContain('git.grove.wake');
        },
      );

      then('the render reads as a snapshot', () => {
        expect(run.said).toMatchSnapshot();
      });
    });

    when('[t6] the name is unknown to this machine', () => {
      const run = useBeforeAll(async () =>
        runSay({
          said: 'ssh: Could not resolve hostname grove-sandpine-hetzner-v20261022-1: Name or service not known',
          sshcfg: SSHCFG_CONVERGED,
        }),
      );

      then('the fix is the tailnet: an unknown name is a peer question', () => {
        expect(run.said).toContain('tailscale status');
      });
    });
  });

  given(
    '[case2] an ec2 grove whose alias on disk is the ssm-era relic (localhost:36903)',
    () => {
      when('[t0] ssh is refused at the dead tunnel port', () => {
        const run = useBeforeAll(async () =>
          runSay({
            said: 'ssh: connect to host localhost port 36903: Connection refused',
            sshcfg: SSHCFG_RELIC,
            row: ROW_EC2_RELIC,
          }),
        );

        then(
          '🔴 the fix is the wake (it rewrites the alias), never "no sshd on its port"',
          () => {
            expect(run.said).toContain(
              'wake it — rhx git.grove.wake grove-sandpine-v20260901',
            );
            expect(run.said).toContain('ssm-era relic');
            expect(run.said).not.toContain('no sshd listens');
          },
        );

        then('the render reads as a snapshot', () => {
          expect(run.said).toMatchSnapshot();
        });
      });

      when('[t1] ssh timed out through the relic alias', () => {
        const run = useBeforeAll(async () =>
          runSay({
            said: 'ssh: connect to host localhost port 36903: Connection timed out',
            sshcfg: SSHCFG_RELIC,
            row: ROW_EC2_RELIC,
          }),
        );

        then('the fix is the wake, never the tailnet checks', () => {
          expect(run.said).toContain(
            'rhx git.grove.wake grove-sandpine-v20260901',
          );
          expect(run.said).not.toContain('tailscale');
        });
      });
    },
  );
});
