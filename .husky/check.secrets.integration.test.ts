import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

/**
 * .what = one fake key per shape the gate scans for
 * .why  = each key is assembled from parts at runtime, so this file holds no key shape and
 *         passes the very gate it tests; every tail is an obvious fake, never a real key
 */
const KEY_CASES: { shape: string; key: string }[] = [
  { shape: 'aws access key id', key: ['AKIA', 'Z'.repeat(16)].join('') },
  {
    shape: 'private key block',
    key: ['-----BEGIN', 'RSA PRIVATE', 'KEY-----'].join(' '),
  },
  { shape: 'github token', key: ['ghp', '_', 'z'.repeat(36)].join('') },
  { shape: 'anthropic key', key: ['sk', '-ant-', 'z'.repeat(24)].join('') },
  { shape: 'openai-style key', key: ['sk', '-', 'z'.repeat(24)].join('') },
  { shape: 'xai key', key: ['xai', '-', 'z'.repeat(24)].join('') },
  { shape: 'fireworks key', key: ['fw', '_', 'z'.repeat(24)].join('') },
  { shape: 'slack token', key: ['xoxb', '-', 'z'.repeat(12)].join('') },
  { shape: 'stripe secret key', key: ['sk', '_live_', 'z'.repeat(20)].join('') },
];

/**
 * .what = stage one file in a fresh git repo, then run a copy of this repo's secrets gate on it
 * .why  = the gate is what a human meets at commit; its exit code and its words are the contract.
 *         `edit` lets one case break the copy (a bad regex), and `before` lets one case break
 *         the repo (a dropped blob), to reach each malfunction path
 */
const runGateOnStaged = (input: {
  slug: string;
  file: string;
  content: string;
  edit?: (args: { gate: string }) => string;
  before?: (args: { cwd: string }) => void;
}): { status: number | null; stderr: string } => {
  const cwd = genTempDir({ slug: input.slug, git: true });
  fs.writeFileSync(path.join(cwd, input.file), input.content);
  execSync(`git add ${input.file}`, { cwd });
  input.before?.({ cwd });

  // the gate under test: this repo's own, or a copy one case has broken on purpose
  const gate = fs.readFileSync(path.join(__dirname, 'check.secrets.sh'), 'utf-8');
  const pathGate = path.join(cwd, '.gate.check.secrets.sh');
  fs.writeFileSync(pathGate, input.edit ? input.edit({ gate }) : gate);

  // run it under `sh`, as pre-commit sources it
  const run = spawnSync('sh', [pathGate], { cwd });
  return { status: run.status, stderr: run.stderr.toString('utf-8') };
};

/**
 * .what = run a copy of the gate in a dir that is no git repo
 * .why  = the list of staged files is the gate's first git call; it must fail loud there too
 */
const runGateOutsideRepo = (input: {
  slug: string;
}): { status: number | null; stderr: string } => {
  const cwd = genTempDir({ slug: input.slug });
  const pathGate = path.join(cwd, '.gate.check.secrets.sh');
  fs.copyFileSync(path.join(__dirname, 'check.secrets.sh'), pathGate);
  const run = spawnSync('sh', [pathGate], {
    cwd,
    env: { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(cwd) },
  });
  return { status: run.status, stderr: run.stderr.toString('utf-8') };
};

/**
 * .what = stage one file in a fresh git repo wired to this repo's pre-commit, then `git commit`
 * .why  = production sources the gate from pre-commit, under `sh`; only a real commit proves
 *         pre-commit reaches the gate, its exit refuses the commit, and the file stays staged
 */
const runCommitOnStaged = (input: {
  slug: string;
  file: string;
  content: string;
}): { status: number | null; stderr: string; staged: string } => {
  const cwd = genTempDir({ slug: input.slug, git: true });

  // wire the real hooks in; husky's own loader is a stub, as an installed husky leaves it
  const dirHooks = path.join(cwd, '.husky');
  fs.mkdirSync(path.join(dirHooks, '_'), { recursive: true });
  fs.writeFileSync(path.join(dirHooks, '_', 'husky.sh'), '');
  const namesOfHook = [
    'pre-commit',
    ...fs
      .readdirSync(__dirname)
      .filter((name) => /^check\..+\.sh$/.test(name)),
  ];
  namesOfHook.forEach((name) => {
    fs.copyFileSync(path.join(__dirname, name), path.join(dirHooks, name));
    fs.chmodSync(path.join(dirHooks, name), 0o755);
  });
  execSync('git config core.hooksPath .husky', { cwd });

  // stage the one file under test, then commit it as a human would
  fs.writeFileSync(path.join(cwd, input.file), input.content);
  execSync(`git add ${input.file}`, { cwd });
  const run = spawnSync(
    'git',
    [
      '-c',
      'user.name=bert',
      '-c',
      'user.email=bert@example.com',
      'commit',
      '-m',
      'lesson notes',
    ],
    { cwd },
  );
  return {
    status: run.status,
    stderr: run.stderr.toString('utf-8'),
    staged: execSync('git diff --cached --name-only', { cwd })
      .toString('utf-8')
      .trim(),
  };
};

