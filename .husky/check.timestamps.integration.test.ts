import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

/**
 * .what = stage one file in a fresh git repo, then run this repo's real timestamp gate on it
 * .why = the gate is what a human meets at commit; its exit code and its words are the contract
 */
const runGateOnStaged = (input: {
  slug: string;
  file: string;
  content: string;
  before?: (args: { cwd: string }) => void;
}): { status: number | null; stdout: string; stderr: string } => {
  const cwd = genTempDir({ slug: input.slug, git: true });
  fs.writeFileSync(path.join(cwd, input.file), input.content);
  execSync(`git add ${input.file}`, { cwd });
  input.before?.({ cwd });
  const run = spawnSync('bash', [path.join(__dirname, 'check.timestamps.sh')], {
    cwd,
  });
  return {
    status: run.status,
    stdout: run.stdout.toString('utf-8'),
    stderr: run.stderr.toString('utf-8'),
  };
};

/**
 * .what = stage one file in a fresh git repo wired to this repo's pre-commit, then `git commit`
 * .why = production sources the gate from pre-commit, under `sh`; a bash run alone would miss a
 *        gate that only breaks once sourced (e.g. its `set -eu` in the hook shell)
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
  ['pre-commit', 'check.yalc.sh', 'check.timestamps.sh'].forEach((name) => {
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
 * .what = mask every time of day, so a snapshot of the gate's words never holds a clock
 * .why = the gate quotes the line it matched; the snapshot must itself pass the gate
 */
const asMaskedClock = (input: { text: string }): string =>
  input.text.replace(/[0-9]{2}:[0-9]{2}:[0-9]{2}/g, 'HH:MM:SS');

/**
 * .what = mask each line git itself printed, keep the gate's own lines
 * .why = git's words vary by version and name a blob sha; the gate's words are the contract
 */
const asMaskedGitLines = (input: { text: string }): string =>
  input.text
    .split('\n')
    .map((line) =>
      line.startsWith('💥') || line === '' ? line : '<a line from git>',
    )
    .join('\n');

describe('check.timestamps', () => {
  given('[case1] a staged markdown file that holds a timestamp', () => {
    when('[t0] the gate runs', () => {
      const result = useThen('it halts', async () =>
        runGateOnStaged({
          slug: 'check-timestamps-stamp',
          file: 'lessons.md',
          content:
            '# sandpine lessons\n\nbook-a-lesson reminder sent 2026-09-29T09:30:00Z\n',
        }),
      );

      then('it exits 2, a constraint', () => {
        expect(result.status).toEqual(2);
      });

      then('it names the class, the file, and the line, on stderr', () => {
        expect(result.stderr).toContain('✋ ConstraintError:');
        expect(result.stderr).toContain('lessons.md:3:');
        expect(result.stdout).toEqual('');
      });

      then('it prints the matched line raw, before any snapshot mask', () => {
        expect(result.stderr).toContain(
          'lessons.md:3:book-a-lesson reminder sent 2026-09-29T09:30:00Z',
        );
      });

      then('the words a human reads are pinned', () => {
        expect(asMaskedClock({ text: result.stderr })).toMatchSnapshot();
      });

      then('the brief its why: line names is on disk in this repo', () => {
        const why = result.stderr.match(/why: (\S+\.md)/)?.[1];
        expect(why).toEqual(
          '.agent/repo=.this/role=any/briefs/rule.forbid.timestamps-in-tracked-files.md',
        );
        expect(fs.existsSync(path.join(__dirname, '..', why!))).toBe(true);
      });
    });
  });

  given('[case2] a staged markdown file that holds only a datestamp', () => {
    when('[t0] the gate runs', () => {
      const result = useThen('it passes', async () =>
        runGateOnStaged({
          slug: 'check-timestamps-date',
          file: 'lessons.md',
          content: '# sandpine lessons\n\npushed_at: 2026-09-29\n',
        }),
      );

      then('it exits 0 and says naught', () => {
        expect(result).toEqual({ status: 0, stdout: '', stderr: '' });
      });
    });
  });

  given('[case3] a staged .ts file that holds a timestamp', () => {
    when('[t0] the gate runs', () => {
      const result = useThen('it passes', async () =>
        runGateOnStaged({
          slug: 'check-timestamps-ts',
          file: 'lesson.ts',
          content: "export const bookedAt = '2026-09-29T09:30:00Z';\n",
        }),
      );

      then('it exits 0, since code files carry time logic', () => {
        expect(result).toEqual({ status: 0, stdout: '', stderr: '' });
      });
    });
  });

  given('[case4] a staged file whose blob git cannot read', () => {
    when('[t0] the gate runs', () => {
      const result = useThen('it fails', async () =>
        runGateOnStaged({
          slug: 'check-timestamps-unreadable',
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

      then('it exits 1, a malfunction', () => {
        expect(result.status).toEqual(1);
      });

      then('it names the class and the file, on stderr', () => {
        expect(result.stderr).toContain(
          '💥 MalfunctionError: check.timestamps failed to read staged content for lessons.md',
        );
        expect(result.stdout).toEqual('');
      });

      then('git says why, above the header', () => {
        const [lineGit] = result.stderr.split('\n');
        expect(lineGit).toContain('fatal:');
      });

      then('the words a human reads are pinned', () => {
        expect(asMaskedGitLines({ text: result.stderr })).toMatchSnapshot();
      });
    });
  });

  given('[case5] a staged file whose path is not ascii', () => {
    when('[t0] it holds only a datestamp', () => {
      const result = useThen('it passes', async () =>
        runGateOnStaged({
          slug: 'check-timestamps-nonascii-date',
          file: 'lecciones-ñ.md',
          content: '# sandpine lecciones\n\npushed_at: 2026-09-29\n',
        }),
      );

      then('it exits 0 and says naught — git can read the path', () => {
        expect(result).toEqual({ status: 0, stdout: '', stderr: '' });
      });
    });

    when('[t1] it holds a timestamp', () => {
      const result = useThen('it halts', async () =>
        runGateOnStaged({
          slug: 'check-timestamps-nonascii-stamp',
          file: 'lecciones-ñ.md',
          content: '# sandpine lecciones\n\nsent 2026-09-29T09:30:00Z\n',
        }),
      );

      then('it exits 2, and names the path as the human typed it', () => {
        expect(result.status).toEqual(2);
        expect(result.stderr).toContain('lecciones-ñ.md:3:');
      });
    });
  });

  given('[case6] a real git commit, through this repo pre-commit', () => {
    when('[t0] the staged file holds a timestamp', () => {
      const result = useThen('the commit is refused', async () =>
        runCommitOnStaged({
          slug: 'check-timestamps-commit-stamp',
          file: 'lessons.md',
          content:
            '# sandpine lessons\n\nbook-a-lesson reminder sent 2026-09-29T09:30:00Z\n',
        }),
      );

      then('the commit fails, and the gate says why', () => {
        expect(result.status).not.toEqual(0);
        expect(result.stderr).toContain(
          '✋ ConstraintError: timestamps are forbidden in tracked files',
        );
      });

      then('the file stays staged, uncommitted', () => {
        expect(result.staged).toEqual('lessons.md');
      });
    });

    when('[t1] the staged file holds only a datestamp', () => {
      const result = useThen('the commit lands', async () =>
        runCommitOnStaged({
          slug: 'check-timestamps-commit-date',
          file: 'lessons.md',
          content: '# sandpine lessons\n\npushed_at: 2026-09-29\n',
        }),
      );

      then('the commit succeeds, and naught is left staged', () => {
        expect(result.status).toEqual(0);
        expect(result.staged).toEqual('');
      });
    });
  });
});
