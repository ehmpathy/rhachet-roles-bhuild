/**
 * .what = clamps what `git.grove.wake` DOES, per grove power: which tools it
 *         calls, what it writes to ~/.ssh/config, and what it says on failure
 *
 * .why  = the wake is the one skill that writes the alias every crew verb rides.
 *         the source-text clamps ([case63] in work.surface.alerts) pin its words;
 *         this suite pins its acts — a hetzner grove wakes with no aws call, an
 *         ec2 grove never touches ssm, a relic alias converges, and a grove that
 *         does not answer leaves the alias untouched
 *
 * .how  = hermetic. a temp HOME holds the ssh config, a temp forest holds the
 *         rows, and stubs for `ssh`, `aws`, and `rhx` sit first on PATH. each
 *         stub appends its argv to one log, so a test reads every external call
 *         the wake made (rule.require.hermetic-tests). no network, no fleet
 */
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../.test/tempDirs';

const PATH_WAKE = join(__dirname, 'git.grove.wake.sh');

const ROW_HETZNER = {
  name: 'grove-sandpine-hetzner-v20261022',
  host: 'grove-sandpine-hetzner-v20261022-1',
};
const ROW_EC2_RELIC = {
  name: 'grove-sandpine-v20260901',
  sshAlias: 'grove-sandpine-v20260901',
  user: 'camper',
  host: 'localhost',
  port: 36903,
  exid: 'grove-sandpine-v20260901',
  account: '000000000000',
  env: 'camp',
  type: 'ec2',
};

/** an ssm-era alias block, as every extant laptop holds it */
const SSHCFG_RELIC = [
  'Host grove-sandpine-v20260901',
  '  HostName localhost',
  '  Port 36903',
  '  User camper',
  '  IdentityFile ~/.ssh/id_ed25519',
  '',
].join('\n');

/**
 * .mock = the `ssh`, `aws`, and `rhx` binaries, as stubs first on PATH
 * .why  = a real wake starts ec2 instances, reads a human's keyrack, and dials
 *         a live grove. none is hermetic, and a start costs money. the suite
 *         pins which calls the wake makes and what it writes, not what aws does
 * .real = the 5.3 verification: wake, read, send, boot against the hetzner
 *         grove and an ec2 grove, over the tailnet, captured verbatim
 */
// each stub logs `<tool> <argv>` to $STUB_LOG, then answers per env
const STUB_SSH = `#!/usr/bin/env bash
echo "ssh $*" >> "$STUB_LOG"
[[ -n "\${SSH_STUB_SAID:-}" ]] && echo "$SSH_STUB_SAID" >&2
exit "\${SSH_STUB_EXIT:-0}"
`;
// AWS_STUB_ACCOUNT names the session's account; AWS_STUB_STATE=stopped holds the
// box stopped until a start-instances call marks it up. the nat and the box
// answer two distinct ids, as two real instances do, so a render tells them apart
const STUB_AWS = `#!/usr/bin/env bash
echo "aws $*" >> "$STUB_LOG"
case "$1 $2" in
  "sts get-caller-identity") echo "\${AWS_STUB_ACCOUNT:-000000000000}" ;;
  "ec2 start-instances") : > "$STUB_LOG.started" ;;
  "ec2 describe-instances")
    if [[ "$*" != *State.Name* && "$*" == *nat-sandpine* ]]; then echo "i-0sandpine0nat0001"
    elif [[ "$*" != *State.Name* ]]; then echo "i-0sandpine0box0001"
    elif [[ "\${AWS_STUB_STATE:-}" == "stopped" && ! -f "$STUB_LOG.started" ]]; then echo "stopped"
    else echo "run""ning"; fi ;;
esac
exit 0
`;
// the preflight asks `tailscale status`; a stub keeps the suite hermetic, so
// the box that runs it (a peer or not) never decides a verdict
const STUB_TAILSCALE = `#!/usr/bin/env bash
echo "tailscale $*" >> "$STUB_LOG"
[[ -n "\${TS_STUB_SAID:-}" ]] && echo "$TS_STUB_SAID"
exit "\${TS_STUB_EXIT:-0}"
`;
const STUB_RHX = `#!/usr/bin/env bash
echo "rhx $*" >> "$STUB_LOG"
echo "🔐 keyrack: AWS_PROFILE is locked 🔒 — rhx keyrack unlock" >&2
exit 2
`;

