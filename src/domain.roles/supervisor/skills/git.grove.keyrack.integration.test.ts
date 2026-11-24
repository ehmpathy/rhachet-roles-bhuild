/**
 * .what = clamps on every output `git.grove.keyrack` prints: the refusals before any grove,
 *         the discovery refusals on a grove, a real set + read-back, and the malfunctions
 *
 * .why  = each output is a user-faced contract: the qualified header a caller or a clone
 *         matches on, the exit code that sorts constraint from malfunction, and the fix
 *         lines beneath. the grove cases run on `local` — the skill's own mode for this box —
 *         under a throwaway HOME, so a real `rhx keyrack set` + `get` round-trips on any box
 */
import { spawnSync } from 'child_process';
import { chmodSync, copyFileSync, mkdirSync, writeFileSync } from 'fs';
import { ConstraintError, MalfunctionError } from 'helpful-errors';
import { userInfo } from 'os';
import { join } from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

const PATH_SKILL = join(__dirname, 'git.grove.keyrack.sh');

// util-linux's pty wrapper — the one binary that hands a child a real terminal on stdin
const BIN_PTY = 'script';

const CASES: { slug: string; args: string[]; header: string }[] = [
  {
    slug: 'an unknown flag',
    args: ['set', 'grove-1', '--anyway'],
    header: "✋ ConstraintError: git.grove.keyrack: unknown arg '--anyway'",
  },
  {
    slug: 'two groves',
    args: ['set', 'grove-1', 'grove-2'],
    header:
      "✋ ConstraintError: git.grove.keyrack: more than one grove given ('grove-1', 'grove-2')",
  },
  {
    slug: 'no verb',
    args: [],
    header: '✋ ConstraintError: git.grove.keyrack: a verb is required',
  },
  {
    slug: 'an unknown verb',
    args: ['get', 'grove-1'],
    header: "✋ ConstraintError: git.grove.keyrack: unknown verb 'get'",
  },
  {
    slug: 'no grove',
    args: ['set'],
    header: '✋ ConstraintError: git.grove.keyrack: a grove is required',
  },
  {
    slug: 'no --org, --key, or --env',
    args: ['set', 'grove-1'],
    header:
      '✋ ConstraintError: git.grove.keyrack: --org, --key, and --env are all required',
  },
  {
    slug: 'no --value',
    args: [
      'set',
      'grove-1',
      '--org',
      'sandpine',
      '--key',
      'K',
      '--env',
      'prep',
    ],
    header: '✋ ConstraintError: git.grove.keyrack: --value is required',
  },
  {
    slug: 'a literal --value',
    args: [
      'set',
      'grove-1',
      '--org',
      'sandpine',
      '--key',
      'K',
      '--env',
      'prep',
      '--value',
      'not-a-secret',
    ],
    header:
      '✋ ConstraintError: git.grove.keyrack: --value must be @stdin, never a literal',
  },
  {
    slug: 'an empty pipe',
    args: [
      'set',
      'grove-1',
      '--org',
      'sandpine',
      '--key',
      'K',
      '--env',
      'prep',
      '--value',
      '@stdin',
    ],
    header: '✋ ConstraintError: git.grove.keyrack: the piped value is empty',
  },
];

/**
 * .what = the args of a `set local` call, under one owner + vault
 * .why  = every grove case below differs only in its HOME and its vault
 * .note = a null vault omits `--vault`, so the skill's own default is the one exercised
 */
const asLocalSetArgs = (input: { vault: string | null }): string[] => [
  'set',
  'local',
  '--org',
  'sandpine',
  '--key',
  'LESSON_API_KEY',
  '--env',
  'prep',
  '--value',
  '@stdin',
  '--owner',
  'bert',
  ...(input.vault ? ['--vault', input.vault] : []),
];

/**
 * .what = a throwaway HOME that holds one repo of org `sandpine`, in the shape the skill finds
 * .why  = the skill discovers its repo under `$HOME/git/<org>/`, so a HOME is the whole grove
 */