/**
 * .what = mask each line a foreign tool (grep, git) printed, keep the gate's own lines
 * .why  = a tool's words vary by platform and version, and git's name a blob sha; the gate's
 *         words (its header and its tree branches) are the contract a snapshot pins
 */
const asMaskedForeignLines = (input: { text: string; tool: string }): string =>
  `${input.text
    .replace(/\n$/, '')
    .split('\n')
    .map((line) =>
      /^(✋|💥| {3}[├└│])/.test(line)
        ? line
        : `<a line from ${input.tool}>`,
    )
    // a run of foreign lines (git's usage text, say) folds to one, so its length never pins
    .filter((line, index, lines) => index === 0 || line !== lines[index - 1])
    .join('\n')}\n`;

describe('check.secrets', () => {
  given('[case1] a staged file with no key shape', () => {
    when('[t0] the gate runs', () => {
      const result = useThen('it passes', async () =>
        runGateOnStaged({
          slug: 'check-secrets-clean',
          file: 'lessons.md',
          content: '# sandpine lessons\n\nbook a longboard lesson at dawn\n',
        }),
      );

      then('it exits 0, silent', () => {
        expect(result.status).toEqual(0);
        expect(result.stderr).toEqual('');
      });
    });
  });

  given('[case2] a staged file with a key of each shape', () => {
    KEY_CASES.forEach((keyCase) =>
      when(`[t0] the key is a ${keyCase.shape}`, () => {
        const result = useThen('it halts', async () =>
          runGateOnStaged({
            slug: 'check-secrets-shape',
            file: 'config.md',
            content: `# sandpine config\n\nkey = ${keyCase.key}\n`,
          }),
        );

        then('it exits 2, a constraint, and names the shape and line', () => {
          expect(result.status).toEqual(2);
          expect(result.stderr).toContain('✋ ConstraintError:');
          expect(result.stderr).toContain(`shape: ${keyCase.shape}`);
          expect(result.stderr).toContain('config.md:3');
        });

        then('it never echoes the key itself', () => {
          expect(result.stderr).not.toContain(keyCase.key);
        });

        then('the halt for this shape matches the snapshot', () => {
          expect(result.stderr).toMatchSnapshot();
        });
      }),
    );

    when('[t1] the key sits past a NUL byte, in a blob grep reads as binary', () => {
      const key = ['ghp', '_', 'z'.repeat(36)].join('');
      const result = useThen('it halts', async () =>
        runGateOnStaged({
          slug: 'check-secrets-binary',
          file: 'wetsuits.bin',
          content: `wetsuit sizes\0\0\nkey = ${key}\n`,
        }),
      );

      then('it exits 2 and names the shape and line, so the blob is scanned whole', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('✋ ConstraintError:');
        expect(result.stderr).toContain('shape: github token');
        expect(result.stderr).toContain('wetsuits.bin:2');
      });

      then('it never echoes the key itself', () => {
        expect(result.stderr).not.toContain(key);
      });
    });
  });

  given('[case3] a vendor prefix inside a longer word', () => {
    when('[t0] the gate runs', () => {
      const result = useThen('it passes', async () =>
        runGateOnStaged({
          slug: 'check-secrets-edge',
          file: 'notes.md',
          content: `wax the ${['disk', '-', 'z'.repeat(24)].join('')} board\n`,
        }),
      );

      then('it exits 0, since the word edge guards the prefix', () => {
        expect(result.status).toEqual(0);
      });
    });
  });

  given('[case4] a shape whose regex grep cannot parse', () => {
    when('[t0] the gate runs', () => {
      const result = useThen('it fails loud', async () =>
        runGateOnStaged({
          slug: 'check-secrets-broken',
          file: 'lessons.md',
          content: '# sandpine lessons\n',
          edit: ({ gate }) =>
            gate.replace(
              'private key block|-----BEGIN [A-Z ]*PRIVATE KEY-----',
              'private key block|(unclosed',
            ),
        }),
      );

      then('it exits 1, a malfunction, never a clean pass', () => {
        expect(result.status).toEqual(1);
      });

      then('it names the shape and the fix', () => {
        expect(result.stderr).toContain('💥 MalfunctionError:');
        expect(result.stderr).toContain('shape: private key block');
        expect(result.stderr).toContain('fix: repair the regex');
      });

      then('the halt matches the snapshot', () => {
        expect(
          asMaskedForeignLines({ text: result.stderr, tool: 'grep' }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case5] a staged file whose blob git cannot read', () => {
    when('[t0] the gate runs', () => {
      const result = useThen('it fails loud', async () =>
        runGateOnStaged({
          slug: 'check-secrets-unreadable',
          file: 'lessons.md',
          content: '# sandpine lessons\n',
          before: ({ cwd }) => {
            // drop the staged blob's object, so git show cannot read it
            const sha = execSync('git rev-parse :lessons.md', { cwd })
              .toString('utf-8')
              .trim();
            fs.rmSync(
              path.join(cwd, '.git', 'objects', sha.slice(0, 2), sha.slice(2)),
            );
          },
        }),
      );

      then('it exits 1, a malfunction, never a clean pass', () => {
        expect(result.status).toEqual(1);
      });

      then('it names the class, the file, and the fix', () => {
        expect(result.stderr).toContain(
          '💥 MalfunctionError: check.secrets could not read the staged blob',
        );
        expect(result.stderr).toContain('├─ lessons.md');
        expect(result.stderr).toContain(
          'fix: re-stage it (git add lessons.md), then commit again',
        );
      });

      then('git says why, above the header', () => {
        const [lineGit] = result.stderr.split('\n');
        expect(lineGit).toContain('fatal:');
      });

      then('the halt matches the snapshot', () => {
        expect(
          asMaskedForeignLines({ text: result.stderr, tool: 'git' }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case6] a key shape halt, as a human reads it', () => {
    when('[t0] the gate runs on an aws key id', () => {
      const result = useThen('it halts', async () =>
        runGateOnStaged({
          slug: 'check-secrets-snap',
          file: 'config.md',
          content: `# sandpine config\n\nkey = ${KEY_CASES[0]!.key}\n`,
        }),
      );

      then('it exits 2, a constraint, with the shape and line', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('✋ ConstraintError:');
        expect(result.stderr).toContain('shape: aws access key id');
        expect(result.stderr).toContain('config.md:3');
      });

      then('the halt matches the snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case7] a dir that is no git repo', () => {
    when('[t0] the gate runs', () => {
      const result = useThen('it fails loud', async () =>
        runGateOutsideRepo({ slug: 'check-secrets-norepo' }),
      );

      then('it exits 1, a malfunction, never a raw git abort', () => {
        expect(result.status).toEqual(1);
        expect(result.stderr).toContain(
          '💥 MalfunctionError: check.secrets could not list the staged files',
        );
        expect(result.stderr).toContain('fix: run the commit inside a git repo');
      });

      then('the halt matches the snapshot', () => {
        expect(
          asMaskedForeignLines({ text: result.stderr, tool: 'git' }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case8] a real git commit, through this repo pre-commit', () => {
    when('[t0] the staged file holds a key shape', () => {
      const result = useThen('the commit is refused', async () =>
        runCommitOnStaged({
          slug: 'check-secrets-commit-key',
          file: 'config.md',
          content: `# sandpine config\n\nkey = ${KEY_CASES[0]!.key}\n`,
        }),
      );

      then('the commit fails, and the gate says why', () => {
        expect(result.status).not.toEqual(0);
        expect(result.stderr).toContain(
          '✋ ConstraintError: a secret key shape is staged',
        );
        expect(result.stderr).toContain('shape: aws access key id');
      });

      then('the file stays staged, uncommitted', () => {
        expect(result.staged).toEqual('config.md');
      });
    });

    when('[t1] the staged file holds no key shape', () => {
      const result = useThen('the commit lands', async () =>
        runCommitOnStaged({
          slug: 'check-secrets-commit-clean',
          file: 'lessons.md',
          content: '# sandpine lessons\n\nbook a longboard lesson at dawn\n',
        }),
      );

      then('the commit succeeds, and naught is left staged', () => {
        expect(result.status).toEqual(0);
        expect(result.staged).toEqual('');
      });
    });
  });
});
