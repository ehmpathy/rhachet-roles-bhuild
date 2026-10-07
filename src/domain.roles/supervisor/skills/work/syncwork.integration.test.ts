/**
 * .what = clamps for syncwork — the lib behind `rhx git.tree.sync`
 *
 * .why  = every guarantee this lib makes is about a box it is NOT on, and each
 *         one fails SILENTLY when broken:
 *
 *           the snapshot mutates naught   a broken one stages a crew's work
 *                                         mid-round, and they see it, not us
 *           the sha is deterministic      a broken one re-transfers a whole
 *                                         tree per call, forever, unnoticed
 *           the upward write is NARROW    a broken one clobbers in-flight
 *                                         edits, silently, while a clone works
 *           the upward write STAGES NAUGHT a broken one puts feedback in the
 *                                         crew's index with no author to blame
 *
 *         ⇒ none of the four announces itself. so they are clamped, or they
 *         are hoped for.
 *
 * .how  = REAL git, in temp dirs, on both ends. the one seam is SYNCWORK_SSH:
 *         a shim that drops the host and runs the command here, so every cloud
 *         path is exercised for real with no network and no live grove within
 *         reach (rule.require.hermetic-tests, rule.forbid.bare-host-deps).
 *
 * .note = GIT_SSH_COMMAND is pointed at the same shim, because the local arm's
 *         `git fetch <host>:<path>` is git's OWN ssh call, not this lib's.
 *         without it that one line would reach the network while every other
 *         line stayed hermetic — the worst of both.
 */