const genGroveHome = (input: {
  slug: string;
  repo: { keyrack: string } | null;
}): { home: string } => {
  const home = genTempDir({ slug: input.slug });
  if (!input.repo) return { home };

  // the repo: a .git marker for discovery, and the keyrack manifest it reads
  const repo = join(home, 'git', 'sandpine', 'svc-lessons');
  mkdirSync(join(repo, '.git'), { recursive: true });
  mkdirSync(join(repo, '.agent'), { recursive: true });
  writeFileSync(join(repo, '.agent', 'keyrack.yml'), input.repo.keyrack);
  return { home };
};

/**
 * .what = run the skill on `local`, under a HOME, with a value piped in
 * .why  = one call shape for every grove case; the HOME path is masked so a snapshot holds
 */
const runLocalSet = (input: {
  grove: { home: string };
  value: string;
  vault: string | null;
  fake: { dir: string } | null;
}) => {
  const result = spawnSync('bash', [PATH_SKILL, ...asLocalSetArgs(input)], {
    encoding: 'utf8',
    input: input.value,
    env: {
      ...process.env,
      HOME: input.grove.home,
      PATH: input.fake
        ? `${input.fake.dir}:${process.env.PATH}`
        : process.env.PATH,
    },
  });
  const asMasked = (text: string) => text.split(input.grove.home).join('$HOME');
  return {
    status: result.status,
    stdout: asMasked(result.stdout),
    stderr: asMasked(result.stderr),
  };
};

const KEYRACK_INSTALLED = 'org: sandpine\nenv.prep:\n  - LESSON_API_KEY\n';

/**
 * .what = give a grove HOME a real keyrack host: an ssh recipient key, then `keyrack init`
 * .why  = a fresh HOME has no host manifest, and `keyrack set` refuses without one
 */
const setKeyrackHost = (input: { grove: { home: string } }): void => {
  const env = { ...process.env, HOME: input.grove.home };
  const prikey = join(input.grove.home, '.ssh', 'id_ed25519');
  mkdirSync(join(input.grove.home, '.ssh'), { recursive: true });

  // mint the recipient key the host manifest is sealed to
  const keygen = spawnSync(
    'ssh-keygen',
    ['-q', '-t', 'ed25519', '-N', '', '-f', prikey],
    { encoding: 'utf8', env },
  );
  if (keygen.status !== 0)
    throw new MalfunctionError('ssh-keygen failed', { stderr: keygen.stderr });

  // init the host manifest, from inside the repo whose org it serves
  const init = spawnSync(
    'rhx',
    ['keyrack', 'init', '--owner', 'bert', '--prikey', prikey],
    {
      encoding: 'utf8',
      env,
      cwd: join(input.grove.home, 'git', 'sandpine', 'svc-lessons'),
    },
  );
  if (init.status !== 0)
    throw new MalfunctionError('keyrack init failed', {
      stdout: init.stdout,
      stderr: init.stderr,
    });
};

/**
 * .mock = a fake `rhx` that configures naught and reads back a fixed string, or fails the read
 * .why  = a real keyrack never stores bytes other than those piped in, and never fails a get
 *         right after a set, so the three read-back malfunctions are unreachable through it.
 *         the fake stands in for a vault that drops, mangles, or refuses the value — the
 *         exact defect each guard exists to catch. no real input can produce any of the three
 * .real = the real keyrack round-trip runs twice, unfaked: on `local`
 *         (`an installed repo of the org, and a real keyrack`) and over ssh
 *         (`a remote grove reached over a real ssh hop`)
 */
const genFakeRhx = (input: {
  slug: string;
  readback: string;
  getExit: number;
}): { dir: string } => {
  const dir = genTempDir({ slug: input.slug });
  const bin = join(dir, 'rhx');
  writeFileSync(
    bin,
    [
      '#!/usr/bin/env bash',
      'if [[ "$2" == "set" ]]; then cat >/dev/null; echo "configured"; exit 0; fi',
      `if [[ "$2" == "get" ]]; then printf '%s' '${input.readback}'; exit ${input.getExit}; fi`,
      'exit 0',
      '',
    ].join('\n'),
  );
  chmodSync(bin, 0o755);
  return { dir };
};

