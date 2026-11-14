/**
 * .what = clamps what `git.grove.send` says when ssh cannot reach the grove
 *
 * .why  = the wake's final hint prescribes this verb as the next step. a bare
 *         ssh rc 255 renders as a generic failure with no next move, so each arm
 *         owes the grove's own cure, and a remote command's own exit code must
 *         pass through untouched
 *
 * .how  = hermetic. a temp forest holds the row, a temp HOME holds a converged
 *         alias, and a stub `ssh` sits first on PATH
 */
import { spawnSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../.test/tempDirs';

const PATH_SEND = join(__dirname, 'git.grove.send.sh');

const ROW_HETZNER = {
  name: 'grove-sandpine-hetzner-v20261022',
  host: 'grove-sandpine-hetzner-v20261022-1',
};
const SSHCFG_CONVERGED = `Host ${ROW_HETZNER.name}\n  HostName ${ROW_HETZNER.host}\n  Port 22\n  User camper\n`;

/**
 * .mock = the `ssh` binary, as a stub first on PATH
 * .why  = a real send dials a live grove. the stub answers with a chosen exit
 *         code; `ssh -G` (a local config parse, no network) goes to the real ssh
 *         so the alias convergence check reads the temp config truly
 * .real = the 5.3 verification: send against the hetzner grove over the tailnet
 */
const STUB_SSH = `#!/usr/bin/env bash
case " $* " in *" -G "*) exec "$REAL_SSH" "$@" ;; esac
[[ -n "\${SSH_STUB_SAID:-}" ]] && echo "$SSH_STUB_SAID" >&2
exit "\${SSH_STUB_EXIT:-0}"
`;

/** .what = run the send against the hetzner row, with a stub ssh on PATH */
const runSend = (input: { args: string[]; env: Record<string, string> }) => {
  const root = tempDirs.genOne({ slug: 'grove-send' });
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
  writeFileSync(join(bin, 'ssh'), STUB_SSH, { mode: 0o755 });
  const fileLocal = join(root, 'wish.md');
  writeFileSync(fileLocal, '# a wish\n');
  const realSsh = spawnSync('bash', ['-c', 'command -v ssh'], {
    encoding: 'utf8',
  }).stdout.trim();
  const out = spawnSync(
    'bash',
    [PATH_SEND, ...input.args.map((a) => (a === '<file>' ? fileLocal : a))],
    {
      encoding: 'utf8',
      input: '',
      env: {
        ...process.env,
        ...input.env,
        HOME: home,
        GIT_FOREST_DIR: forest,
        PATH: `${bin}:${process.env.PATH ?? ''}`,
        REAL_SSH: realSsh,
      },
      timeout: 60_000,
    },
  );
  return {
    stdout: out.stdout ?? '',
    stderr: out.stderr ?? '',
    exit: out.status,
  };
};

describe('git.grove.send', () => {
  afterAll(() => tempDirs.delAll());

  given('[case1] a hetzner grove (no aws lever) that ssh cannot reach', () => {
    when('[t0] a command is sent', () => {
      const result = useBeforeAll(async () =>
        runSend({
          args: [ROW_HETZNER.name, '--what', 'ls'],
          env: {
            SSH_STUB_EXIT: '255',
            SSH_STUB_SAID:
              'ssh: connect to host grove-sandpine-hetzner-v20261022-1 port 22: Connection timed out',
          },
        }),
      );

      then('it exits 1 and names the tailnet cure, never the wake', () => {
        expect(result.exit).toEqual(1);
        expect(result.stderr).toContain(
          'MalfunctionError: ssh could not reach grove-sandpine-hetzner-v20261022 (rc 255)',
        );
        expect(result.stderr).toContain('tailscale status');
        expect(result.stderr).not.toContain('git.grove.wake');
      });

      then('the words a human reads are pinned', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });

    when('[t1] a file is sent', () => {
      const result = useBeforeAll(async () =>
        runSend({
          args: [ROW_HETZNER.name, '--file', '<file>', '--into', '~/wish.md'],
          env: { SSH_STUB_EXIT: '255' },
        }),
      );

      then('it exits 1 and names the tailnet cure', () => {
        expect(result.exit).toEqual(1);
        expect(result.stderr).toContain('the write failed');
        expect(result.stderr).toContain('tailscale status');
      });

      then('the words a human reads are pinned', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case2] a grove that answers, and a command that fails there', () => {
    when('[t0] the remote command exits 3', () => {
      const result = useBeforeAll(async () =>
        runSend({
          args: [ROW_HETZNER.name, '--what', 'false'],
          env: { SSH_STUB_EXIT: '3' },
        }),
      );

      then('its own exit code passes through, with no reach cure', () => {
        expect(result.exit).toEqual(3);
        expect(result.stderr).not.toContain('MalfunctionError');
      });
    });
  });
});