import { execFileSync, spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';

const PATH_SYNCWORK = join(__dirname, 'syncwork.sh');

const ORG = 'testorg';
const REPO = 'testrepo';
const TREE = `${REPO}.beav.feat-probe`;

/** .what = run a git command, and fail loud with its stderr rather than a bare code */
const git = (input: { dir: string; args: string[] }): string =>
  execFileSync('git', ['-C', input.dir, ...input.args], {
    encoding: 'utf8',
    timeout: 30_000,
  }).trim();

/**
 * .what = a whole two-box world: a fake grove and a fake local box
 *
 * .why  = the lib's subject IS the pair. a fixture with one box can clamp the
 *         arg parse and naught else — every guarantee above is a statement
 *         about what happened on the OTHER end.
 */
const genWorld = (input: { slug: string }) => {
  const root = tempDirs.genOne({ slug: input.slug });

  const rootGrove = join(root, 'grove');
  const rootLocal = join(root, 'local');

  // ── the grove side: a repo, and a dirty worktree off it ────────────────
  const repoGrove = join(rootGrove, ORG, REPO);
  mkdirSync(repoGrove, { recursive: true });
  git({
    dir: repoGrove,
    args: ['init', '--quiet', '--initial-branch', 'main'],
  });
  git({ dir: repoGrove, args: ['config', 'user.email', 'probe@test'] });
  git({ dir: repoGrove, args: ['config', 'user.name', 'probe'] });
  writeFileSync(join(repoGrove, 'committed.md'), 'committed\n');
  writeFileSync(join(repoGrove, '.gitignore'), 'secret.env\nbuilt/\n');
  // 🔴 TRACKED, exactly as it is in every real repo here — that is the whole
  //    reason it needs the mirror-owned set. a gitignored file would be handled
  //    already, by the `add -A` skip that keeps .env off the wire.
  mkdirSync(join(repoGrove, '.claude'), { recursive: true });
  writeFileSync(
    join(repoGrove, '.claude', 'settings.json'),
    '{"hooks":"base"}\n',
  );
  git({ dir: repoGrove, args: ['add', '-A'] });
  git({ dir: repoGrove, args: ['commit', '--quiet', '-m', 'base'] });

  const treeGrove = join(rootGrove, ORG, '_worktrees', TREE);
  mkdirSync(join(rootGrove, ORG, '_worktrees'), { recursive: true });
  git({
    dir: repoGrove,
    args: ['worktree', 'add', '--quiet', '-b', 'beav/feat-probe', treeGrove],
  });

  // the state a real crew leaves mid-round: a tracked edit, an untracked file,
  // a STAGED file, and two things .gitignore must keep off the wire
  writeFileSync(
    join(treeGrove, 'committed.md'),
    'committed\nedited by the crew\n',
  );
  writeFileSync(
    join(treeGrove, 'untracked.md'),
    'a whole round of work, in no commit\n',
  );
  writeFileSync(join(treeGrove, 'staged.md'), 'staged by the crew\n');
  git({ dir: treeGrove, args: ['add', 'staged.md'] });
  writeFileSync(join(treeGrove, 'secret.env'), 'TOKEN=nope\n');
  mkdirSync(join(treeGrove, 'built'), { recursive: true });
  writeFileSync(join(treeGrove, 'built', 'bundle.js'), 'huge\n');

  // ── the local side: a clone the mirror will hang off ───────────────────
  const repoLocal = join(rootLocal, ORG, REPO);
  mkdirSync(join(rootLocal, ORG), { recursive: true });
  execFileSync('git', ['clone', '--quiet', repoGrove, repoLocal], {
    timeout: 30_000,
  });
  git({ dir: repoLocal, args: ['config', 'user.email', 'probe@test'] });
  git({ dir: repoLocal, args: ['config', 'user.name', 'probe'] });

  // ── the ssh shim ───────────────────────────────────────────────────────
  // .why it drops `-n` and the host: this box IS the "grove", so the only job
  //      is to run the command. the shim is what makes the cloud arm real
  //      rather than faked — every quote, every heredoc, every pipe below runs
  //      exactly as it would over a wire.
  const pathShim = join(root, 'ssh-shim.sh');
  writeFileSync(
    pathShim,
    [
      '#!/usr/bin/env bash',
      'args=()',
      'for a in "$@"; do case "$a" in -n) ;; *) args+=("$a") ;; esac; done',
      'exec bash -c "${args[*]:1}"',
    ].join('\n'),
    { mode: 0o755 },
  );

  const mirror = join(rootLocal, ORG, '_mirrors', TREE);

  return {
    root,
    rootGrove,
    rootLocal,
    repoGrove,
    repoLocal,
    treeGrove,
    mirror,
    pathShim,
  };
};

/** .what = the index's exact bytes — the sharpest witness that a snapshot mutated naught */
const getIndexFingerprint = (input: { tree: string }): string => {
  const rel = git({
    dir: input.tree,
    args: ['rev-parse', '--git-path', 'index'],
  });
  const path = rel.startsWith('/') ? rel : join(input.tree, rel);
  return readFileSync(path).toString('base64');
};

/** .what = run a tree.sync call against a world */
const runSync = (input: {
  world: ReturnType<typeof genWorld>;
  command: string;
}): { stdout: string; stderr: string; exit: number } => {
  const dir = tempDirs.genOne({ slug: 'sync-driver' });
  const pathDriver = join(dir, 'driver.sh');
  writeFileSync(
    pathDriver,
    [
      'set -uo pipefail',
      `source '${PATH_SYNCWORK}'`,
      '',
      input.command,
      'echo "__EXIT__=$?"',
    ].join('\n'),
    { mode: 0o755 },
  );

  const spawned = spawnSync('bash', [pathDriver], {
    encoding: 'utf8',
    env: {
      ...process.env,
      SYNCWORK_SSH: input.world.pathShim,
      GIT_SSH_COMMAND: input.world.pathShim,
      SYNCWORK_GIT_ROOT: input.world.rootLocal,
      SYNCWORK_GIT_ROOT_REMOTE: input.world.rootGrove,
    },
    timeout: 60_000,
  });

  const stdout = spawned.stdout ?? '';
  const marker = stdout.match(/__EXIT__=(\d+)/);
  return {
    stdout,
    stderr: spawned.stderr ?? '',
    exit: marker ? Number(marker[1]) : (spawned.status ?? 1),
  };
};

const CLOUD = 'cloud://fakegrove';

describe('syncwork', () => {
  afterAll(() => {
    tempDirs.delAll();
  });

  given('[case1] a grove tree with a whole round of uncommitted work', () => {
    const world = useBeforeAll(async () => genWorld({ slug: 'pull' }));
    const before = useBeforeAll(async () => ({
      index: getIndexFingerprint({ tree: world.treeGrove }),
      head: git({ dir: world.treeGrove, args: ['rev-parse', 'HEAD'] }),
      branch: git({
        dir: world.treeGrove,
        args: ['rev-parse', '--abbrev-ref', 'HEAD'],
      }),
      status: git({ dir: world.treeGrove, args: ['status', '--porcelain'] }),
    }));

    when('[t0] it is pulled into a local mirror', () => {
      const result = useBeforeAll(async () =>
        runSync({
          world,
          command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
        }),
      );

      then('it succeeds', () => {
        expect(result.stderr).not.toMatch(/💥/);
        expect(result.exit).toBe(0);
      });

      then('the mirror materializes as a REAL git repo', () => {
        expect(existsSync(world.mirror)).toBe(true);
        // the decisive property over rsync: `git diff` works IN the mirror.
        // an rsync'd worktree carries a `.git` FILE that points at a gitdir it
        // no longer has, so the one operation you opened the mirror to run is
        // the one that breaks.
        expect(() =>
          git({ dir: world.mirror, args: ['status', '--porcelain'] }),
        ).not.toThrow();
      });

      then('🔴 the crew INDEX is byte-identical', () => {
        expect(getIndexFingerprint({ tree: world.treeGrove })).toBe(
          before.index,
        );
      });

      then('🔴 the crew HEAD, branch, and dirty set are unchanged', () => {
        expect(git({ dir: world.treeGrove, args: ['rev-parse', 'HEAD'] })).toBe(
          before.head,
        );
        expect(
          git({
            dir: world.treeGrove,
            args: ['rev-parse', '--abbrev-ref', 'HEAD'],
          }),
        ).toBe(before.branch);
        expect(
          git({ dir: world.treeGrove, args: ['status', '--porcelain'] }),
        ).toBe(before.status);
      });

      then('the snapshot is a CHAIN rooted at their branch tip', () => {
        // ⚠️ read the REF, never HEAD. this line was `rev-parse HEAD^` while the
        //    mirror was checked out AT the snapshot — so HEAD^ was the tip. the
        //    mirror now sits at the tip itself (so `git status` can show the
        //    crew's work), which makes HEAD^ the tip's PARENT. the claim is
        //    about the snapshot's shape, so it must name the snapshot.
        //
        // 🔴 and the depth is TWO, not one: HEAD ← index ← worktree. the middle
        //    commit is what carries the staged/unstaged partition over the wire.
        expect(
          git({
            dir: world.mirror,
            args: ['rev-parse', `refs/mirror/${TREE}^^`],
          }),
        ).toBe(before.head);
      });

      then(
        '🔴 the middle link is their INDEX — staged, and only staged',
        () => {
          // anti-vacuity: a chain of two whose middle link were just HEAD again
          // would satisfy the shape claim above and carry naught. this is the half
          // that proves the middle commit holds the crew's staged content.
          const staged = git({
            dir: world.mirror,
            args: [
              'diff',
              '--name-only',
              `refs/mirror/${TREE}^^`,
              `refs/mirror/${TREE}^`,
            ],
          })
            .trim()
            .split('\n')
            .filter(Boolean);
          expect(staged).toEqual(['staged.md']);
        },
      );

      then('🔴 and the mirror is checked out AT that tip', () => {
        expect(git({ dir: world.mirror, args: ['rev-parse', 'HEAD'] })).toBe(
          before.head,
        );
      });

      then(
        '🔴 UNTRACKED work travels — most of a new round is untracked',
        () => {
          expect(existsSync(join(world.mirror, 'untracked.md'))).toBe(true);
          expect(
            readFileSync(join(world.mirror, 'untracked.md'), 'utf8'),
          ).toContain('no commit');
        },
      );

      then('a tracked edit travels', () => {
        expect(
          readFileSync(join(world.mirror, 'committed.md'), 'utf8'),
        ).toContain('edited by the crew');
      });

      then(
        "a STAGED file travels — the crew's index is read, not skipped",
        () => {
          expect(existsSync(join(world.mirror, 'staged.md'))).toBe(true);
        },
      );

      then(
        '🔴 GITIGNORED files do NOT travel — no secret, no build output',
        () => {
          expect(existsSync(join(world.mirror, 'secret.env'))).toBe(false);
          expect(existsSync(join(world.mirror, 'built', 'bundle.js'))).toBe(
            false,
          );
        },
      );
    });

    when('[t1] it is pulled AGAIN with the tree untouched', () => {
      // ⚠️ WRAPPED in an object, never returned bare. useBeforeAll hands back a
      //    PROXY that defers access, and a proxy over a primitive is not the
      //    primitive — `toBe` sees a char-indexed object and fails on a value
      //    that is in fact equal. a property read resolves it; the bare value
      //    does not.
      const first = useBeforeAll(async () => ({
        sha: git({ dir: world.mirror, args: ['rev-parse', 'HEAD'] }),
      }));
      const again = useBeforeAll(async () =>
        runSync({
          world,
          command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
        }),
      );

      then('it succeeds', () => {
        expect(again.exit).toBe(0);
      });

      then('🔴 the sha is IDENTICAL — an idle re-sync is a true no-op', () => {
        expect(git({ dir: world.mirror, args: ['rev-parse', 'HEAD'] })).toBe(
          first.sha,
        );
      });
    });

    // 🔴 the clamp this surface was shipped WITHOUT, and that absence cost the
    //    human two reports of the same defect on 2026-09-11.
    //
    //    the mirror used to be checked out AT the snapshot, so the crew's
    //    uncommitted work arrived already COMMITTED. `git status` answered
    //    "clean" and `git diff` answered empty — both true of the mirror, both
    //    the opposite of the truth about the CREW. every clamp above passed
    //    the whole time, because every one of them asked about the ref and the
    //    sha, and not one asked what a human sees when they walk in and type
    //    the first command they would ever type.
    when(
      '[t2] a human opens the mirror and runs the first verb they would',
      () => {
        then('🔴 `git status` SHOWS the crew inflight work', () => {
          const status = git({
            dir: world.mirror,
            args: ['status', '--porcelain'],
          });
          expect(status.trim()).not.toEqual('');
        });

        then('🔴 `git diff` is NOT empty — the delta is reviewable', () => {
          const diff = git({
            dir: world.mirror,
            args: ['diff', '--name-only'],
          });
          expect(diff.trim()).not.toEqual('');
        });

        then('HEAD sits at their BRANCH TIP, never at the snapshot', () => {
          // .why = the base matters. a reviewer diffs against what the crew has
          //        committed; if HEAD were the snapshot, the base would already
          //        contain the work and every diff would read empty.
          const head = git({ dir: world.mirror, args: ['rev-parse', 'HEAD'] });
          const snapBase = git({
            dir: world.mirror,
            args: ['rev-parse', `refs/mirror/${TREE}^^`],
          });
          expect(head).toBe(snapBase);
        });

        then('the worktree CONTENT equals the snapshot', () => {
          // anti-vacuity: a mirror left at their tip with NO unpack would also
          // satisfy "HEAD is the tip" — and would show a clean tree. this is the
          // half that proves the crew's work actually landed on disk.
          // ⚠️ `status --porcelain`, never `diff --name-only`. a file the crew
          //    created but never committed is absent from their tip, so after the
          //    mixed reset it is UNTRACKED — which is correct, and which `git
          //    diff` does not report. that is most of a fresh round's work.
          const dirty = git({
            dir: world.mirror,
            args: ['status', '--porcelain'],
          })
            .trim()
            .split('\n')
            .filter(Boolean)
            // ⚠️ strip the status code by PATTERN, never by a fixed offset. the
            //    `git` helper trims its whole output, so the first line loses the
            //    leading space of a ` M path` entry and a slice(3) eats a
            //    character of the filename — silently, and only on line one.
            .map((line) => line.replace(/^\s*\S+\s+/, ''));
          const inSnap = git({
            dir: world.mirror,
            args: [
              'diff',
              '--name-only',
              `refs/mirror/${TREE}^^`,
              `refs/mirror/${TREE}`,
            ],
          })
            .trim()
            .split('\n')
            .filter(Boolean);
          expect(dirty.sort()).toEqual(inSnap.sort());
        });
      },
    );

    // 🔴 the clamp for the defect this surface shipped with: the transport
    //    collapsed the crew's index into HEAD, so every change arrived UNSTAGED
    //    whatever the crew had done. `git status` in the mirror was non-empty
    //    and `git diff` was non-empty — so every clamp in [t2] passed — and both
    //    meant OTHER than what the same command means on the grove.
    //
    //    ⇒ the question that exposes it is not "is there a delta" but "is the
    //      delta PARTITIONED as the crew partitioned it". reported by the human
    //      on 2026-09-15: "how come git.tree.sync doesnt preserve the
    //      staged|unstaged from the remote machine when it syncs into local".
    when(
      '[t3] a human asks the mirror what changed SINCE the crew last staged',
      () => {
        const onGrove = useBeforeAll(async () => ({
          status: git({
            dir: world.treeGrove,
            args: ['status', '--porcelain'],
          }),
          staged: git({
            dir: world.treeGrove,
            args: ['diff', '--cached', '--name-only'],
          }),
          unstaged: git({
            dir: world.treeGrove,
            args: ['diff', '--name-only'],
          }),
        }));

        then(
          '🔴 `git diff --cached` names what THEY staged, and only that',
          () => {
            expect(
              git({
                dir: world.mirror,
                args: ['diff', '--cached', '--name-only'],
              }),
            ).toBe(onGrove.staged);
            // anti-vacuity: the fixture stages exactly one file, so an empty
            // `--cached` (the old behavior) cannot pass by accident
            expect(onGrove.staged.trim()).toBe('staged.md');
          },
        );

        then(
          '🔴 `git diff` names what they changed SINCE — never the staged half',
          () => {
            expect(
              git({ dir: world.mirror, args: ['diff', '--name-only'] }),
            ).toBe(onGrove.unstaged);
            expect(onGrove.unstaged.trim()).toBe('committed.md');
          },
        );

        then(
          '🔴 `git status --porcelain` is BYTE-IDENTICAL to the grove',
          () => {
            // the sharpest form of the claim: not "a delta exists", but "the crew's
            // own partition survived the wire". it covers the staged column, the
            // unstaged column, and the untracked set in one assertion.
            expect(
              git({ dir: world.mirror, args: ['status', '--porcelain'] }),
            ).toBe(onGrove.status);
          },
        );
      },
    );

    // ⚠️ "even on sync" — the partition must survive every REFRESH too, never
    //    only the first materialization. the two arms of __sync_into_local_rest
    //    are different code paths (worktree add vs checkout), so a fix applied
    //    to one and not the other reads as correct until the second sync.
    when('[t4] the crew stages MORE, and the mirror is re-synced', () => {
      const after = useBeforeAll(async () => {
        git({ dir: world.treeGrove, args: ['add', 'untracked.md'] });
        runSync({
          world,
          command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
        });
        return {
          status: git({
            dir: world.treeGrove,
            args: ['status', '--porcelain'],
          }),
          staged: git({
            dir: world.treeGrove,
            args: ['diff', '--cached', '--name-only'],
          }),
        };
      });

      then('the newly staged file shows as STAGED in the mirror', () => {
        expect(after.staged.trim().split('\n').sort()).toEqual([
          'staged.md',
          'untracked.md',
        ]);
        expect(
          git({ dir: world.mirror, args: ['diff', '--cached', '--name-only'] }),
        ).toBe(after.staged);
      });

      then('🔴 the refresh arm holds the partition too', () => {
        expect(
          git({ dir: world.mirror, args: ['status', '--porcelain'] }),
        ).toBe(after.status);
      });
    });

    // 🔴 the clamp for the SECOND defect, one layer up from the first: the
    //    transport carried the partition correctly and the REPORT re-flattened
    //    it. `n_unstaged` was a tree diff of <index tree> → <worktree tree>,
    //    and that worktree tree was built with `git add -A` — so it counted
    //    every untracked file as a change the crew had made since they staged.
    //
    //    measured on a real 7217-file tree, 2026-09-15: the line read
    //    "since staged: 189" where the grove read 81. accurate about a question
    //    nobody asked, and NOT the number the very next line of the same report
    //    tells the human to go run (term=false-report).
    //
    //    ⇒ so the discriminator needs an UNTRACKED file present. with none, the
    //      tree form and the worktree form agree, and the clamp cannot bite.
    when(
      '[t5] the crew leaves a NEW untracked file, and the report is read',
      () => {
        const seen = useBeforeAll(async () => {
          writeFileSync(
            join(world.treeGrove, 'fresh.md'),
            'a new file, never staged\n',
          );
          const result = runSync({
            world,
            command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
          });
          const count = (raw: string): number =>
            raw.split('\n').filter((line) => line.trim() !== '').length;
          return {
            stdout: result.stdout,
            staged: count(
              git({
                dir: world.treeGrove,
                args: ['diff', '--cached', '--name-only'],
              }),
            ),
            unstaged: count(
              git({ dir: world.treeGrove, args: ['diff', '--name-only'] }),
            ),
            untracked: count(
              git({
                dir: world.treeGrove,
                args: ['ls-files', '--others', '--exclude-standard'],
              }),
            ),
          };
        });

        then(
          'the fixture actually holds an untracked file — else this clamps naught',
          () => {
            expect(seen.untracked).toBeGreaterThan(0);
            expect(
              git({ dir: world.treeGrove, args: ['status', '--porcelain'] }),
            ).toContain('?? fresh.md');
          },
        );

        then(
          '🔴 the report counts what the GROVE counts, in all three columns',
          () => {
            expect(seen.stdout).toContain(
              `✋ staged: ${seen.staged}  ·  ✍️ since staged: ${seen.unstaged}  ·  ❔ untracked: ${seen.untracked}`,
            );
          },
        );

        then(
          '🔴 "since staged" excludes the untracked set, never absorbs it',
          () => {
            // the exact shape of the defect: an untracked file inflated the
            // since-staged count. assert the two columns are distinct numbers that
            // each name their own state, rather than one number that holds both.
            const sum = seen.unstaged + seen.untracked;
            expect(seen.stdout).not.toContain(`✍️ since staged: ${sum}`);
            expect(
              git({ dir: world.mirror, args: ['diff', '--name-only'] }).split(
                '\n',
              ),
            ).not.toContain('fresh.md');
            expect(
              git({
                dir: world.mirror,
                args: ['ls-files', '--others', '--exclude-standard'],
              }),
            ).toContain('fresh.md');
          },
        );
      },
    );
  });

  // 🔴 the clamp for the halt reported 2026-09-15 on
  //    svc-reservations.beav.feat-rec-waitlist-capture. `.claude/settings.json`
  //    is TRACKED, so it rides every snapshot — and the local claude session
  //    rewrites it in the mirror the moment a human works there. so it diverged
  //    with no human edit, and every refresh halted with a `--force` ask about a
  //    file nobody had opened.
  given(
    '[case1b] a mirror whose local claude session rewrote .claude/settings.json',
    () => {
      const world = useBeforeAll(async () => {
        const w = genWorld({ slug: 'owned' });
        // 🔴 BOTH boxes rewrite it, which is the real shape of the problem: two
        //    correct copies, one per machine, and naught to choose between them.
        //    the grove's claude session did this to the worktree…
        writeFileSync(
          join(w.treeGrove, '.claude/settings.json'),
          '{"hooks":"THE GROVE"}\n',
        );
        runSync({
          world: w,
          command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
        });
        // …and the local one does it to the mirror the moment a human works there
        writeFileSync(
          join(w.mirror, '.claude/settings.json'),
          '{"hooks":"MY LAPTOP"}\n',
        );
        return w;
      });

      when('[t0] the mirror is refreshed', () => {
        const result = useBeforeAll(async () =>
          runSync({
            world,
            command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
          }),
        );

        then(
          "🔴 it does NOT halt — the divergence was never the human's",
          () => {
            expect(result.exit).toBe(0);
            expect(result.stdout + result.stderr).not.toContain('YOURS');
            expect(result.stdout + result.stderr).not.toContain('--force');
          },
        );

        then("🔴 the laptop's copy SURVIVES the reset", () => {
          // the half a gate-only fix would miss: stop the halt, keep the clobber,
          // and the human loses the file with no halt to tell them so.
          const seen = readFileSync(
            join(world.mirror, '.claude/settings.json'),
            'utf8',
          );
          expect(seen).toContain('MY LAPTOP');
          expect(seen).not.toContain('THE GROVE');
        });

        then("the rest of the crew's work still lands", () => {
          // anti-vacuity: the sync must have actually DONE its job, not merely
          // declined to break. an early return would pass both clamps above.
          expect(
            readFileSync(join(world.mirror, 'committed.md'), 'utf8'),
          ).toContain('edited by the crew');
          expect(
            git({
              dir: world.mirror,
              args: ['diff', '--cached', '--name-only'],
            }).trim(),
          ).toBe('staged.md');
        });
      });
    },
  );

  given('[case2] a mirror the human has written feedback into', () => {
    const world = useBeforeAll(async () => {
      const w = genWorld({ slug: 'push' });
      runSync({
        world: w,
        command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
      });
      writeFileSync(
        join(w.mirror, 'round1.feedback.by_human.md'),
        '# this needs a test\n',
      );
      writeFileSync(join(w.mirror, 'notes.scratch.md'), 'do NOT send this\n');
      return w;
    });

    when('[t0] the feedback is sent up, scoped', () => {
      // .why wrapped — see [case1][t1]: a proxy over a primitive is not the primitive
      const before = useBeforeAll(async () => ({
        index: getIndexFingerprint({ tree: world.treeGrove }),
      }));
      const result = useBeforeAll(async () =>
        runSync({
          world,
          command:
            `tree.sync --tree ${TREE} --from local --into ${CLOUD} ` +
            `--what '*.feedback.*.md' --mode apply`,
        }),
      );

      then('it succeeds', () => {
        expect(result.stderr).not.toMatch(/💥/);
        expect(result.exit).toBe(0);
      });

      then('🔴 --from local found the MIRROR — the round trip closes', () => {
        // the regression clamp. __sync_tree_dir once knew only `_worktrees`, so
        // a `--from local` could not find the mirror the pull had just written,
        // and answered "no tree on local" — which reads as a typo'd slug.
        expect(result.stdout).toContain('_mirrors');
      });

      then('the named file LANDS on the grove tree', () => {
        expect(
          existsSync(join(world.treeGrove, 'round1.feedback.by_human.md')),
        ).toBe(true);
        expect(
          readFileSync(
            join(world.treeGrove, 'round1.feedback.by_human.md'),
            'utf8',
          ),
        ).toContain('needs a test');
      });

      then('🔴 an UNNAMED file does NOT land — the scope is the safety', () => {
        expect(existsSync(join(world.treeGrove, 'notes.scratch.md'))).toBe(
          false,
        );
      });

      then(
        "🔴 the crew's INDEX is byte-identical — the write staged NAUGHT",
        () => {
          // `git checkout <ref> -- <paths>` would have staged what it wrote, so
          // the crew's next `git status` would show feedback files staged,
          // mid-round, with no idea who staged them. `git archive | tar` does not.
          expect(getIndexFingerprint({ tree: world.treeGrove })).toBe(
            before.index,
          );
        },
      );

      then(
        'the landed file shows as UNTRACKED to the crew, never staged',
        () => {
          const status = git({
            dir: world.treeGrove,
            args: ['status', '--porcelain'],
          });
          expect(status).toMatch(/^\?\? round1\.feedback\.by_human\.md$/m);
        },
      );
    });
  });

  given('[case3] a caller who names no scope', () => {
    const world = useBeforeAll(async () => genWorld({ slug: 'gate' }));

    when('[t0] the destination is a GROVE', () => {
      const result = useBeforeAll(async () =>
        runSync({
          world,
          command: `tree.sync --tree ${TREE} --from local --into ${CLOUD} --mode apply`,
        }),
      );

      then('🔴 it REFUSES, as a constraint', () => {
        expect(result.exit).toBe(2);
        expect(result.stderr).toContain('--what is REQUIRED');
      });

      then('it names the fix rather than merely the fault', () => {
        expect(result.stderr).toMatch(/rhx git\.tree\.sync/);
      });

      then('it moved naught', () => {
        expect(existsSync(join(world.treeGrove, 'notes.scratch.md'))).toBe(
          false,
        );
      });
    });

    when('[t1] the destination is LOCAL', () => {
      const result = useBeforeAll(async () =>
        runSync({
          world,
          command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
        }),
      );

      then(
        'it proceeds — a pull can harm no crew, so it needs no ceremony',
        () => {
          expect(result.exit).toBe(0);
        },
      );
    });
  });

  given('[case4] a caller who gets the arguments wrong', () => {
    const world = useBeforeAll(async () => genWorld({ slug: 'args' }));

    when('[t0] --from and --into name the same box', () => {
      const result = useBeforeAll(async () =>
        runSync({
          world,
          command: `tree.sync --tree ${TREE} --from local --into local`,
        }),
      );
      then('it refuses', () => {
        expect(result.exit).toBe(2);
        expect(result.stderr).toContain('same box');
      });
    });

    when('[t1] a flag is unknown', () => {
      const result = useBeforeAll(async () =>
        runSync({
          world,
          command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --wat x`,
        }),
      );
      then(
        '🔴 it FAILS LOUD rather than shift it away (rule.forbid.failhide)',
        () => {
          expect(result.exit).toBe(2);
          expect(result.stderr).toContain("unknown flag '--wat'");
        },
      );
    });

    when('[t2] a grove is spelled with no scheme', () => {
      const result = useBeforeAll(async () =>
        runSync({
          world,
          command: `tree.sync --tree ${TREE} --from grove-1 --into local`,
        }),
      );
      then('it refuses and states the two legal forms', () => {
        expect(result.exit).toBe(2);
        expect(result.stderr).toContain('cloud://');
      });
    });

    when('[t3] --what matches naught on the source', () => {
      const result = useBeforeAll(async () => {
        runSync({
          world,
          command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
        });
        return runSync({
          world,
          command:
            `tree.sync --tree ${TREE} --from local --into ${CLOUD} ` +
            `--what 'no-such-file-*.md' --mode apply`,
        });
      });
      then('🔴 it refuses rather than report a cheerful "sent 0 files"', () => {
        expect(result.exit).toBe(2);
        expect(result.stderr).toContain('no path matched');
      });
    });
  });

  given('[case5] a mirror with the human mid-review, uncommitted', () => {
    const world = useBeforeAll(async () => {
      const w = genWorld({ slug: 'dirty' });
      runSync({
        world: w,
        command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
      });
      writeFileSync(
        join(w.mirror, 'committed.md'),
        'MY REVIEW NOTES, unsent\n',
      );
      // and the grove moves on, so a refresh would have a state to reset TO
      writeFileSync(join(w.treeGrove, 'untracked.md'), 'the crew moved on\n');
      return w;
    });

    when('[t0] a refresh is attempted', () => {
      const result = useBeforeAll(async () =>
        runSync({
          world,
          command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
        }),
      );

      then('🔴 it REFUSES rather than reset over the human', () => {
        expect(result.exit).toBe(2);
        // .why the message moved TWICE, and the current phrase is the claim
        //      that matters: a mirror is DIRTY by design, so "uncommitted
        //      changes" describes the healthy state too. and `drifted` is not
        //      the claim either — this tool's OWN leavings drift (see the
        //      residue case below). the refusal must say WHOSE the file is.
        expect(result.stderr).toContain('YOURS');
      });

      then("the human's unsent work survives", () => {
        expect(
          readFileSync(join(world.mirror, 'committed.md'), 'utf8'),
        ).toContain('MY REVIEW NOTES');
      });

      then('it names the file that earned the refusal', () => {
        expect(result.stderr).toContain('committed.md');
      });

      then(
        'it names every way out — force hard, force soft, or send them up',
        () => {
          // ⭐ the ask must be RUNNABLE, never merely described. a refusal that
          //    explains a choice without the two commands makes the human
          //    compose them (rule.require.errors-name-the-fix).
          expect(result.stderr).toContain('⭐ the ask');
          expect(result.stderr).toContain('--force hard --mode apply');
          expect(result.stderr).toContain('--force soft --mode apply');
          expect(result.stderr).toContain('--into <grove>');
        },
      );
    });
  });

  given('[case6] the crew DROPS a file a prior sync already laid down', () => {
    /**
     * 🔴 .why = the refusal used to fire over this, and the file was never the
     *    human's. `read-tree --reset -u` writes only TRACKED paths, so a file
     *    the snapshot carried and the branch tip lacks is left UNTRACKED — and
     *    once the crew deletes it, it differs from `tree-sync.applied` with no
     *    human edit at all. the guard then called it *"yours, a discard is
     *    final"* and demanded a force over a file the reviewer never opened.
     *
     *    ⚠️ and the refusal was SELF-SEALING: the `clean -fd` that clears the
     *      leavings sits inside the unpack, past the gate — so the residue made
     *      the gate refuse, and the refusal stopped its own cure from running.
     *      every mirror that carried residue was stuck until a human forced.
     *
     *    reported twice on 2026-09-13 — once as "wtf", once as "again" — and
     *    the second report was the same mirror, still stuck.
     *
     * ⚠️ .what this case actually proves, and what it does NOT
     *    the `clean -fd` at the head of the unpack means residue can no longer
     *    ACCUMULATE: the mirror still equals `applied` at this point, so the
     *    pristine gate passes and the clean sweeps the dropped file. that is
     *    the whole cure for a mirror made from here on, and it is what these
     *    assertions catch.
     *
     *    the residue PARTITION (__sync_drift_is_residue) is a second cure, for
     *    a mirror that accumulated leavings BEFORE that clean existed — where
     *    `applied` has already moved past them and the gate refuses. that path
     *    needs a legacy-shaped mirror to exercise and is NOT covered here.
     *    ⇒ named rather than implied, so no reader takes a green case6 for
     *      proof of both (term=false-report).
     */
    const world = useBeforeAll(async () => {
      const w = genWorld({ slug: 'residue' });

      // the crew holds an untracked artifact; sync 1 lays it into the mirror
      writeFileSync(join(w.treeGrove, 'crew-artifact.md'), 'a driver yield\n');
      runSync({
        world: w,
        command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
      });

      // the crew drops it, and moves on
      rmSync(join(w.treeGrove, 'crew-artifact.md'));
      writeFileSync(
        join(w.treeGrove, 'moved-on.md'),
        'the crew kept driving\n',
      );
      return w;
    });

    then('the prior sync really did leave it in the mirror', () => {
      expect(existsSync(join(world.mirror, 'crew-artifact.md'))).toBe(true);
    });

    when('[t0] the next refresh runs', () => {
      const result = useBeforeAll(async () =>
        runSync({
          world,
          command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
        }),
      );

      then("🔴 it does NOT refuse — the file was never the human's", () => {
        expect(result.exit).toBe(0);
      });

      then('🔴 it never calls the leavings YOURS', () => {
        expect(result.stdout + result.stderr).not.toContain('YOURS');
      });

      then('the residue is gone from the mirror', () => {
        expect(existsSync(join(world.mirror, 'crew-artifact.md'))).toBe(false);
      });

      then('the refresh actually landed the crew new work', () => {
        expect(existsSync(join(world.mirror, 'moved-on.md'))).toBe(true);
      });
    });
  });

  given(
    '[case7] a repo whose post-checkout hook FAILS — the husky shape',
    () => {
      /**
       * .why = a git snapshot carries tracked files only, so a hook that sources a
       *        shim `npm install` generates and `.gitignore` excludes can never
       *        find it in a mirror. the hook then exits non-zero, `git checkout`
       *        exits non-zero, and the sync dies on a file the mirror was never
       *        meant to have.
       *
       * measured on `declastruct-aws` @ `grove-sandpine-v20260901`, 2026-09-11:
       *   .husky/post-checkout: 2: .: cannot open .husky/_/husky.sh: No such file
       * the mirror sat at the CORRECT sha and every refresh refused, so it was
       * frozen in place — and the failure read as "could not check out <sha>",
       * which names the act and withholds the cause.
       *
       * ⇒ the class is the same one `git.tree.duct.sh:create_worktree_on_grove`
       *   was repaired for, so the clamp is written against the CLASS: any repo
       *   hook at all, not the husky spelling of one.
       */
      const world = useBeforeAll(async () => {
        const built = genWorld({ slug: 'hostile-hook' });
        // husky's exact shape: core.hooksPath points at a dir in the repo, and the
        // hook sources a generated shim that does not travel in a git snapshot.
        const hooks = join(built.repoLocal, '.hooks-probe');
        mkdirSync(hooks, { recursive: true });
        writeFileSync(
          join(hooks, 'post-checkout'),
          ['#!/usr/bin/env bash', '. ./.husky/_/husky.sh', ''].join('\n'),
          { mode: 0o755 },
        );
        git({
          dir: built.repoLocal,
          args: ['config', 'core.hooksPath', hooks],
        });
        return built;
      });

      when(
        '[t0] the tree is pulled for the FIRST time — the worktree-add arm',
        () => {
          const result = useBeforeAll(async () =>
            runSync({
              world,
              command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
            }),
          );

          then('🔴 it LANDS — a repo hook cannot veto a read surface', () => {
            expect(result.stderr).not.toMatch(/💥/);
            expect(result.exit).toBe(0);
          });

          then('the mirror carries the crew uncommitted work', () => {
            expect(existsSync(join(world.mirror, 'untracked.md'))).toBe(true);
            expect(
              readFileSync(join(world.mirror, 'committed.md'), 'utf8'),
            ).toContain('edited by the crew');
          });
        },
      );

      when(
        '[t1] it is re-synced onto the mirror that now exists — the checkout arm',
        () => {
          // .why a SECOND when: the two arms are different git commands, and only
          //      the checkout one runs on a refresh. the measured freeze was here —
          //      a first sync that predated the hook had left a working mirror, and
          //      every refresh after it refused.
          const result = useBeforeAll(async () =>
            runSync({
              world,
              command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
            }),
          );

          then(
            '🔴 the REFRESH lands too — the mirror is never frozen in place',
            () => {
              expect(result.stderr).not.toMatch(/💥/);
              expect(result.exit).toBe(0);
            },
          );
        },
      );
    },
  );

  given('[case6] a plan-mode caller', () => {
    const world = useBeforeAll(async () => genWorld({ slug: 'plan' }));

    when('[t0] a pull is planned', () => {
      const result = useBeforeAll(async () =>
        runSync({
          world,
          command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode plan`,
        }),
      );

      then('it succeeds and moved naught', () => {
        expect(result.exit).toBe(0);
        expect(existsSync(world.mirror)).toBe(false);
      });

      then('it echoes the exact command that would run it', () => {
        expect(result.stdout).toContain('--mode apply');
      });
    });

    when('[t1] no --mode is given', () => {
      const intoGrove = useBeforeAll(async () =>
        runSync({
          world,
          command: `tree.sync --tree ${TREE} --from local --into ${CLOUD} --what '*.md'`,
        }),
      );
      const intoLocal = useBeforeAll(async () =>
        runSync({
          world,
          command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local`,
        }),
      );

      then(
        '🔴 a write onto a live grove defaults to PLAN — the deliberate act',
        () => {
          expect(intoGrove.stdout).toContain('mode: plan');
        },
      );

      then('a pull defaults to APPLY — it can harm no crew', () => {
        expect(intoLocal.stdout).toContain('mode: apply');
      });
    });
  });

  given(
    '[case9] a seat BOOTED before it was filled — an empty mirror dir',
    () => {
      const world = useBeforeAll(async () => {
        const w = genWorld({ slug: 'preboot' });
        // exactly what `crew.boot` leaves behind: __crew_role_cwd mkdir -p's the
        // mirror so the reviewer duct has a cwd to open in, BEFORE any sync has
        // filled it. the seat is registered; the mirror is empty.
        mkdirSync(w.mirror, { recursive: true });
        return w;
      });

      when('[t0] the first sync runs', () => {
        const result = useBeforeAll(async () =>
          runSync({
            world,
            command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
          }),
        );

        then('🔴 it FILLS the seat rather than refuse it as edited', () => {
          // an empty dir is not an edited mirror. a bare `-d` test read it as one,
          // so `crew.boot` then `git.tree.sync` — the documented order — refused
          // with "the mirror was edited since its last sync" over a dir that held
          // not one file, and printed an EMPTY list under "yours, most likely".
          expect(result.stderr).not.toMatch(/edited since its last sync/);
          expect(result.exit).toBe(0);
        });

        then('the crew inflight work is there, as on any other mirror', () => {
          const dirty = git({
            dir: world.mirror,
            args: ['status', '--porcelain'],
          });
          expect(dirty).toContain('untracked.md');
        });
      });
    },
  );

  given('[case8] a human who needs a GITIGNORED file in the seat', () => {
    const world = useBeforeAll(async () => genWorld({ slug: 'ignored' }));
    const before = useBeforeAll(async () => ({
      index: getIndexFingerprint({ tree: world.treeGrove }),
      status: git({ dir: world.treeGrove, args: ['status', '--porcelain'] }),
    }));

    when('[t0] one ignored path is named', () => {
      const result = useBeforeAll(async () =>
        runSync({
          world,
          command:
            `tree.sync --tree ${TREE} --from ${CLOUD} --into local ` +
            `--also-ignored 'secret.env' --mode apply`,
        }),
      );

      then('it succeeds', () => {
        expect(result.stderr).not.toMatch(/💥/);
        expect(result.exit).toBe(0);
      });

      then(
        '🔴 the NAMED ignored file lands — the whole point of the flag',
        () => {
          expect(existsSync(join(world.mirror, 'secret.env'))).toBe(true);
          expect(
            readFileSync(join(world.mirror, 'secret.env'), 'utf8'),
          ).toContain('TOKEN=nope');
        },
      );

      then(
        '🔴 an UNNAMED ignored file does NOT — the opt-in is per path',
        () => {
          // `built/` is gitignored too, and was never named. if it travelled, the
          // flag would be a switch that turns the security guarantee off wholesale
          // rather than an opt-in for one path.
          expect(existsSync(join(world.mirror, 'built', 'bundle.js'))).toBe(
            false,
          );
        },
      );

      then(
        '🔴 it is LOUD — a pulled secret is announced, with its path',
        () => {
          expect(result.stdout).toContain('🔓 also-ignored');
          expect(result.stdout).toContain('secret.env');
        },
      );

      then(
        '🔴 the crew INDEX is byte-identical — the second transport writes NAUGHT upward',
        () => {
          expect(getIndexFingerprint({ tree: world.treeGrove })).toBe(
            before.index,
          );
          expect(
            git({ dir: world.treeGrove, args: ['status', '--porcelain'] }),
          ).toBe(before.status);
        },
      );

      then(
        'the mirror still shows the crew inflight work — the snapshot is intact',
        () => {
          const dirty = git({
            dir: world.mirror,
            args: ['status', '--porcelain'],
          });
          expect(dirty).toContain('untracked.md');
          expect(dirty).toContain('committed.md');
        },
      );

      then(
        '🔴 and the pulled file does NOT show as dirty — it is ignored HERE too',
        () => {
          // load-bearing: if it showed, `__sync_mirror_is_pristine` would read the
          // mirror as human-edited and refuse every refresh, forever.
          expect(
            git({ dir: world.mirror, args: ['status', '--porcelain'] }),
          ).not.toContain('secret.env');
        },
      );
    });

    when('[t1] the mirror is re-synced', () => {
      const result = useBeforeAll(async () =>
        runSync({
          world,
          command: `tree.sync --tree ${TREE} --from ${CLOUD} --into local --mode apply`,
        }),
      );

      then(
        '🔴 the refresh is NOT refused — a pulled secret is no human edit',
        () => {
          expect(result.exit).toBe(0);
          expect(result.stderr).not.toMatch(/edited since its last sync/);
        },
      );

      then('🔴 the pulled file SURVIVES the refresh', () => {
        // read-tree --reset -u writes only paths IN the snapshot tree, so it
        // cannot disturb one that is absent from it. a human who pulls a .env
        // once should not have to pull it again on every sync.
        expect(existsSync(join(world.mirror, 'secret.env'))).toBe(true);
      });
    });

    when('[t2] the named path matches naught', () => {
      const result = useBeforeAll(async () =>
        runSync({
          world,
          command:
            `tree.sync --tree ${TREE} --from ${CLOUD} --into local ` +
            `--also-ignored 'provision/absent.env' --mode apply`,
        }),
      );

      then(
        '🔴 it REFUSES rather than mirror a seat that only looks complete',
        () => {
          expect(result.exit).not.toBe(0);
        },
      );

      then(
        '🔴 it names BOTH causes — the ambiguity is the defect it closes',
        () => {
          // a human at the mirror cannot tell "the sync skipped it" from "it was
          // never at the source". measured 2026-09-11: it was the second, and the
          // read cost two round trips to settle.
          expect(result.stderr).toContain('does not exist on the source');
          expect(result.stderr).toContain('NOT gitignored');
        },
      );
    });

    when('[t3] a TRACKED path is named', () => {
      const result = useBeforeAll(async () =>
        runSync({
          world,
          command:
            `tree.sync --tree ${TREE} --from ${CLOUD} --into local ` +
            `--also-ignored 'committed.md' --mode apply`,
        }),
      );

      then(
        '🔴 it refuses — the flag reaches ONLY ignored files, by construction',
        () => {
          expect(result.exit).not.toBe(0);
          expect(result.stderr).toContain('already travelled');
        },
      );
    });

    when('[t4] it is aimed UPWARD at a grove', () => {
      const result = useBeforeAll(async () =>
        runSync({
          world,
          command:
            `tree.sync --tree ${TREE} --from local --into ${CLOUD} ` +
            `--what '*.md' --also-ignored 'secret.env' --mode apply`,
        }),
      );

      then(
        '🔴 it REFUSES — an upward secret leaves no trace in any tree',
        () => {
          expect(result.exit).toBe(2);
          expect(result.stderr).toContain('PULL-only');
        },
      );

      then('it names the deliberate alternative', () => {
        expect(result.stderr).toContain('keyrack');
        expect(result.stderr).toContain('git.grove.send');
      });
    });
  });
});