/** .what = run the wake against one row, with stubs on PATH, in a temp HOME */
const runWake = (input: {
  row: { name: string };
  args: string[];
  sshcfg: string | null;
  env: Record<string, string>;
  credentials: boolean;
  /** the row's file text as written, for a row that is not json */
  rowText?: string;
  /** a prior run's root, so a re-run shares its HOME (the alias block names $HOME's key path) */
  root?: string;
  /** leave `aws` off the stub dir, so the real aws cli answers */
  awsReal?: boolean;
}) => {
  const root = input.root ?? tempDirs.genOne({ slug: 'grove-wake-tailnet' });
  const home = join(root, 'home');
  const forest = join(root, 'forest');
  const bin = join(root, 'bin');
  const log = join(root, 'calls.log');
  mkdirSync(join(home, '.ssh'), { recursive: true });
  mkdirSync(join(forest, 'groves'), { recursive: true });
  mkdirSync(bin, { recursive: true });
  writeFileSync(
    join(forest, 'groves', `${input.row.name}.json`),
    input.rowText ?? JSON.stringify(input.row),
  );
  if (input.sshcfg !== null)
    writeFileSync(join(home, '.ssh', 'config'), input.sshcfg);
  writeFileSync(join(bin, 'ssh'), STUB_SSH, { mode: 0o755 });
  if (!input.awsReal)
    writeFileSync(join(bin, 'aws'), STUB_AWS, { mode: 0o755 });
  writeFileSync(join(bin, 'rhx'), STUB_RHX, { mode: 0o755 });
  writeFileSync(join(bin, 'tailscale'), STUB_TAILSCALE, { mode: 0o755 });
  writeFileSync(log, '');

  // a caller's own aws session must never leak into a case that asserts on it
  const envBase = { ...process.env };
  delete envBase.AWS_ACCESS_KEY_ID;
  delete envBase.AWS_SECRET_ACCESS_KEY;
  delete envBase.AWS_SESSION_TOKEN;
  delete envBase.AWS_PROFILE;
  const envCreds = input.credentials
    ? { AWS_ACCESS_KEY_ID: 'AKIASANDPINE0000', AWS_SECRET_ACCESS_KEY: 'stub' }
    : {};

  const out = spawnSync('bash', [PATH_WAKE, ...input.args], {
    encoding: 'utf8',
    env: {
      ...envBase,
      ...envCreds,
      ...input.env,
      HOME: home,
      GIT_FOREST_DIR: forest,
      PATH: `${bin}:${process.env.PATH ?? ''}`,
      STUB_LOG: log,
    },
    timeout: 60_000,
  });
  const pathCfg = join(home, '.ssh', 'config');
  return {
    root,
    stdout: out.stdout ?? '',
    stderr: out.stderr ?? '',
    /** the trunk on stdout, then the failure that closes it on stderr — the order a terminal shows */
    said: `${out.stdout ?? ''}${out.stderr ?? ''}`,
    exit: out.status,
    calls: readFileSync(log, 'utf8').split('\n').filter(Boolean),
    sshcfg: existsSync(pathCfg) ? readFileSync(pathCfg, 'utf8') : '',
  };
};

