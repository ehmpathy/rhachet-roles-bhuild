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
import { spawnSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
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

/**
 * .mock = the `ssh` binary, as a stub first on PATH that exits $SSH_STUB_EXIT
 * .why  = the `--keys` arm asks the grove `tmux has-session` over ssh, and ssh's
 *         exit code is what parts its two verdicts: 255 is ssh's own failure
 *         (the grove was never asked), any other nonzero is tmux's answer. a
 *         stub sets that code with no grove in reach (rule.require.hermetic-tests).
 *         `ssh -G` connects to naught, so the stub hands it to the real client:
 *         the cure reads the alias through it, against the temp HOME's config
 * .real = the 5.3 verification: crew verbs against the hetzner grove, live
 */
const genStubSsh = (input: { sshReal: string }): string => `#!/usr/bin/env bash
for arg in "$@"; do
  [[ "$arg" == "-G" ]] && exec '${input.sshReal}' "$@"
done
exit "\${SSH_STUB_EXIT:-0}"
`;

/** .what = the real ssh client's path, so the stub can hand `-G` to it */
const getSshReal = (): string => {
  const found = spawnSync('bash', ['-c', 'command -v ssh']);
  const path = found.stdout?.toString().trim() ?? '';
  if (!path)
    throw new Error(
      'ssh is required for the duct.send clamps. fix: sudo apt install openssh-client',
    );
  return path;
};

/** .what = run the real `duct.send --keys` at a grove's duct, with ssh stubbed */
const runSendKeys = (input: {
  sshExit: number;
}): { exit: number | null; stderr: string } => {
  const root = tempDirs.genOne({ slug: 'duct-unreachable-send' });
  const home = join(root, 'home');
  const forest = join(root, 'forest');
  const bin = join(root, 'bin');
  mkdirSync(join(home, '.ssh'), { recursive: true });
  mkdirSync(join(forest, 'groves'), { recursive: true });
  mkdirSync(bin, { recursive: true });
  writeFileSync(
    join(forest, 'groves', `${ROW_HETZNER.name}.json`),
    JSON.stringify(ROW_HETZNER),
  );
  writeFileSync(join(home, '.ssh', 'config'), SSHCFG_CONVERGED);
  writeFileSync(join(bin, 'ssh'), genStubSsh({ sshReal: getSshReal() }), {
    mode: 0o755,
  });
  const out = spawnSync(
    'bash',
    [
      join(__dirname, '..', 'duct.send.sh'),
      '--on',
      `duct://${ROW_HETZNER.name}/svc-lessons/mechanic`,
      '--keys',
      'Enter',
    ],
    {
      env: {
        ...process.env,
        HOME: home,
        GIT_FOREST_DIR: forest,
        DUCTWORK_DIR: join(root, 'registry'),
        DUCTWORK_TMUX_SOCKET: join(root, 'tmux.sock'),
        PATH: `${bin}:${process.env.PATH ?? ''}`,
        SSH_STUB_EXIT: String(input.sshExit),
      },
      timeout: 30_000,
    },
  );
  return { exit: out.status, stderr: out.stderr?.toString() ?? '' };
};

/**
 * .what = run the LIB `duct.send --keys` (the one crew heal, boot, and the pane
 *         cures call) at a grove's duct, with the same ssh stub
 * .why  = the skill and the lib are two surfaces over one verb; each owes its
 *         own render clamp, or a fold of 255 into "absent" in one hides
 */
const runLibSendKeys = (input: {
  sshExit: number;
}): { said: string; exit: string } => {
  const root = tempDirs.genOne({ slug: 'duct-unreachable-lib-send' });
  const home = join(root, 'home');
  const forest = join(root, 'forest');
  const bin = join(root, 'bin');
  mkdirSync(join(home, '.ssh'), { recursive: true });
  mkdirSync(join(forest, 'groves'), { recursive: true });
  mkdirSync(bin, { recursive: true });
  writeFileSync(
    join(forest, 'groves', `${ROW_HETZNER.name}.json`),
    JSON.stringify(ROW_HETZNER),
  );
  writeFileSync(join(home, '.ssh', 'config'), SSHCFG_CONVERGED);
  writeFileSync(join(bin, 'ssh'), genStubSsh({ sshReal: getSshReal() }), {
    mode: 0o755,
  });
  const out = runDuct({
    socket: genSocket('unreachable-lib-send'),
    ductworkDir: join(root, 'registry'),
    body: [
      `export HOME='${home}' GIT_FOREST_DIR='${forest}'`,
      `export PATH='${bin}':"$PATH" SSH_STUB_EXIT='${input.sshExit}'`,
      `__rc=0; duct.send --on 'duct://${ROW_HETZNER.name}/svc-lessons/mechanic' --keys Enter 2>&1 || __rc=$?`,
      'echo "exit=$__rc"',
    ].join('\n'),
  });
  const lines = out.stdout.trimEnd().split('\n');
  return {
    exit: lines[lines.length - 1] ?? '',
    said: lines.slice(0, -1).join('\n'),
  };
};

/**
 * .what = the crew poll's unreached roll, cut from pollwork.read.sh at its own
 *         code bounds: the `if` that opens on the asleep set, to its `fi`
 * .why  = the roll is a block inside the poll's read, and a whole poll needs a
 *         fleet. the cut runs the real lines, so a render defect in the loop or
 *         its glyph shows here, where a source-text clamp would stay green
 */
const getUnreachedRoll = (): string => {
  const src = readFileSync(join(__dirname, 'pollwork.read.sh'), 'utf8');
  const open = '  if (( ${#__unreached_asleep[@]} > 0 )); then';
  const at = src.indexOf(open);
  if (at < 0)
    throw new Error('the unreached roll is absent from pollwork.read.sh');
  const end = src.indexOf('\n  fi\n', at);
  if (end < 0)
    throw new Error('the unreached roll has no close in pollwork.read.sh');
  return src.slice(at, end + '\n  fi\n'.length);
};

/** .what = render the roll for a set of unreached groves, each with a row */
const runUnreachedRoll = (input: { groves: string[] }): { said: string } => {
  const root = tempDirs.genOne({ slug: 'duct-unreachable-roll' });
  const home = join(root, 'home');
  const forest = join(root, 'forest');
  mkdirSync(join(home, '.ssh'), { recursive: true });
  mkdirSync(join(forest, 'groves'), { recursive: true });
  for (const row of [ROW_HETZNER, ROW_EC2_RELIC])
    writeFileSync(
      join(forest, 'groves', `${row.name}.json`),
      JSON.stringify(row),
    );
  writeFileSync(join(home, '.ssh', 'config'), SSHCFG_CONVERGED);
  const pathRoll = join(root, 'roll.sh');
  writeFileSync(pathRoll, getUnreachedRoll());
  const out = runDuct({
    socket: genSocket('unreachable-roll'),
    ductworkDir: join(root, 'registry'),
    body: [
      `export HOME='${home}' GIT_FOREST_DIR='${forest}'`,
      `__unreached_asleep=(${input.groves.map((g) => `'${g}'`).join(' ')})`,
      `source '${pathRoll}'`,
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

        then('the render reads as a snapshot', () => {
          expect(run.said).toMatchSnapshot();
        });
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
          // the cause and the fix name one layer: the absent alias, never the key
          expect(run.said).toContain(
            'so ssh dialed as the local user and the grove never saw our key',
          );
          expect(run.said).not.toContain('cause: the endpoint refused our key');
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

      then('the render reads as a snapshot', () => {
        expect(run.said).toMatchSnapshot();
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

      then('the render reads as a snapshot', () => {
        expect(run.said).toMatchSnapshot();
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

      then('the render reads as a snapshot', () => {
        expect(run.said).toMatchSnapshot();
      });
    });

    when(
      '[t7] a host key changed, and this machine never woke it (no alias)',
      () => {
        const run = useBeforeAll(async () =>
          runSay({
            said: '@@@ WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED! @@@',
            sshcfg: null,
          }),
        );

        then(
          'the cause and the fix name one layer: the absent alias, never the key',
          () => {
            expect(run.said).toContain('so the identity is not the grove');
            expect(run.said).toContain(
              'write its ssh alias first — rhx git.grove.wake grove-sandpine-hetzner-v20261022',
            );
            expect(run.said).not.toContain('ssh-keygen -R');
            expect(run.said).not.toContain('an identity we do not trust');
          },
        );

        then('the render reads as a snapshot', () => {
          expect(run.said).toMatchSnapshot();
        });
      },
    );
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
            expect(run.said).toContain('a stale alias');
            expect(run.said).not.toContain('no sshd listens');
            // the wish: a hint names the tailnet path, never ssm
            expect(run.said).not.toContain('ssm');
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

        then('the cause blames the stale alias, never the grove', () => {
          expect(run.said).toContain('so the timeout is not the grove');
          expect(run.said).not.toContain('down, asleep, or off the tailnet');
        });

        then('the render reads as a snapshot', () => {
          expect(run.said).toMatchSnapshot();
        });
      });
    },
  );

  given('[case3] duct.send --keys at a grove duct (the approval path)', () => {
    when('[t0] ssh cannot reach the grove (rc 255)', () => {
      const run = useBeforeAll(async () => runSendKeys({ sshExit: 255 }));

      then(
        '🔴 it says the grove was never asked, never that the session is absent',
        () => {
          expect(run.exit).toEqual(2);
          expect(run.stderr).toContain(
            "cannot reach 'grove-sandpine-hetzner-v20261022', so the session was never asked for",
          );
          expect(run.stderr).not.toContain('is absent on');
        },
      );

      then('its fix is the per-power cure: the tailnet, never the wake', () => {
        expect(run.stderr).toContain(
          'fix: check the tailnet — tailscale status',
        );
        expect(run.stderr).not.toContain('git.grove.wake');
      });

      then('the render reads as a snapshot', () => {
        expect(run.stderr).toMatchSnapshot();
      });
    });

    when('[t1] the grove answers and holds no such session (rc 1)', () => {
      const run = useBeforeAll(async () => runSendKeys({ sshExit: 1 }));

      then(
        'it says the session is absent there, and that the grove answered',
        () => {
          expect(run.exit).toEqual(2);
          expect(run.stderr).toContain(
            "session 'svc-lessons/mechanic' is absent on 'grove-sandpine-hetzner-v20261022'",
          );
          expect(run.stderr).toContain('the grove answered');
          expect(run.stderr).not.toContain('cannot reach');
        },
      );

      then('the render reads as a snapshot', () => {
        expect(run.stderr).toMatchSnapshot();
      });
    });
  });

  given(
    '[case4] the lib duct.send --keys at a grove duct (crew heal, boot, pane cures)',
    () => {
      when('[t0] ssh cannot reach the grove (rc 255)', () => {
        const run = useBeforeAll(async () => runLibSendKeys({ sshExit: 255 }));

        then(
          '🔴 it says the grove was never asked, never that the session is absent',
          () => {
            expect(run.exit).toEqual('exit=2');
            expect(run.said).toContain(
              "cannot reach 'grove-sandpine-hetzner-v20261022', so the session was never asked for",
            );
            expect(run.said).not.toContain('is absent on');
          },
        );

        then(
          'its fix is the per-power cure: the tailnet, never the wake',
          () => {
            expect(run.said).toContain(
              'fix: check the tailnet — tailscale status',
            );
            expect(run.said).not.toContain('git.grove.wake');
          },
        );

        then('the render reads as a snapshot', () => {
          expect(run.said).toMatchSnapshot();
        });
      });

      when('[t1] the grove answers and holds no such session (rc 1)', () => {
        const run = useBeforeAll(async () => runLibSendKeys({ sshExit: 1 }));

        then(
          'it says the session is absent there, and names the crew poll to read',
          () => {
            expect(run.exit).toEqual('exit=2');
            expect(run.said).toContain(
              "is absent on 'grove-sandpine-hetzner-v20261022'",
            );
            expect(run.said).toContain('the grove answered');
            expect(run.said).toContain(
              'fix: read which seats are up — rhx git.crew.poll --live',
            );
            expect(run.said).not.toContain('cannot reach');
          },
        );

        then('the render reads as a snapshot', () => {
          expect(run.said).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case5] the crew poll header rolls two unreached groves, one per power',
    () => {
      when('[t0] a hetzner grove and an ec2 grove both did not answer', () => {
        const run = useBeforeAll(async () =>
          runUnreachedRoll({ groves: [ROW_HETZNER.name, ROW_EC2_RELIC.name] }),
        );

        then('🔴 only the last grove takes the last-child glyph', () => {
          const branches = run.said
            .split('\n')
            .filter((line) => /^ {3}│ {6}(├─|└─) /.test(line));
          expect(branches.length).toEqual(2);
          expect(branches[0]).toContain(`├─ ${ROW_HETZNER.name} —`);
          expect(branches[1]).toContain(`└─ ${ROW_EC2_RELIC.name} —`);
        });

        then('each grove is handed the cure its power fits', () => {
          expect(run.said).toContain(
            `${ROW_HETZNER.name} — check the tailnet — tailscale status`,
          );
          expect(run.said).toContain(
            `${ROW_EC2_RELIC.name} — wake it — rhx git.grove.wake ${ROW_EC2_RELIC.name}`,
          );
        });

        then('the render reads as a snapshot', () => {
          expect(run.said).toMatchSnapshot();
        });
      });

      when('[t1] one grove did not answer', () => {
        const run = useBeforeAll(async () =>
          runUnreachedRoll({ groves: [ROW_HETZNER.name] }),
        );

        then('the lone grove takes the last-child glyph', () => {
          expect(run.said).toContain(`└─ ${ROW_HETZNER.name} —`);
          expect(run.said).not.toContain(`├─ ${ROW_HETZNER.name} —`);
        });
      });
    },
  );
});