/**
 * .what = a real ssh grove on this box: a throwaway `sshd -i` behind a ProxyCommand, sealed to
 *         a throwaway client key, whose far side runs under the grove HOME
 * .why  = the set's whole external contract is one ssh hop — the value rides stdin over the
 *         wire into `keyrack set`, and the read-back hashes it on the far side. this proves that
 *         hop for real, with no network grove and no port: sshd speaks the protocol on the pipe
 * .note = the `ssh` shim on PATH only adds `-F <config>`; the transport, auth, and far-side
 *         shell are the real binaries. ForceCommand pins HOME so the real keyrack is never read
 */
const genLoopbackGrove = (input: {
  grove: { home: string };
}): { host: string; shim: { dir: string } } => {
  // fail fast where the box lacks a server; a skip would read as a pass
  const BIN_SSHD = '/usr/sbin/sshd';
  const probe = spawnSync(BIN_SSHD, ['-V'], { encoding: 'utf8' });
  if (probe.error)
    throw new ConstraintError('a loopback grove needs openssh-server', {
      bin: BIN_SSHD,
      hint: 'install openssh-server on this box',
    });

  // mint the server's host key and the client's identity
  const dir = genTempDir({ slug: 'keyrack-loopback-ssh' });
  const asKey = (name: string) => {
    const keygen = spawnSync(
      'ssh-keygen',
      ['-q', '-t', 'ed25519', '-N', '', '-f', join(dir, name)],
      { encoding: 'utf8' },
    );
    if (keygen.status !== 0)
      throw new MalfunctionError('ssh-keygen failed', {
        stderr: keygen.stderr,
      });
    return join(dir, name);
  };
  const keyHost = asKey('host_ed25519');
  const keyClient = asKey('client_ed25519');
  copyFileSync(`${keyClient}.pub`, join(dir, 'authorized_keys'));

  // the server: one key, no pam, and a far side pinned to the grove HOME
  writeFileSync(
    join(dir, 'sshd_config'),
    [
      `HostKey ${keyHost}`,
      `AuthorizedKeysFile ${join(dir, 'authorized_keys')}`,
      'StrictModes no',
      'UsePAM no',
      'PasswordAuthentication no',
      'KbdInteractiveAuthentication no',
      'PubkeyAuthentication yes',
      'PidFile none',
      'LogLevel QUIET',
      `ForceCommand env HOME=${input.grove.home} PATH=${process.env.PATH} bash -c "$SSH_ORIGINAL_COMMAND"`,
      '',
    ].join('\n'),
  );

  // the client: the grove alias, reached through sshd on a pipe
  const host = 'grove-loop';
  writeFileSync(
    join(dir, 'ssh_config'),
    [
      `Host ${host}`,
      `  ProxyCommand ${BIN_SSHD} -i -f ${join(dir, 'sshd_config')}`,
      `  User ${userInfo().username}`,
      `  IdentityFile ${keyClient}`,
      '  IdentitiesOnly yes',
      '  StrictHostKeyChecking no',
      '  UserKnownHostsFile /dev/null',
      '  LogLevel ERROR',
      '',
    ].join('\n'),
  );

  // the shim: real ssh, with this config
  const shim = { dir: join(dir, 'bin') };
  mkdirSync(shim.dir, { recursive: true });
  writeFileSync(
    join(shim.dir, 'ssh'),
    `#!/usr/bin/env bash\nexec /usr/bin/ssh -F ${join(dir, 'ssh_config')} "$@"\n`,
  );
  chmodSync(join(shim.dir, 'ssh'), 0o755);
  return { host, shim };
};