describe('git.grove.wake.tailnet', () => {
  afterAll(() => tempDirs.delAll());

  given('[case1] a hetzner grove — no aws lever, a tailnet host', () => {
    when('[t0] it is woken and ssh answers', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_HETZNER,
          args: [ROW_HETZNER.name],
          sshcfg: null,
          env: {},
          credentials: false,
        }),
      );

      then('it exits 0', () => {
        expect(result.exit).toEqual(0);
      });

      then('it never calls aws, nor the keyrack', () => {
        expect(result.calls.filter((c) => c.startsWith('aws '))).toEqual([]);
        expect(result.calls.filter((c) => c.startsWith('rhx '))).toEqual([]);
      });

      then('it awaits ssh as camper, with the tailnet host pinned', () => {
        const ssh = result.calls.filter((c) => c.startsWith('ssh '));
        expect(ssh.length).toBeGreaterThan(0);
        expect(ssh[0]).toContain(
          '-o HostName=grove-sandpine-hetzner-v20261022-1',
        );
        expect(ssh[0]).toContain('-o StrictHostKeyChecking=accept-new');
        expect(ssh[0]).toContain('-p 22');
        expect(ssh[0]).toContain('camper@grove-sandpine-hetzner-v20261022-1');
      });

      then(
        'it writes the alias to the tailnet host, port 22, as camper',
        () => {
          expect(result.sshcfg).toContain(
            'Host grove-sandpine-hetzner-v20261022\n',
          );
          expect(result.sshcfg).toContain(
            '  HostName grove-sandpine-hetzner-v20261022-1\n',
          );
          expect(result.sshcfg).toContain('  Port 22\n');
          expect(result.sshcfg).toContain('  User camper\n');
        },
      );

      then(
        '🔴 the alias it wrote parses, in real ssh, to the row host, port and user — and reads converged',
        () => {
          const home = join(result.root, 'home');
          const parsed = spawnSync(
            'ssh',
            ['-G', '-F', join(home, '.ssh', 'config'), ROW_HETZNER.name],
            { encoding: 'utf8' },
          );
          expect(parsed.status).toEqual(0);
          const lines = parsed.stdout.split('\n');
          expect(lines).toContain(`hostname ${ROW_HETZNER.host}`);
          expect(lines).toContain('port 22');
          expect(lines).toContain('user camper');
          const converged = spawnSync(
            'bash',
            [
              '-c',
              `source '${join(__dirname, 'work', 'grovework.sh')}'\n__grove_alias_converged alias=${ROW_HETZNER.name} host=${ROW_HETZNER.host} port=22 user=camper`,
            ],
            { encoding: 'utf8', env: { ...process.env, HOME: home } },
          );
          expect(converged.status).toEqual(0);
        },
      );

      then('it names its power and reach, never ssm', () => {
        expect(result.stdout).toContain('power: none');
        expect(result.stdout).toContain(
          'reach: camper@grove-sandpine-hetzner-v20261022-1:22, over the tailnet',
        );
        expect(`${result.stdout}${result.stderr}`).not.toMatch(/\bssm\b/);
      });

      then('the wake reads as a snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t1] it is woken and ssh does not answer', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_HETZNER,
          args: [ROW_HETZNER.name, '--timeout', '0'],
          sshcfg: null,
          env: {
            SSH_STUB_EXIT: '255',
            SSH_STUB_SAID:
              'ssh: connect to host grove-sandpine-hetzner-v20261022-1 port 22: Connection timed out',
          },
          credentials: false,
        }),
      );

      then('it exits 1', () => {
        expect(result.exit).toEqual(1);
      });

      then('it quotes ssh, then names the tailnet checks in order', () => {
        expect(result.stderr).toContain('Connection timed out');
        const iStatus = result.stderr.indexOf('tailscale status');
        const iProbe = result.stderr.indexOf(
          'tailscale ping grove-sandpine-hetzner-v20261022-1',
        );
        expect(iStatus).toBeGreaterThan(-1);
        expect(iProbe).toBeGreaterThan(iStatus);
      });

      then('it never hands a grove with no lever the wake as its cure', () => {
        expect(result.stderr).not.toContain('rhx git.grove.wake');
        expect(result.stderr).not.toMatch(/\bssm\b/);
      });

      then('it writes no alias, and calls no aws', () => {
        expect(result.sshcfg).toEqual('');
        expect(result.calls.filter((c) => c.startsWith('aws '))).toEqual([]);
      });

      then(
        '🔴 the first move it hands the caller is to check THIS machine (case=7)',
        () => {
          // after what ssh said, the first instruction is the self-check —
          // a caller off the tailnet reaches no grove, so every other cure waits
          const afterSaid = result.stderr.slice(
            result.stderr.indexOf('Connection timed out'),
          );
          const iSelf = afterSaid.indexOf('is THIS machine on the tailnet');
          expect(iSelf).toBeGreaterThan(-1);
          expect(iSelf).toBeLessThan(afterSaid.indexOf('tailscale ping'));
          expect(iSelf).toBeLessThan(afterSaid.indexOf('git grove set'));
        },
      );

      then('the failure reads as a snapshot', () => {
        expect(result.said).toMatchSnapshot();
      });
    });

    when('[t2] it is planned', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_HETZNER,
          args: [ROW_HETZNER.name, '--mode', 'plan'],
          sshcfg: null,
          env: {},
          credentials: false,
        }),
      );

      then('it exits 0 with no ssh call, no aws call, and no alias', () => {
        expect(result.exit).toEqual(0);
        expect(result.calls).toEqual([]);
        expect(result.sshcfg).toEqual('');
      });

      then('the plan reads as a snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t3] it is named in the `cloud://` form a crew verb hands', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_HETZNER,
          args: [`cloud://${ROW_HETZNER.name}`],
          sshcfg: null,
          env: {},
          credentials: false,
        }),
      );

      then('it wakes the registered grove — never "not registered"', () => {
        expect(result.exit).toEqual(0);
        expect(result.stderr).not.toContain('not registered');
        expect(result.sshcfg).toContain(
          'Host grove-sandpine-hetzner-v20261022\n',
        );
      });

      then(
        'the render reads as a snapshot, the bare name in its header',
        () => {
          expect(
            result.stdout.replace(/\S*\/home\//g, '$HOME_TMP/home/'),
          ).toMatchSnapshot();
        },
      );
    });

    when('[t4] it is woken from a machine that is not a tailnet peer', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_HETZNER,
          args: [ROW_HETZNER.name],
          sshcfg: null,
          env: { TS_STUB_EXIT: '1', TS_STUB_SAID: 'Logged out.' },
          credentials: false,
        }),
      );

      then('🔴 it halts at once, exit 2, before any ssh await', () => {
        expect(result.exit).toEqual(2);
        expect(result.calls.filter((c) => c.startsWith('ssh '))).toEqual([]);
      });

      then('it quotes tailscale, and names the rejoin as the fix', () => {
        expect(result.stderr).toContain('not a tailnet peer');
        expect(result.stderr).toContain('Logged out.');
        expect(result.stderr).toContain('tailscale up');
        expect(result.sshcfg).toEqual('');
      });

      then('the halt reads as a snapshot', () => {
        expect(result.said).toMatchSnapshot();
      });
    });

    when('[t5] the box answers, and refuses our key', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_HETZNER,
          args: [ROW_HETZNER.name, '--timeout', '120'],
          sshcfg: null,
          env: {
            SSH_STUB_EXIT: '255',
            SSH_STUB_SAID:
              'camper@grove-sandpine-hetzner-v20261022-1: Permission denied (publickey).',
          },
          credentials: false,
        }),
      );

      then(
        '🔴 it halts at once, exit 2 — one ssh try, never the whole --timeout',
        () => {
          expect(result.exit).toEqual(2);
          expect(result.calls.filter((c) => c.startsWith('ssh '))).toHaveLength(
            1,
          );
        },
      );

      then('its cure is the key, never the tailnet checks', () => {
        expect(result.stderr).toContain('refused our key');
        expect(result.stderr).toContain('authorized_keys');
        expect(result.stderr).not.toContain('tailscale');
      });

      then('the halt reads as a snapshot', () => {
        expect(
          result.said.replace(/\S*\/home\//g, '$HOME_TMP/home/'),
        ).toMatchSnapshot();
      });
    });

    when('[t6] the box answers with a changed host key', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_HETZNER,
          args: [ROW_HETZNER.name, '--timeout', '120'],
          sshcfg: null,
          env: {
            SSH_STUB_EXIT: '255',
            SSH_STUB_SAID: 'Host key verification failed.',
          },
          credentials: false,
        }),
      );

      then('🔴 it halts at once, exit 2, and names ssh-keygen -R', () => {
        expect(result.exit).toEqual(2);
        expect(result.calls.filter((c) => c.startsWith('ssh '))).toHaveLength(
          1,
        );
        expect(result.stderr).toContain(
          'ssh-keygen -R grove-sandpine-hetzner-v20261022-1',
        );
        expect(result.stderr).not.toContain('tailscale');
      });

      then('the halt reads as a snapshot', () => {
        expect(
          result.said.replace(/\S*\/home\//g, '$HOME_TMP/home/'),
        ).toMatchSnapshot();
      });
    });

    when('[t7] the box refuses the connect (no sshd on its port)', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_HETZNER,
          args: [ROW_HETZNER.name, '--timeout', '120'],
          sshcfg: null,
          env: {
            SSH_STUB_EXIT: '255',
            SSH_STUB_SAID:
              'ssh: connect to host grove-sandpine-hetzner-v20261022-1 port 22: Connection refused',
          },
          credentials: false,
        }),
      );

      then(
        '🔴 it halts at once, exit 2 — a box with no power lever does not boot under the wake',
        () => {
          expect(result.exit).toEqual(2);
          expect(result.calls.filter((c) => c.startsWith('ssh '))).toHaveLength(
            1,
          );
        },
      );

      then(
        'its cure is sshd and the port, never the tailnet checks, never another wake (c34)',
        () => {
          expect(result.stderr).toContain(
            'is sshd up there, and is 22 its port?',
          );
          expect(result.stderr).not.toContain('tailscale');
          expect(result.stderr).not.toContain('STARVED');
        },
      );

      then('the halt reads as a snapshot', () => {
        expect(result.said).toMatchSnapshot();
      });
    });

    when('[t8] the box accepts the connect and sends no banner in time', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_HETZNER,
          args: [ROW_HETZNER.name, '--timeout', '0'],
          sshcfg: null,
          env: {
            SSH_STUB_EXIT: '255',
            SSH_STUB_SAID:
              'Connection timed out during banner exchange\nConnection to 100.64.0.9 port 22 timed out',
          },
          credentials: false,
        }),
      );

      then('it exits 1 and leads with the starved cause', () => {
        expect(result.exit).toEqual(1);
        expect(result.stderr).toContain('STARVED');
        expect(result.stderr).toContain(
          'rhx git.grove.saturation grove-sandpine-hetzner-v20261022',
        );
      });

      then(
        '🔴 the tailnet carried the connect, so its checks are skipped',
        () => {
          expect(result.stderr).not.toContain('first, is THIS machine');
          expect(result.stderr).not.toContain('tailscale');
        },
      );

      then('the starved halt reads as a snapshot', () => {
        expect(
          result.said.replace(/\S*\/home\//g, '$HOME_TMP/home/'),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case5] a grove that is not registered', () => {
    when('[t0] it is woken', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_HETZNER,
          args: ['grove-sandpine-unregistered'],
          sshcfg: null,
          env: {},
          credentials: false,
        }),
      );

      then('🔴 it exits 2 and shows BOTH row shapes — tailnet first', () => {
        expect(result.exit).toEqual(2);
        const iTailnet = result.stderr.indexOf(
          'git grove set grove-sandpine-unregistered --at camper@<tailnet-host>:22',
        );
        const iEc2 = result.stderr.indexOf('--account <id>');
        expect(iTailnet).toBeGreaterThan(-1);
        expect(iEc2).toBeGreaterThan(iTailnet);
        expect(result.calls).toEqual([]);
      });

      then('the hint reads as a snapshot', () => {
        expect(result.said).toMatchSnapshot();
      });
    });
  });

  given('[case6] an ec2 grove whose box is stopped — the aws power leg', () => {
    const ROW_EC2_NAT = { ...ROW_EC2_RELIC, nat: 'nat-sandpine-camp' };

    when('[t0] it is woken with live credentials', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_EC2_RELIC,
          args: [ROW_EC2_RELIC.name],
          sshcfg: null,
          env: { AWS_STUB_STATE: 'stopped' },
          credentials: true,
        }),
      );

      then('it exits 0', () => {
        expect(result.exit).toEqual(0);
      });

      then(
        '🔴 it starts the box, then awaits ssh — power first, reach after',
        () => {
          const iStart = result.calls.findIndex((c) =>
            c.startsWith('aws ec2 start-instances'),
          );
          const iSsh = result.calls.findIndex((c) => c.startsWith('ssh '));
          expect(iStart).toBeGreaterThanOrEqual(0);
          expect(iSsh).toBeGreaterThan(iStart);
          expect(result.stdout).toContain('[UPDATE] stopped →');
        },
      );

      then('no ssm call, ever', () => {
        expect(result.calls.filter((c) => c.startsWith('aws ssm'))).toEqual([]);
      });

      then('the start-and-await render reads as a snapshot', () => {
        expect(
          result.stdout.replace(/\S*\/home\//g, '$HOME_TMP/home/'),
        ).toMatchSnapshot();
      });
    });

    when('[t1] it is planned', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_EC2_RELIC,
          args: [ROW_EC2_RELIC.name, '--mode', 'plan'],
          sshcfg: null,
          env: { AWS_STUB_STATE: 'stopped' },
          credentials: true,
        }),
      );

      then('it names the start, and starts naught, and dials naught', () => {
        expect(result.exit).toEqual(0);
        expect(result.stdout).toContain('[UPDATE] stopped →');
        expect(
          result.calls.filter((c) => c.includes('start-instances')),
        ).toEqual([]);
        expect(result.calls.filter((c) => c.startsWith('ssh '))).toEqual([]);
      });

      then('the plan reads as a snapshot', () => {
        expect(
          result.stdout.replace(/\S*\/home\//g, '$HOME_TMP/home/'),
        ).toMatchSnapshot();
      });
    });

    when('[t2] the session is in another account', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_EC2_RELIC,
          args: [ROW_EC2_RELIC.name],
          sshcfg: null,
          env: { AWS_STUB_STATE: 'stopped', AWS_STUB_ACCOUNT: '111111111111' },
          credentials: true,
        }),
      );

      then(
        '🔴 it exits 2 before any start — a paid act gated on the account',
        () => {
          expect(result.exit).toEqual(2);
          expect(result.stderr).toContain('wrong aws account');
          expect(
            result.calls.filter((c) => c.includes('start-instances')),
          ).toEqual([]);
          expect(result.calls.filter((c) => c.startsWith('ssh '))).toEqual([]);
        },
      );

      then('the refusal reads as a snapshot', () => {
        expect(
          result.said.replace(/\S*\/home\//g, '$HOME_TMP/home/'),
        ).toMatchSnapshot();
      });
    });

    /**
     * .what = the one case that calls the real aws: its lack-of-creds failure
     * .why  = every other case stubs aws (a start costs money). this one hands
     *         the real aws cli a key the real sts refuses, so the contract the
     *         wake leans on — no readable account, no paid act — is proven
     *         against the service itself, not a stub
     */
    when('[t4] the real aws refuses the session (no valid credentials)', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_EC2_RELIC,
          args: [ROW_EC2_RELIC.name],
          sshcfg: null,
          env: {
            AWS_DEFAULT_REGION: 'us-east-1',
            AWS_EC2_METADATA_DISABLED: 'true',
          },
          credentials: true,
          awsReal: true,
        }),
      );

      then(
        '🔴 it exits 1 at the account guard — no account read, no start, no dial',
        () => {
          expect(result.exit).toEqual(1);
          expect(result.stderr).toContain('cannot read the active aws account');
          expect(result.stderr).toContain(
            'rhx keyrack unlock --owner ehmpath --env',
          );
          expect(result.calls.filter((c) => c.startsWith('ssh '))).toEqual([]);
        },
      );

      then('the refusal reads as a snapshot', () => {
        // the real aws words its own refusal; the wake's tree around it is ours
        expect(
          result.said
            .replace(/\S*\/home\//g, '$HOME_TMP/home/')
            .replace(
              /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
              '$REQUEST_ID',
            ),
        ).toMatchSnapshot();
      });
    });

    when('[t3] its row names a nat', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_EC2_NAT,
          args: [ROW_EC2_NAT.name],
          sshcfg: null,
          env: { AWS_STUB_STATE: 'stopped' },
          credentials: true,
        }),
      );

      then('the nat is driven before the box', () => {
        expect(result.exit).toEqual(0);
        const iNat = result.calls.findIndex((c) =>
          c.includes('Values=nat-sandpine-camp'),
        );
        const iBox = result.calls.findIndex((c) =>
          c.includes('Values=grove-sandpine-v20260901'),
        );
        expect(iNat).toBeGreaterThanOrEqual(0);
        expect(iBox).toBeGreaterThan(iNat);
      });

      then('the nat-then-box render reads as a snapshot', () => {
        expect(
          result.stdout.replace(/\S*\/home\//g, '$HOME_TMP/home/'),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case2] an ec2 grove whose row is an ssm-era relic, box up', () => {
    when('[t0] it is woken with live credentials', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_EC2_RELIC,
          args: [ROW_EC2_RELIC.name],
          sshcfg: SSHCFG_RELIC,
          env: {},
          credentials: true,
        }),
      );

      then('it exits 0', () => {
        expect(result.exit).toEqual(0);
      });

      then('aws only finds and checks the box — never ssm', () => {
        const aws = result.calls.filter((c) => c.startsWith('aws '));
        expect(aws.length).toBeGreaterThan(0);
        expect(
          aws.some((c) => c.startsWith('aws ec2 describe-instances')),
        ).toEqual(true);
        expect(aws.filter((c) => c.startsWith('aws ssm'))).toEqual([]);
        expect(aws.filter((c) => c.includes('start-instances'))).toEqual([]);
      });

      then(
        'it reaches the exid on 22 — the relic tunnel port is ignored',
        () => {
          const ssh = result.calls.filter((c) => c.startsWith('ssh '));
          expect(ssh[0]).toContain('-o HostName=grove-sandpine-v20260901');
          expect(ssh[0]).toContain('-p 22');
          expect(ssh[0]).not.toContain('36903');
        },
      );

      then('the relic alias converges: replaced, one block left', () => {
        expect(result.stdout).toContain('[REPLACE]');
        expect(result.sshcfg).not.toContain('HostName localhost');
        expect(result.sshcfg).not.toContain('Port 36903');
        expect(result.sshcfg).toContain(
          '  HostName grove-sandpine-v20260901\n',
        );
        expect(
          result.sshcfg.match(/^Host grove-sandpine-v20260901$/gm),
        ).toHaveLength(1);
      });

      then('the wake reads as a snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t2] it is woken and ssh does not answer', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: ROW_EC2_RELIC,
          args: [ROW_EC2_RELIC.name, '--timeout', '0'],
          sshcfg: SSHCFG_RELIC,
          env: {
            SSH_STUB_EXIT: '255',
            SSH_STUB_SAID:
              'ssh: connect to host grove-sandpine-v20260901 port 22: Connection timed out',
          },
          credentials: true,
        }),
      );

      then('it exits 1 and leaves the relic alias as it was', () => {
        expect(result.exit).toEqual(1);
        expect(result.sshcfg).toEqual(SSHCFG_RELIC);
      });

      then('it splits the two causes, with opposite cures', () => {
        expect(result.stderr).toContain('(a) it needs longer');
        expect(result.stderr).toContain('hibernate');
        expect(result.stderr).toContain(
          'rhx git.grove.wake grove-sandpine-v20260901',
        );
        expect(result.stderr).toContain('(b) 🔴 it is STARVED');
        expect(result.stderr).not.toMatch(/\bssm\b/);
      });

      then('the failure reads as a snapshot', () => {
        expect(result.said).toMatchSnapshot();
      });
    });

    when('[t1] it is woken again, with the alias already converged', () => {
      const result = useBeforeAll(async () => {
        const first = runWake({
          row: ROW_EC2_RELIC,
          args: [ROW_EC2_RELIC.name],
          sshcfg: SSHCFG_RELIC,
          env: {},
          credentials: true,
        });
        const second = runWake({
          row: ROW_EC2_RELIC,
          args: [ROW_EC2_RELIC.name],
          sshcfg: first.sshcfg,
          env: {},
          credentials: true,
          root: first.root,
        });
        return { first, second };
      });

      then('it keeps the alias untouched', () => {
        expect(result.second.exit).toEqual(0);
        // the alias leg's own words: `[KEEP]` alone also matches the box leg
        expect(result.second.stdout).toContain('ssh  [KEEP] alias');
        expect(result.second.stdout).not.toContain('[REPLACE]');
        expect(result.second.stdout).not.toContain('[SET]');
        expect(result.second.sshcfg).toEqual(result.first.sshcfg);
      });

      then('the converged render reads as a snapshot', () => {
        expect(result.second.stdout).toMatchSnapshot();
      });
    });
  });

  given(
    '[case3] an ec2 grove, and the keyrack will not hand over credentials',
    () => {
      when('[t0] it is woken', () => {
        const result = useBeforeAll(async () =>
          runWake({
            row: ROW_EC2_RELIC,
            args: [ROW_EC2_RELIC.name],
            sshcfg: SSHCFG_RELIC,
            env: {},
            credentials: false,
          }),
        );

        then('power fails before reach: exit 1, the rack named', () => {
          expect(result.exit).toEqual(1);
          expect(result.stderr).toContain('did not hand over AWS_PROFILE');
          expect(result.stderr).toContain('locked 🔒');
        });

        then('it never reaches for ssh, and leaves the alias as it was', () => {
          expect(result.calls.filter((c) => c.startsWith('ssh '))).toEqual([]);
          expect(result.sshcfg).toEqual(SSHCFG_RELIC);
        });

        then('the power failure reads as a snapshot', () => {
          expect(result.said).toMatchSnapshot();
        });
      });
    },
  );

  given('[case4] a grove whose row is not json', () => {
    when('[t0] it is woken', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: { name: 'grove-sandpine-corrupt' },
          rowText: '{ "name": "grove-sandpine-corrupt", ',
          args: ['grove-sandpine-corrupt'],
          sshcfg: SSHCFG_RELIC,
          env: {},
          credentials: true,
        }),
      );

      then('🔴 it halts as a constraint, exit 2, with the fix named', () => {
        expect(result.exit).toEqual(2);
        expect(result.stderr).toContain('grove row unreadable');
        expect(result.stderr).toContain('git grove set');
      });

      then('it calls no aws, no ssh, and leaves the alias as it was', () => {
        expect(result.calls).toEqual([]);
        expect(result.sshcfg).toEqual(SSHCFG_RELIC);
      });

      then('the halt reads as a snapshot, the temp forest masked', () => {
        expect(
          result.said.replace(/\S*\/groves\//g, '$FOREST/groves/'),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case7] a caller who asks how to wake', () => {
    when('[t0] the wake is run with --help', () => {
      const result = useBeforeAll(async () =>
        runWake({
          row: { name: 'grove-sandpine-hetzner-v20261022' },
          args: ['--help'],
          sshcfg: null,
          env: {},
          credentials: false,
        }),
      );

      then(
        'it names the tailnet reach and the aws power leg, never ssm',
        () => {
          const said = `${result.stdout}${result.stderr}`;
          expect(result.exit).toEqual(0);
          expect(said).toContain('tailnet');
          expect(said).not.toMatch(/\bssm\b(?! era| ?-era)/i);
        },
      );

      then('it calls no aws and no ssh', () => {
        expect(result.calls).toEqual([]);
      });

      then('the help reads as a snapshot', () => {
        expect(`${result.stdout}${result.stderr}`).toMatchSnapshot();
      });
    });
  });
});
