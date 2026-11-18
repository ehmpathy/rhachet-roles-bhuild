/**
 * .what = clamps what `git.grove.list` shows per row: where it probes, the
 *         verdict, the cure per power, and how an unreadable row is shown
 *
 * .why  = list is the first read a supervisor takes of the fleet. it reads each
 *         row through the one reach reader, so it must probe where the wake
 *         reaches, hand a no-aws grove the tailnet (never the wake), and never
 *         let a corrupt row shrink the count in silence
 *
 * .how  = hermetic. a temp forest holds the rows, a temp HOME holds no ssh
 *         config (the probe rides the row, never the alias). the probe is real:
 *         - refused: a `/dev/tcp` open to 127.0.0.2 on a port with no listener
 *         - unknown name: a host under `.invalid`, which never names a box
 *           (rfc 6761), so it fails at once with no dns in reach
 *         - live, mute, and odd: three local listeners — one writes an ssh
 *           banner, one accepts and stays silent, one writes an http banner
 *         (rule.require.hermetic-tests)
 */
import { spawn, spawnSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { type AddressInfo, createServer, type Server } from 'net';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../.test/tempDirs';

const PATH_LIST = join(__dirname, 'git.grove.list.sh');

const ROW_HETZNER = {
  name: 'grove-sandpine-hetzner-v20261022',
  host: '127.0.0.2',
  port: 1,
};
const ROW_HETZNER_UNKNOWN = {
  name: 'grove-sandpine-hetzner-v20261023',
  host: 'grove-sandpine-hetzner-v20261023.invalid',
};
const ROW_EC2 = {
  name: 'grove-sandpine-v20260901',
  host: 'grove-sandpine-v20260901.invalid',
  account: '000000000000',
};
const ROW_RELIC = {
  name: 'grove-sandpine-v20250101',
  host: 'localhost',
  port: 36903,
  exid: 'grove-sandpine-v20250101.invalid',
  account: '000000000000',
};
const ROWS_ALL = [ROW_HETZNER, ROW_HETZNER_UNKNOWN, ROW_EC2, ROW_RELIC];

/** .what = a temp forest of the given rows, plus one corrupt row, and an empty HOME */
const genScene = (input: { rows: { name: string }[] }) => {
  const forest = tempDirs.genOne({ slug: 'grove-list' });
  mkdirSync(join(forest, 'groves'), { recursive: true });
  for (const row of input.rows)
    writeFileSync(
      join(forest, 'groves', `${row.name}.json`),
      JSON.stringify(row),
    );
  writeFileSync(
    join(forest, 'groves', 'grove-sandpine-corrupt.json'),
    '{ "name": "grove-sandpine-corrupt", ',
  );
  const home = join(forest, 'home');
  mkdirSync(join(home, '.ssh'), { recursive: true });
  return { env: { ...process.env, GIT_FOREST_DIR: forest, HOME: home } };
};

/** .what = run the list against a temp forest of the given rows, plus one corrupt row */
const runList = (input: { args: string[]; rows: { name: string }[] }) => {
  const out = spawnSync('bash', [PATH_LIST, ...input.args], {
    encoding: 'utf8',
    env: genScene({ rows: input.rows }).env,
    timeout: 60_000,
  });
  return {
    stdout: out.stdout ?? '',
    stderr: out.stderr ?? '',
    exit: out.status,
  };
};

/**
 * .what = run the list without a block of the event loop, so a local listener
 *         in this process can answer the probe
 */
const runListAsync = (input: {
  args: string[];
  rows: ({ name: string } & Record<string, unknown>)[];
}): Promise<{ stdout: string; exit: number | null }> =>
  new Promise((done) => {
    const child = spawn('bash', [PATH_LIST, ...input.args], {
      env: genScene({ rows: input.rows }).env,
    });
    const chunks: Buffer[] = [];
    child.stdout.on('data', (b: Buffer) => {
      chunks.push(b);
    });
    child.on('close', (exit) =>
      done({ stdout: Buffer.concat(chunks).toString(), exit }),
    );
  });

/** .what = a local listener on an ephemeral port; `banner` null = accept, stay silent */
const genListener = (input: { banner: string | null }): Promise<Server> =>
  new Promise((done) => {
    const server = createServer((socket) => {
      if (input.banner !== null) socket.write(input.banner);
    });
    server.listen(0, '127.0.0.3', () => done(server));
  });

describe('git.grove.list', () => {
  afterAll(() => tempDirs.delAll());

  given(
    '[case1] a forest of a hetzner row, an ec2 row, a relic, and a corrupt row',
    () => {
      when('[t0] it is listed with no probe', () => {
        const result = useBeforeAll(async () =>
          runList({ rows: ROWS_ALL, args: ['--no-probe'] }),
        );

        then('it exits 0 and lists every row, the corrupt one too', () => {
          expect(result.exit).toEqual(0);
          expect(result.stdout).toContain(
            'grove-sandpine-hetzner-v20261022 → camper@127.0.0.2:1',
          );
          expect(result.stdout).toContain(
            'grove-sandpine-corrupt → 🟡 row unreadable',
          );
        });

        then(
          'a relic row is listed where the wake reaches it: exid on 22',
          () => {
            expect(result.stdout).toContain(
              'grove-sandpine-v20250101 → camper@grove-sandpine-v20250101.invalid:22',
            );
            expect(result.stdout).not.toContain('localhost');
          },
        );

        then(
          '🔴 the corrupt row carries its own cause and fix, on its row',
          () => {
            // the reader's error block once landed on stderr, mid-tree, under
            // no row of its own; the row now hangs its fix as its child
            expect(result.stdout).toContain(
              'grove-sandpine-corrupt → 🟡 row unreadable — not json',
            );
            expect(result.stdout).toMatch(
              /grove-sandpine-corrupt → 🟡 row unreadable — not json\n {3}[│ ] {5}└─ fix → re-register it — git grove set grove-sandpine-corrupt --at/,
            );
            expect(result.stdout).not.toContain('named above');
            expect(result.stderr).not.toContain('grove row unreadable');
          },
        );

        then('the list reads as a snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });

      when('[t1] it is listed with the probe', () => {
        const result = useBeforeAll(async () =>
          runList({ rows: ROWS_ALL, args: ['--timeout', '2'] }),
        );

        then('a refused grove reads DOWN, and the list still exits 0', () => {
          expect(result.exit).toEqual(0);
          expect(result.stdout).toContain('🔴 DOWN — no ssh banner: refused');
        });

        then(
          '🔴 a refused grove is handed sshd and its port — the tailnet carried the connect, so never the tailnet checks, never the wake',
          () => {
            const rows = result.stdout.split('🌳');
            const refused = rows.find((r) =>
              r.includes('grove-sandpine-hetzner-v20261022 →'),
            );
            expect(refused).toContain('is sshd up there, and is 1 its port?');
            expect(refused).not.toContain('tailscale');
            expect(refused).not.toContain('git.grove.wake');
            // the wish: a hint names the tailnet path, never ssm
            expect(refused).not.toContain('ssm');
          },
        );

        then(
          '🔴 a no-aws grove whose name is unknown is handed the tailnet, never the wake',
          () => {
            const rows = result.stdout.split('🌳');
            const unknown = rows.find((r) =>
              r.includes('grove-sandpine-hetzner-v20261023 →'),
            );
            expect(unknown).toContain('tailscale status');
            expect(unknown).not.toContain('git.grove.wake');
          },
        );

        then('the ec2 grove whose name is unknown is handed the wake', () => {
          expect(result.stdout).toContain(
            'rhx git.grove.wake grove-sandpine-v20260901',
          );
        });

        then('the final verdict never claims every grove answers', () => {
          expect(result.stdout).toContain('🛟 a grove did not greet with ssh');
          expect(result.stdout).not.toContain('every grove answers');
        });

        then('the unreadable row earns its own final line, by cause', () => {
          expect(result.stdout).toContain('🛟 a row is unreadable');
        });

        then('the probe reads as a snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });

      when('[t2] it is listed as json, with the probe', () => {
        const result = useBeforeAll(async () =>
          runList({ rows: ROWS_ALL, args: ['--json', '--timeout', '2'] }),
        );

        then('every row is in the array, the corrupt one marked', () => {
          expect(result.exit).toEqual(0);
          const rows: {
            name: string;
            tunnel: string | null;
            reach: unknown;
          }[] = JSON.parse(result.stdout);
          expect(rows).toHaveLength(5);
          expect(rows.find((r) => r.name === 'grove-sandpine-corrupt')).toEqual(
            {
              name: 'grove-sandpine-corrupt',
              row: 'unreadable',
              power: null,
              reach: null,
              tunnel: null,
              cause: null,
            },
          );
        });

        then(
          'each readable row carries power and reach as two axes, plus the probe verdict and its cause',
          () => {
            const rows: {
              name: string;
              row: string;
              power: string | null;
              tunnel: string | null;
              cause: string | null;
              reach: { host: string; port: number; user: string } | null;
            }[] = JSON.parse(result.stdout);
            const hetzner = rows.find(
              (r) => r.name === 'grove-sandpine-hetzner-v20261022',
            );
            expect(hetzner?.row).toEqual('readable');
            expect(hetzner?.power).toEqual('none');
            expect(hetzner?.reach).toEqual({
              host: '127.0.0.2',
              port: 1,
              user: 'camper',
            });
            expect(hetzner?.tunnel).toEqual('down');
            expect(hetzner?.cause).toEqual(
              'refused — the box answers; no sshd on this port',
            );
          },
        );

        then('the json contract reads as a snapshot', () => {
          expect(JSON.parse(result.stdout)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case3] a grove whose sshd greets, one that accepts and stays mute, and one that greets with a non-ssh banner',
    () => {
      const listeners = useBeforeAll(async () => ({
        live: await genListener({ banner: 'SSH-2.0-OpenSSH_stub\r\n' }),
        mute: await genListener({ banner: null }),
        odd: await genListener({ banner: 'HTTP/1.1 400 Bad Request\r\n' }),
      }));
      afterAll(() => {
        listeners.live.close();
        listeners.mute.close();
        listeners.odd.close();
      });

      /** .what = the ephemeral port of a listener */
      const portOf = (server: Server): number =>
        (server.address() as AddressInfo).port;

      when('[t0] the three groves are listed with the probe', () => {
        const result = useBeforeAll(async () =>
          runListAsync({
            rows: [
              {
                name: 'grove-sandpine-hetzner-live',
                host: '127.0.0.3',
                port: portOf(listeners.live),
              },
              {
                name: 'grove-sandpine-hetzner-mute',
                host: '127.0.0.3',
                port: portOf(listeners.mute),
              },
              {
                name: 'grove-sandpine-hetzner-odd',
                host: '127.0.0.3',
                port: portOf(listeners.odd),
              },
            ],
            args: ['--timeout', '2'],
          }),
        );

        /** .what = one grove's row, cut at the blank line that ends the rows */
        const rowOf = (name: string): string | undefined =>
          result.stdout
            .split('\n\n')[0]!
            .split('🌳')
            .find((r) => r.includes(`${name} →`));

        then('the greeted grove reads 🟢 live, with no fix', () => {
          const live = rowOf('grove-sandpine-hetzner-live');
          expect(live).toContain('🟢 live');
          expect(live).not.toContain('fix →');
        });

        then(
          '🔴 the mute grove is handed its load, never the tailnet, never the wake',
          () => {
            const mute = rowOf('grove-sandpine-hetzner-mute');
            expect(mute).toContain('🔴 MUTE');
            expect(mute).toContain(
              'rhx git.grove.saturation --only grove-sandpine-hetzner-mute',
            );
            expect(mute).not.toContain('tailscale');
            expect(mute).not.toContain('git.grove.wake');
          },
        );

        then(
          '🟡 the odd grove is asked whether its port is sshd, never the tailnet, never the wake',
          () => {
            const odd = rowOf('grove-sandpine-hetzner-odd');
            expect(odd).toContain(
              '🟡 odd — a listener answered, and it is not ssh',
            );
            expect(odd).toContain(
              'git grove set grove-sandpine-hetzner-odd --at camper@127.0.0.3:22',
            );
            expect(odd).not.toContain('tailscale');
            expect(odd).not.toContain('git.grove.wake');
          },
        );

        then('the live, mute, and odd renders read as a snapshot', () => {
          // the listener ports are ephemeral, so each is masked to its role
          const masked = result.stdout
            .split(String(portOf(listeners.live)))
            .join('<port.live>')
            .split(String(portOf(listeners.mute)))
            .join('<port.mute>')
            .split(String(portOf(listeners.odd)))
            .join('<port.odd>');
          expect(masked).toMatchSnapshot();
        });
      });
    },
  );

  given('[case2] a forest whose only row is corrupt', () => {
    when('[t0] it is listed with the probe', () => {
      const result = useBeforeAll(async () =>
        runList({ rows: [], args: ['--timeout', '2'] }),
      );

      then('it exits 0 and shows the row as unreadable', () => {
        expect(result.exit).toEqual(0);
        expect(result.stdout).toContain(
          'grove-sandpine-corrupt → 🟡 row unreadable',
        );
      });

      then(
        '🔴 the final verdict names the row, never a tailnet silence',
        () => {
          expect(result.stdout).toContain('🛟 a row is unreadable');
          expect(result.stdout).not.toContain('did not answer');
          expect(result.stdout).not.toContain('tailscale status');
          expect(result.stdout).not.toContain('every grove answers');
        },
      );

      then('the render reads as a snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case4] a human who asks how to read the list', () => {
    when('[t0] --help is asked', () => {
      const result = useBeforeAll(async () =>
        runList({ rows: [], args: ['--help'] }),
      );

      then('it exits 0 and names the tailnet cure, never ssm', () => {
        expect(result.exit).toEqual(0);
        expect(result.stdout).toContain('--timeout');
        expect(result.stdout).not.toContain('ssm');
      });

      then('the help reads as a snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });
});