describe('git.grove.keyrack', () => {
  CASES.map((thisCase) =>
    given(`[case] ${thisCase.slug}`, () => {
      when('[t0] the skill is invoked', () => {
        const result = useThen('it exits', async () =>
          spawnSync('bash', [PATH_SKILL, ...thisCase.args], {
            encoding: 'utf8',
            input: '',
          }),
        );

        then('it exits 2, a constraint', () => {
          expect(result.status).toEqual(2);
        });

        then('stderr opens with the qualified header', () => {
          expect(result.stderr.split('\n')[0]).toEqual(thisCase.header);
        });

        then('stdout stays empty', () => {
          expect(result.stdout).toEqual('');
        });

        then('the refusal matches its snapshot', () => {
          expect(result.stderr).toMatchSnapshot();
        });
      });
    }),
  );

  given('[case] the caller asks for help', () => {
    when('[t0] the skill is invoked with --help', () => {
      const result = useThen('it exits', async () =>
        spawnSync('bash', [PATH_SKILL, '--help'], {
          encoding: 'utf8',
          input: '',
        }),
      );

      then('it exits 0', () => {
        expect(result.stderr).toEqual('');
        expect(result.status).toEqual(0);
      });

      then('the guide names the usage', () => {
        expect(result.stdout).toContain('git.grove.keyrack');
      });

      then('the guide matches its snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });

    // the skill answers `--help`, `-h`, and `help` alike; each alias prints the same guide
    ['-h', 'help'].map((alias, index) =>
      when(`[t${index + 1}] the skill is invoked with ${alias}`, () => {
        const results = useThen('both exit', async () => ({
          alias: spawnSync('bash', [PATH_SKILL, alias], {
            encoding: 'utf8',
            input: '',
          }),
          canon: spawnSync('bash', [PATH_SKILL, '--help'], {
            encoding: 'utf8',
            input: '',
          }),
        }));

        then('it exits 0 with no stderr', () => {
          expect(results.alias.stderr).toEqual('');
          expect(results.alias.status).toEqual(0);
        });

        then('it prints the --help guide, byte for byte', () => {
          expect(results.alias.stdout).toEqual(results.canon.stdout);
        });
      }),
    );
  });

  given('[case] stdin is a terminal', () => {
    when('[t0] the skill is invoked under a pty, with naught piped', () => {
      const result = useThen('it exits', async () =>
        spawnSync(
          BIN_PTY,
          [
            '-qec',
            `bash ${PATH_SKILL} ${asLocalSetArgs({ vault: 'os.direct' }).join(' ')}`,
            '/dev/null',
          ],
          { encoding: 'utf8' },
        ),
      );

      then('it exits 2, never a hang', () => {
        expect(result.status).toEqual(2);
      });

      then('the output names the terminal', () => {
        expect(result.stdout).toContain(
          '✋ ConstraintError: git.grove.keyrack: --value @stdin, but stdin is a terminal',
        );
      });

      then('the refusal matches its snapshot', () => {
        expect(result.stdout.replace(/\r/g, '')).toMatchSnapshot();
      });
    });
  });

  given('[case] the grove holds no repo of the org', () => {
    const grove = useBeforeAll(async () =>
      genGroveHome({ slug: 'keyrack-no-repo', repo: null }),
    );

    when('[t0] the skill is invoked on local', () => {
      const result = useThen('it exits', async () =>
        runLocalSet({ grove, value: 'x', vault: 'os.direct', fake: null }),
      );

      then('it exits 2 and names the absent repo', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain(
          "✋ ConstraintError: git.grove.keyrack: no repo of org 'sandpine' on this box",
        );
      });

      then('the output matches its snapshot', () => {
        expect({
          stdout: result.stdout,
          stderr: result.stderr,
        }).toMatchSnapshot();
      });
    });
  });

  given('[case] the only repo of the org was never installed', () => {
    const grove = useBeforeAll(async () =>
      genGroveHome({
        slug: 'keyrack-uninstalled',
        repo: {
          keyrack: `org: sandpine\nextends:\n  - .agent/repo=rhachet/keyrack.yml\n`,
        },
      }),
    );

    when('[t0] the skill is invoked on local', () => {
      const result = useThen('it exits', async () =>
        runLocalSet({ grove, value: 'x', vault: 'os.direct', fake: null }),
      );

      then('it exits 2 and names the uninstalled repo', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain(
          "✋ ConstraintError: git.grove.keyrack: no INSTALLED repo of org 'sandpine' on this box",
        );
      });

      then('the output matches its snapshot', () => {
        expect({
          stdout: result.stdout,
          stderr: result.stderr,
        }).toMatchSnapshot();
      });
    });
  });

  given('[case] the repo declares no org', () => {
    const grove = useBeforeAll(async () =>
      genGroveHome({
        slug: 'keyrack-no-org',
        repo: { keyrack: 'env.prep:\n  - LESSON_API_KEY\n' },
      }),
    );

    when('[t0] the skill is invoked on local', () => {
      const result = useThen('it exits', async () =>
        runLocalSet({ grove, value: 'x', vault: 'os.direct', fake: null }),
      );

      then('it exits 2 and names the absent org', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('has no org in .agent/keyrack.yml');
      });

      then('the output matches its snapshot', () => {
        expect({
          stdout: result.stdout,
          stderr: result.stderr,
        }).toMatchSnapshot();
      });
    });
  });

  given('[case] the repo declares another org', () => {
    const grove = useBeforeAll(async () =>
      genGroveHome({
        slug: 'keyrack-org-mismatch',
        repo: { keyrack: 'org: reefline\nenv.prep:\n  - LESSON_API_KEY\n' },
      }),
    );

    when('[t0] the skill is invoked on local', () => {
      const result = useThen('it exits', async () =>
        runLocalSet({ grove, value: 'x', vault: 'os.direct', fake: null }),
      );

      then('it exits 2 and names both orgs', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain(
          "✋ ConstraintError: git.grove.keyrack: the repo's org does not match --org",
        );
      });

      then('the output matches its snapshot', () => {
        expect({
          stdout: result.stdout,
          stderr: result.stderr,
        }).toMatchSnapshot();
      });
    });
  });

  given('[case] an installed repo of the org, and a real keyrack', () => {
    const grove = useBeforeAll(async () => {
      const found = genGroveHome({
        slug: 'keyrack-real-set',
        repo: { keyrack: KEYRACK_INSTALLED },
      });
      setKeyrackHost({ grove: found });
      return found;
    });

    when('[t0] a value is piped in, to the os.direct vault', () => {
      const result = useThen('it exits', async () =>
        runLocalSet({
          grove,
          value: 'lesson-key-value\n',
          vault: 'os.direct',
          fake: null,
        }),
      );

      then('it exits 0', () => {
        expect(result.stderr).toEqual('');
        expect(result.status).toEqual(0);
      });

      then('the read-back proves the same bytes landed', () => {
        expect(result.stdout).toContain(
          '🟢 sha256 matches — the same bytes landed',
        );
        expect(result.stdout).toContain(
          '🌊 sandpine.prep.LESSON_API_KEY is set on this box',
        );
      });

      then('the value is never printed', () => {
        expect(result.stdout).not.toContain('lesson-key-value');
      });

      then('the success tree matches its snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t1] the vault is one keyrack does not know', () => {
      const result = useThen('it exits', async () =>
        runLocalSet({
          grove,
          value: 'lesson-key-value',
          vault: 'os.nowhere',
          fake: null,
        }),
      );

      then('it exits 1, a malfunction', () => {
        expect(result.status).toEqual(1);
        expect(result.stderr).toContain(
          '💥 MalfunctionError: git.grove.keyrack: keyrack set failed on this box',
        );
      });

      then('the value is never printed', () => {
        expect(result.stderr).not.toContain('lesson-key-value');
      });

      then('the malfunction matches its snapshot', () => {
        expect({
          stdout: result.stdout,
          stderr: result.stderr,
        }).toMatchSnapshot();
      });
    });

    when('[t3] the grant is one keyrack does not know', () => {
      const result = useThen('it exits', async () => {
        const run = spawnSync(
          'bash',
          [
            PATH_SKILL,
            ...asLocalSetArgs({ vault: 'os.direct' }),
            '--grant',
            'NOT_A_MECH',
          ],
          {
            encoding: 'utf8',
            input: 'lesson-key-value',
            env: { ...process.env, HOME: grove.home },
          },
        );
        return {
          status: run.status,
          stdout: run.stdout.split(grove.home).join('$HOME'),
          stderr: run.stderr.split(grove.home).join('$HOME'),
        };
      });

      then(
        'it exits 1: the grant reached keyrack, and keyrack refused it',
        () => {
          expect(result.status).toEqual(1);
          expect(result.stderr).toContain(
            '💥 MalfunctionError: git.grove.keyrack: keyrack set failed on this box',
          );
          expect(result.stderr).toContain('NOT_A_MECH');
        },
      );

      then('the value is never printed', () => {
        expect(result.stderr).not.toContain('lesson-key-value');
      });

      then('the malfunction matches its snapshot', () => {
        expect({
          stdout: result.stdout,
          stderr: result.stderr,
        }).toMatchSnapshot();
      });
    });

    when(
      '[t2] a value is piped in, with no --vault, so the default vault is used',
      () => {
        const result = useThen('it exits', async () =>
          runLocalSet({
            grove,
            value: 'lesson-key-default',
            vault: null,
            fake: null,
          }),
        );

        then('it exits 0', () => {
          expect(result.stderr).toEqual('');
          expect(result.status).toEqual(0);
        });

        then('the default vault is os.secure', () => {
          expect(result.stdout).toContain('os.secure');
        });

        then('the read-back proves the same bytes landed', () => {
          expect(result.stdout).toContain(
            '🟢 sha256 matches — the same bytes landed',
          );
        });

        then('the value is never printed', () => {
          expect(result.stdout).not.toContain('lesson-key-default');
        });

        then('the success tree matches its snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      },
    );
  });

  given('[case] a remote grove reached over a real ssh hop', () => {
    const scene = useBeforeAll(async () => {
      const grove = genGroveHome({
        slug: 'keyrack-ssh-set',
        repo: { keyrack: KEYRACK_INSTALLED },
      });
      setKeyrackHost({ grove });
      return { grove, loop: genLoopbackGrove({ grove }) };
    });

    when('[t0] a value is piped in, to the os.direct vault', () => {
      const result = useThen('it exits', async () => {
        const run = spawnSync(
          'bash',
          [
            PATH_SKILL,
            ...asLocalSetArgs({ vault: 'os.direct' }).map((arg) =>
              arg === 'local' ? `cloud://${scene.loop.host}` : arg,
            ),
          ],
          {
            encoding: 'utf8',
            input: 'lesson-key-remote\n',
            env: {
              ...process.env,
              PATH: `${scene.loop.shim.dir}:${process.env.PATH}`,
            },
          },
        );
        const asMasked = (text: string) =>
          text.split(scene.grove.home).join('$HOME');
        return {
          status: run.status,
          stdout: asMasked(run.stdout),
          stderr: asMasked(run.stderr),
        };
      });

      then('it exits 0', () => {
        expect(result.stderr).toEqual('');
        expect(result.status).toEqual(0);
      });

      then('the hop is proven before any read', () => {
        expect(result.stdout).toContain('🟢 reached grove-loop');
      });

      then('the read-back over the wire proves the same bytes landed', () => {
        expect(result.stdout).toContain(
          '🟢 sha256 matches — the same bytes landed',
        );
      });

      then('the value is never printed', () => {
        expect(result.stdout).not.toContain('lesson-key-remote');
      });

      then('the success tree matches its snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case] a remote grove that ssh cannot reach', () => {
    // a real ssh call: `.invalid` is reserved (rfc 2606), so the name never resolves
    when('[t0] the skill is invoked on the grove', () => {
      const result = useThen('it exits', async () =>
        spawnSync(
          'bash',
          [
            PATH_SKILL,
            ...asLocalSetArgs({ vault: 'os.direct' }).map((arg) =>
              arg === 'local' ? 'cloud://grove-absent.invalid' : arg,
            ),
          ],
          { encoding: 'utf8', input: 'lesson-key-value' },
        ),
      );

      then('it exits 1, a malfunction', () => {
        expect(result.status).toEqual(1);
        expect(result.stderr).toContain(
          "💥 MalfunctionError: git.grove.keyrack: cannot reach grove 'grove-absent.invalid' over ssh",
        );
      });

      then('it never reports the grove as empty of repos', () => {
        expect(result.stderr).not.toContain('no repo of org');
      });

      then('the value is never printed', () => {
        expect(result.stdout).not.toContain('lesson-key-value');
        expect(result.stderr).not.toContain('lesson-key-value');
      });

      then('the malfunction matches its snapshot', () => {
        // ssh's own words vary by platform, so that one line is masked
        expect({
          stdout: result.stdout,
          stderr: result.stderr.replace(/ssh said: .*/, 'ssh said: <masked>'),
        }).toMatchSnapshot();
      });
    });
  });

  given('[case] a vault that stores nought', () => {
    const grove = useBeforeAll(async () =>
      genGroveHome({
        slug: 'keyrack-empty-back',
        repo: { keyrack: KEYRACK_INSTALLED },
      }),
    );
    const fake = useBeforeAll(async () =>
      genFakeRhx({ slug: 'keyrack-fake-empty', readback: '', getExit: 0 }),
    );

    when('[t0] a value is piped in', () => {
      const result = useThen('it exits', async () =>
        runLocalSet({ grove, value: 'x', vault: 'os.direct', fake }),
      );

      then('it exits 1, and names the empty read-back', () => {
        expect(result.status).toEqual(1);
        expect(result.stderr).toContain(
          '💥 MalfunctionError: git.grove.keyrack: the set reported success and stored nought',
        );
      });

      then('the malfunction matches its snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case] a vault that mangles the value', () => {
    const grove = useBeforeAll(async () =>
      genGroveHome({
        slug: 'keyrack-mangled-back',
        repo: { keyrack: KEYRACK_INSTALLED },
      }),
    );
    const fake = useBeforeAll(async () =>
      genFakeRhx({
        slug: 'keyrack-fake-mangled',
        readback: 'not-the-value',
        getExit: 0,
      }),
    );

    when('[t0] a value is piped in', () => {
      const result = useThen('it exits', async () =>
        runLocalSet({
          grove,
          value: 'lesson-key-value',
          vault: 'os.direct',
          fake,
        }),
      );

      then('it exits 1, and names the mismatch', () => {
        expect(result.status).toEqual(1);
        expect(result.stderr).toContain(
          '💥 MalfunctionError: git.grove.keyrack: the read-back does not match',
        );
      });

      then('the malfunction matches its snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case] a vault that refuses the read-back', () => {
    const grove = useBeforeAll(async () =>
      genGroveHome({
        slug: 'keyrack-refused-back',
        repo: { keyrack: KEYRACK_INSTALLED },
      }),
    );
    const fake = useBeforeAll(async () =>
      genFakeRhx({ slug: 'keyrack-fake-refused', readback: '', getExit: 1 }),
    );

    when('[t0] a value is piped in', () => {
      const result = useThen('it exits', async () =>
        runLocalSet({
          grove,
          value: 'lesson-key-value',
          vault: 'os.direct',
          fake,
        }),
      );

      then('it exits 1, and names the failed read-back', () => {
        expect(result.status).toEqual(1);
        expect(result.stderr).toContain(
          '💥 MalfunctionError: git.grove.keyrack: the set reported success, and the read-back failed',
        );
      });

      then('the value is never printed', () => {
        expect(result.stderr).not.toContain('lesson-key-value');
      });

      then('the malfunction matches its snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });
});
