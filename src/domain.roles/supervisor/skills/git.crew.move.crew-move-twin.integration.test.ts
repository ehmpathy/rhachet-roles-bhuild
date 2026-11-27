/**
 * .what = clamps on `git.crew.move --setaside-twin-why`: a stale twin that holds work is set aside whole, never dropped, so
 *         the move lands the source's newer bytes
 *
 * .why  = inc-20261122-164750: infrastructure.beav.feat-records-vault had to move from a cloud grove to local, and a stale twin
 *         of the same tree and branch stood on local at the same head with 86 dirty paths (79 untracked), 32 of them older bytes.
 *         --drop-twin-why refused a dirty twin, --into-extant refused 32 conflicts, and git.crew.reset needs a ledger row the twin
 *         lacked: no paved act could free the path and keep the twin's work. the verb must:
 *           1. refuse the twin as before with no flag, and name --setaside-twin-why in the fix
 *           2. plan: name the set-aside as a settle, with the why, and touch naught
 *           3. apply: rename the twin whole under <base>/_setaside/, its git admin dir beside it, so its registration lifts;
 *              read both back; then raise the tree on the source's bytes. every twin byte stands at the set-aside path
 *           4. refuse (exit 2, naught touched) a twin with a process at work in it, and name a claude when one is
 *           5. refuse a reason under three words, and the flag beside --drop-twin-why or --into-extant
 *
 * .how  = temp groves (one dir per grove holds its own $HOME/git/<org>/...), all cut from one bare origin. a bash driver sources
 *         the operations file and replaces three boundaries: ssh (runs the remote command with the grove's HOME), crew.boot
 *         (records), duct.read (reads a pane fixture). git, tar, mv, sha256sum run for real. no real grove, ledger, or tree is in
 *         reach (rule.require.hermetic-tests); the real records-vault twin is never touched
 */
import {
  type ChildProcess,
  execFileSync,
  spawn,
  spawnSync,
} from 'child_process';
import { createHash } from 'crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'fs';
import { MalfunctionError } from 'helpful-errors';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../.test/tempDirs';
import { getEnvClearOfOperator } from './work/work.harness';

const PATH_OPERATIONS = join(__dirname, 'work', 'movework.sh');
const TREE = 'infrastructure.beav.feat-vault';
const BRANCH = 'beav/feat-vault';
const ORG = 'sandpine';
const WHY = 'stale twin of the vault tree, its work kept whole';

// claude keys a project dir on the cwd, every non-alphanumeric as a dash
const asProjectDir = (path: string): string =>
  path.replace(/[^A-Za-z0-9]/g, '-');
const asSha = (path: string): string =>
  existsSync(path)
    ? createHash('sha256').update(readFileSync(path)).digest('hex')
    : 'ABSENT';

type Box = 'local' | 'grove-a';

// the paths the twin holds: older bytes of two paths the source carries, untracked records the source lacks, a staged add
const TWIN_WORK: Array<{ path: string; bytes: string; staged?: boolean }> = [
  {
    path: 'src/a.ts',
    bytes: 'export const a = 50; // an older edit, in the twin\n',
  },
  { path: 'notes.md', bytes: 'an older note, in the twin\n' },
  { path: 'records/r1.json', bytes: '{"record":"r1","private":true}\n' },
  { path: 'records/deep/r2.json', bytes: '{"record":"r2","private":true}\n' },
  {
    path: 'src/twin-staged.ts',
    bytes: 'export const twinStaged = 1;\n',
    staged: true,
  },
];

const genScene = () => {
  const dirRoot = realpathSync(tempDirs.genOne({ slug: 'crew-move-twin' }));
  const dirHome = join(dirRoot, 'home');
  const dirGroves = join(dirRoot, 'groves');
  const dirForest = join(dirRoot, 'forest');
  const dirPanes = join(dirRoot, 'panes');
  const pathOrigin = join(dirRoot, 'origin.git');
  const pathGitconfig = join(dirRoot, 'gitconfig');
  for (const dir of [
    dirHome,
    join(dirGroves, 'grove-a'),
    join(dirForest, 'groves'),
    dirPanes,
  ])
    mkdirSync(dir, { recursive: true });
  writeFileSync(
    pathGitconfig,
    [
      '[user]\n  name = Test Human\n  email = human@example.com',
      '[init]\n  defaultBranch = main',
      '[protocol "file"]\n  allow = always',
      '[safe]\n  directory = *',
    ].join('\n'),
  );
  const envGit = {
    ...getEnvClearOfOperator(),
    GIT_CONFIG_GLOBAL: pathGitconfig,
    GIT_CONFIG_NOSYSTEM: '1',
  };
  const git = (cwd: string, args: string[]): string =>
    execFileSync('git', args, { cwd, env: envGit }).toString();

  const homeOf = (box: Box): string =>
    box === 'local' ? dirHome : join(dirGroves, box);
  const treeOf = (box: Box): string =>
    join(homeOf(box), 'git', ORG, '_worktrees', TREE);
  const mainOf = (box: Box): string =>
    join(homeOf(box), 'git', ORG, 'infrastructure');
  const asideDirOf = (): string =>
    join(homeOf('local'), 'git', ORG, '_setaside');

  // origin, seeded once
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', pathOrigin], {
    env: envGit,
  });
  const dirSeed = join(dirRoot, 'seed');
  git(dirRoot, ['clone', '-q', pathOrigin, dirSeed]);
  mkdirSync(join(dirSeed, 'src'));
  writeFileSync(join(dirSeed, 'readme.md'), 'hi\n');
  writeFileSync(join(dirSeed, 'src', 'a.ts'), 'export const a = 1;\n');
  writeFileSync(
    join(dirSeed, '.gitignore'),
    'node_modules/\n.log/\n.agent/repo=*/\n',
  );
  git(dirSeed, ['add', '-A']);
  git(dirSeed, ['commit', '-q', '-m', 'init']);
  git(dirSeed, ['push', '-q', 'origin', 'main']);

  // the source box (grove-a): the crew's tree on a pushed branch, with newer bytes of the paths the twin holds older
  mkdirSync(join(homeOf('grove-a'), 'git', ORG, '_worktrees'), {
    recursive: true,
  });
  git(dirRoot, ['clone', '-q', pathOrigin, mainOf('grove-a')]);
  git(mainOf('grove-a'), [
    'worktree',
    'add',
    '-q',
    '-b',
    BRANCH,
    treeOf('grove-a'),
  ]);
  writeFileSync(
    join(treeOf('grove-a'), 'src', 'c.ts'),
    'export const c = 3;\n',
  );
  git(treeOf('grove-a'), ['add', 'src/c.ts']);
  git(treeOf('grove-a'), ['commit', '-q', '-m', 'feat: c']);
  git(treeOf('grove-a'), ['push', '-q', '-u', 'origin', BRANCH]);
  writeFileSync(
    join(treeOf('grove-a'), 'src', 'a.ts'),
    'export const a = 100; // the newer edit, at the source\n',
  );
  writeFileSync(
    join(treeOf('grove-a'), 'notes.md'),
    'the newer note, at the source\n',
  );
  for (const link of ['repo=ehmpathy/role=mechanic']) {
    mkdirSync(join(treeOf('grove-a'), '.agent', link), { recursive: true });
    writeFileSync(
      join(treeOf('grove-a'), '.agent', link, 'readme.md'),
      'a role\n',
    );
  }
  const dirProjects = join(
    treeOf('grove-a'),
    '.agent',
    '.actors',
    'actor.via.hash=aaaa',
    'brain',
    '.claude',
    'projects',
    asProjectDir(`/src-box${treeOf('grove-a')}`),
  );
  mkdirSync(dirProjects, { recursive: true });
  for (const [name, role] of [
    ['ses-mech.jsonl', 'mechanic'],
    ['ses-fore.jsonl', 'foreman'],
  ] satisfies Array<[string, string]>) {
    const path = join(dirProjects, name);
    writeFileSync(
      path,
      `{"type":"user","message":"hi"}\n{"customTitle":"${role}"}\n`,
    );
    const at = Date.now() / 1000 - 60;
    utimesSync(path, at, at);
  }

  // the destination box (local): a stale twin of the same tree on the same branch at the same head, with work of its own
  mkdirSync(join(homeOf('local'), 'git', ORG, '_worktrees'), {
    recursive: true,
  });
  git(dirRoot, ['clone', '-q', pathOrigin, mainOf('local')]);
  git(mainOf('local'), [
    'worktree',
    'add',
    '-q',
    '-b',
    BRANCH,
    treeOf('local'),
    `origin/${BRANCH}`,
  ]);
  for (const item of TWIN_WORK) {
    mkdirSync(join(treeOf('local'), item.path, '..'), { recursive: true });
    writeFileSync(join(treeOf('local'), item.path), item.bytes);
    if (item.staged) git(treeOf('local'), ['add', item.path]);
  }
  // an ignored path rides the rename too
  mkdirSync(join(treeOf('local'), 'node_modules'), { recursive: true });
  writeFileSync(join(treeOf('local'), 'node_modules', 'junk'), 'junk\n');
  symlinkSync('src/a.ts', join(treeOf('local'), 'link-to-a'));

  // the ledger names the source grove; the forest registers it
  const dirLedger = join(dirRoot, 'crewwork', 'crews');
  mkdirSync(dirLedger, { recursive: true });
  writeFileSync(
    join(dirLedger, `${TREE}.json`),
    JSON.stringify({
      tree: TREE,
      grove: 'cloud://grove-a',
      kind: 'behavior',
      position: '',
      roles: 'mechanic,foreman',
      bootedFirst: 0,
      bootedLast: 0,
    }),
  );
  writeFileSync(
    join(dirForest, 'groves', 'grove-a.json'),
    JSON.stringify({ name: 'grove-a' }),
  );
  writeFileSync(join(dirPanes, 'mechanic.txt'), '❯ \n');
  writeFileSync(join(dirPanes, 'foreman.txt'), '❯ \n');

  const getLedgerGrove = (): string =>
    JSON.parse(readFileSync(join(dirLedger, `${TREE}.json`), 'utf-8')).grove;

  // .what = the porcelain of a tree's work, sorted, with the paths the move never carries left out
  const getStatusOf = (dir: string): string =>
    git(dir, ['status', '--porcelain=v1', '--untracked-files=all'])
      .split('\n')
      .filter(
        (line) =>
          line && !line.includes('.agent/') && !line.includes('node_modules'),
      )
      .sort()
      .join('\n');

  /**
   * .what = run the verb in a driver whose box, seat, and registry boundaries are faked
   * .mock = `ssh` (each grove a dir), `crew.boot`, `duct.read`, `__duct_uri_holds_live_claude`,
   *         and `npx` (first on PATH)
   * .why  = the twin settle is a git act at the destination; the seats and boxes around it
   *         cannot stand in a hermetic run, so each is a fake that records or replays
   * .real = the same pointers as the `run` header of `git.crew.move.integration.test.ts`:
   *         real ssh in move case70 [t1r], real `duct.read` in ductwork.verbs case13, real
   *         `npx rhachet roles link` in the supervisor acceptance suite. git runs for real here
   */
  const run = (args: string[], opts?: { live?: string[] }) => {
    const pathLog = join(dirRoot, 'calls.log');
    const dirBin = join(dirRoot, 'bin');
    mkdirSync(dirBin, { recursive: true });
    writeFileSync(
      join(dirBin, 'npx'),
      [
        '#!/bin/sh',
        'while [ $# -gt 0 ]; do case "$1" in --repo) repo="$2"; shift 2 ;; --role) role="$2"; shift 2 ;; *) shift ;; esac; done',
        'mkdir -p ".agent/repo=$repo/role=$role"',
        'exit 0',
      ].join('\n'),
      { mode: 0o755 },
    );
    const body = [
      'set -uo pipefail',
      // one pipe for both streams, so the render reads in the order a terminal shows it
      'exec 2>&1',
      `source '${PATH_OPERATIONS}'`,
      'ssh() { while [[ $# -gt 0 ]]; do case "$1" in -o|-p|-l|-i|-F) shift 2 ;; -*) shift ;; *) host="$1"; shift; break ;; esac; done; HOME="$FAKE_GROVES/$host" bash -c "$*"; }',
      'crew.boot() { echo "crew.boot $*" >> "$CALL_LOG"; echo "(fake crew.boot)"; return 0; }',
      'duct.read() { local u="" ; while [[ $# -gt 0 ]]; do case "$1" in --on) u="$2"; shift 2 ;; *) shift ;; esac; done; local f="$FAKE_PANES/${u##*/}.txt"; [[ -f "$f" ]] || { echo "✋ duct.read: session $u is absent" >&2; return 2; }; cat "$f"; }',
      '__duct_uri_holds_live_claude() { [[ " $FAKE_LIVE " == *" ${1##*/} "* ]]; }',
      'crew.move "$@"',
      'echo "__EXIT__=$?"',
    ].join('\n');
    const pathDriver = join(dirRoot, 'driver.sh');
    writeFileSync(pathDriver, body);
    const result = spawnSync('bash', [pathDriver, ...args], {
      env: {
        ...envGit,
        HOME: dirHome,
        GIT_FOREST_DIR: dirForest,
        CREWWORK_DIR: join(dirRoot, 'crewwork'),
        DUCTWORK_DIR: join(dirRoot, 'ductwork'),
        TERMWORK_DIR: join(dirRoot, 'termwork'),
        FAKE_GROVES: dirGroves,
        FAKE_PANES: dirPanes,
        GIT_CREW_MOVE_LINK_CMD: join(dirBin, 'npx'),
        GIT_CREW_MOVE_BUILD_CMD: '',
        FAKE_LIVE: (opts?.live ?? []).join(' '),
        GIT_CREW_MOVE_LIVE_TRIES: '1',
        GIT_CREW_MOVE_LIVE_WAIT: '0',
        CALL_LOG: pathLog,
        GIT_CREW_MOVE_INSTALL_CMD:
          'mkdir -p node_modules && echo ok > node_modules/.ok',
        GIT_CREW_MOVE_INSTALL_SHELL: 'bash -c',
        CREW_LEGACY_CLAUDE_DIR: join(dirRoot, 'no-legacy'),
      },
    });
    const out = `${result.stdout.toString()}${result.stderr.toString()}`;
    const marker = out.match(/__EXIT__=(\d+)/);
    const calls = existsSync(pathLog)
      ? readFileSync(pathLog, 'utf-8').split('\n').filter(Boolean)
      : [];
    return { code: marker ? Number(marker[1]) : result.status, out, calls };
  };

  return {
    run,
    git,
    treeOf,
    mainOf,
    asideDirOf,
    getLedgerGrove,
    getStatusOf,
    dirRoot,
  };
};

// .what = a process whose cwd sits in a dir, as a seat left open in the twin; argv0 names it (a claude, or any other)
const genProcIn = (cwd: string, argv0: string): ChildProcess =>
  spawn('bash', ['-c', `exec -a ${argv0} sleep 300`], {
    cwd,
    stdio: 'ignore',
    detached: false,
  });

/**
 * .what = an output with its volatile bytes masked, so a snapshot holds across runs:
 *         the temp root, every sha (12 or 40 hex), the utc stamp of a set-aside dir, and the exit marker
 */
const asMasked = (out: string, dirRoot: string): string =>
  out
    .split(dirRoot)
    .join('<root>')
    .replace(/\b[0-9a-f]{40}\b/g, '<sha40>')
    .replace(/\b[0-9a-f]{12}\b/g, '<head12>')
    .replace(
      new RegExp(`(${TREE.replace(/\./g, '\\.')})\\.[0-9TZ_:-]{8,}`, 'g'),
      '$1.<stamp>',
    )
    .replace(/__EXIT__=\d+\n?/, '');

/**
 * .what = wait until the spawned process has exec'd as argv0, so /proc names it
 * .why  = a fixed sleep guesses at the exec; under a loaded box it can land later, and the
 *         twin judge would find no process for a reason unrelated to its subject. this reads
 *         the state itself, bounded, and fails loud at the bound
 */
const waitForProcExec = async (input: {
  child: ChildProcess;
  argv0: string;
}): Promise<void> => {
  const bound = 50; // 50 reads, 100ms apart: 5s
  const pid = input.child.pid;
  const isExecd = (): boolean => {
    if (!pid) return false;
    try {
      return (
        readFileSync(`/proc/${pid}/cmdline`, 'utf-8').split('\0')[0] ===
        input.argv0
      );
    } catch (error) {
      // the pid is not yet readable: read again. any other fault is real
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
        return false;
      throw error;
    }
  };
  for (let n = 0; n < bound; n++) {
    if (isExecd()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new MalfunctionError("the spawned process never exec'd as argv0", {
    pid,
    argv0: input.argv0,
    hint: 'check that bash supports `exec -a` on this box',
  });
};

describe('git.crew.move --setaside-twin-why (crew-move-twin)', () => {
  afterAll(() => {
    tempDirs.delAll();
  });

  given(
    '[case1] crew-move-twin: a stale twin on the destination at the same head holds older bytes, untracked records, and a staged add',
    () => {
      const scene = useBeforeAll(async () => genScene());
      // an object, never a bare string: useBeforeAll hands back a proxy, and a proxy over a string holds no string methods
      const twin = useBeforeAll(async () => ({
        head: scene.git(scene.treeOf('local'), ['rev-parse', 'HEAD']).trim(),
        status: scene.getStatusOf(scene.treeOf('local')),
        shas: Object.fromEntries(
          TWIN_WORK.map((item) => [
            item.path,
            asSha(join(scene.treeOf('local'), item.path)),
          ]),
        ),
      }));

      when('[t0] plan runs with no flag', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local']),
        );

        then(
          'it refuses the twin, and the fix names --setaside-twin-why',
          () => {
            expect(result.code).toEqual(2);
            expect(result.out).toContain('is already a worktree');
            expect(result.out).toContain("--setaside-twin-why '<why>'");
          },
        );

        then('the refusal render matches the snapshot', () => {
          expect(asMasked(result.out, scene.dirRoot)).toMatchSnapshot();
        });
      });

      when('[t1] plan runs with --drop-twin-why', () => {
        const result = useBeforeAll(async () =>
          scene.run([
            '--tree',
            TREE,
            '--to',
            'local',
            '--drop-twin-why',
            'stale twin of a merged pull',
          ]),
        );

        then(
          'the drop stays refused, and the fix names --setaside-twin-why as the path that keeps the work',
          () => {
            expect(result.code).toEqual(2);
            expect(result.out).toContain('it is no stale twin safe to drop');
            expect(result.out).toContain(
              "pass --setaside-twin-why '<why>' instead",
            );
          },
        );

        then('the refusal render matches the snapshot', () => {
          expect(asMasked(result.out, scene.dirRoot)).toMatchSnapshot();
        });
      });

      when('[t2] plan runs with --setaside-twin-why', () => {
        const result = useBeforeAll(async () =>
          scene.run([
            '--tree',
            TREE,
            '--to',
            'local',
            '--setaside-twin-why',
            WHY,
          ]),
        );

        then(
          'it exits 0 and names the set-aside as a settle, with the why and the apply command',
          () => {
            expect(result.code).toEqual(0);
            expect(result.out).toContain(
              `settle: set aside the stale twin worktree ${scene.treeOf('local')} at ${twin.head.slice(0, 12)}`,
            );
            expect(result.out).toContain(
              `rename it whole to ${scene.asideDirOf()}/${TREE}.<utc stamp>`,
            );
            expect(result.out).toContain('never a delete');
            expect(result.out).toContain(`settle: set-aside-twin why: ${WHY}`);
            expect(result.out).toContain(`--setaside-twin-why '${WHY}'`);
          },
        );

        then('the plan render matches the snapshot', () => {
          expect(asMasked(result.out, scene.dirRoot)).toMatchSnapshot();
        });

        then(
          'plan reads only: the twin stands as it was, and no set-aside dir exists',
          () => {
            expect(scene.getStatusOf(scene.treeOf('local'))).toEqual(
              twin.status,
            );
            expect(existsSync(scene.asideDirOf())).toEqual(false);
            expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
          },
        );
      });

      when('[t3] apply runs with --setaside-twin-why', () => {
        const result = useBeforeAll(async () =>
          scene.run(
            [
              '--tree',
              TREE,
              '--to',
              'local',
              '--mode',
              'apply',
              '--setaside-twin-why',
              WHY,
            ],
            { live: ['mechanic', 'foreman'] },
          ),
        );
        const aside = useBeforeAll(async () => {
          const names = existsSync(scene.asideDirOf())
            ? readdirSync(scene.asideDirOf())
            : [];
          const tree =
            names.find(
              (n) => n.startsWith(`${TREE}.`) && !n.endsWith('.gitadmin'),
            ) ?? 'ABSENT';
          return {
            names,
            dir: join(scene.asideDirOf(), tree),
            admin: join(scene.asideDirOf(), `${tree}.gitadmin`),
          };
        });

        then(
          'it exits 0, says it set the twin aside, and reads both back',
          () => {
            expect(result.out).toContain('✅ moved');
            expect(result.code).toEqual(0);
            expect(result.out).toContain(
              `set aside the stale twin worktree ${scene.treeOf('local')} at ${twin.head.slice(0, 12)}: now at ${aside.dir}`,
            );
            expect(result.out).toContain(
              'read back: the repo lists no worktree at the old path, the path is free',
            );
            expect(result.out).toContain(`set-aside-twin why: ${WHY}`);
          },
        );

        then('the apply render matches the snapshot', () => {
          expect(asMasked(result.out, scene.dirRoot)).toMatchSnapshot();
        });

        then(
          'the set-aside dir holds every twin byte: each path at the same sha256, the ignored path and the link too',
          () => {
            expect(aside.names.sort()).toEqual(
              [aside.dir.split('/').pop(), aside.admin.split('/').pop()].sort(),
            );
            for (const item of TWIN_WORK)
              expect(asSha(join(aside.dir, item.path))).toEqual(
                twin.shas[item.path],
              );
            expect(
              readFileSync(join(aside.dir, 'node_modules', 'junk'), 'utf-8'),
            ).toEqual('junk\n');
            expect(existsSync(join(aside.dir, 'link-to-a'))).toEqual(true);
          },
        );

        then(
          'the set-aside tree still reads as the twin did: same head, same work, the staged add still staged',
          () => {
            expect(scene.git(aside.dir, ['rev-parse', 'HEAD']).trim()).toEqual(
              twin.head,
            );
            expect(scene.getStatusOf(aside.dir)).toEqual(twin.status);
            expect(scene.getStatusOf(aside.dir)).toContain(
              'A  src/twin-staged.ts',
            );
            expect(existsSync(join(aside.admin, 'gitlink.prior'))).toEqual(
              true,
            );
          },
        );

        then(
          'the twin registration is gone: the repo lists one worktree at the path, the moved tree, and none at the set-aside dir',
          () => {
            const listed = scene.git(scene.mainOf('local'), [
              'worktree',
              'list',
              '--porcelain',
            ]);
            expect(
              listed
                .split('\n')
                .filter((l) => l === `worktree ${scene.treeOf('local')}`),
            ).toHaveLength(1);
            expect(listed).not.toContain(aside.dir);
          },
        );

        then(
          'the moved tree holds the source bytes, never the twin older bytes',
          () => {
            const dest = scene.treeOf('local');
            expect(readFileSync(join(dest, 'src', 'a.ts'), 'utf-8')).toEqual(
              'export const a = 100; // the newer edit, at the source\n',
            );
            expect(readFileSync(join(dest, 'notes.md'), 'utf-8')).toEqual(
              'the newer note, at the source\n',
            );
            expect(existsSync(join(dest, 'records', 'r1.json'))).toEqual(false);
            expect(scene.getStatusOf(dest)).toEqual(
              scene.getStatusOf(scene.treeOf('grove-a')),
            );
          },
        );

        then(
          'the ledger names the destination, and the source tree is untouched',
          () => {
            expect(scene.getLedgerGrove()).toEqual('local');
            expect(
              readFileSync(
                join(scene.treeOf('grove-a'), 'src', 'a.ts'),
                'utf-8',
              ),
            ).toEqual(
              'export const a = 100; // the newer edit, at the source\n',
            );
          },
        );
      });
    },
  );

  given(
    '[case2] crew-move-twin: the stale twin has a claude at work in it',
    () => {
      const scene = useBeforeAll(async () => genScene());
      const proc = useBeforeAll(async () => ({
        child: genProcIn(scene.treeOf('local'), 'claude'),
      }));
      afterAll(() => {
        proc.child.kill('SIGKILL');
      });

      when('[t0] apply runs with --setaside-twin-why', () => {
        const result = useBeforeAll(async () => {
          await waitForProcExec({ child: proc.child, argv0: 'claude' });
          return scene.run([
            '--tree',
            TREE,
            '--to',
            'local',
            '--mode',
            'apply',
            '--setaside-twin-why',
            WHY,
          ]);
        });

        then('it exits 2, names the live claude, and touches naught', () => {
          expect(result.code).toEqual(2);
          expect(result.out).toContain(
            `a live claude is at work in the stale twin ${scene.treeOf('local')}`,
          );
          expect(existsSync(scene.asideDirOf())).toEqual(false);
          expect(
            readFileSync(
              join(scene.treeOf('local'), 'records', 'r1.json'),
              'utf-8',
            ),
          ).toEqual('{"record":"r1","private":true}\n');
          expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
          expect(result.calls).toEqual([]);
        });

        then('the live-claude refusal render matches the snapshot', () => {
          expect(asMasked(result.out, scene.dirRoot)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case3] crew-move-twin: the stale twin has another process at work in it',
    () => {
      const scene = useBeforeAll(async () => genScene());
      const proc = useBeforeAll(async () => ({
        child: genProcIn(scene.treeOf('local'), 'vault-shell'),
      }));
      afterAll(() => {
        proc.child.kill('SIGKILL');
      });

      when('[t0] apply runs with --setaside-twin-why', () => {
        const result = useBeforeAll(async () => {
          await waitForProcExec({ child: proc.child, argv0: 'vault-shell' });
          return scene.run([
            '--tree',
            TREE,
            '--to',
            'local',
            '--mode',
            'apply',
            '--setaside-twin-why',
            WHY,
          ]);
        });

        then('it exits 2, names the process count, and touches naught', () => {
          expect(result.code).toEqual(2);
          expect(result.out).toContain(
            `1 process(es) at work in the stale twin ${scene.treeOf('local')}`,
          );
          expect(existsSync(scene.asideDirOf())).toEqual(false);
          expect(
            existsSync(join(scene.treeOf('local'), 'records', 'r1.json')),
          ).toEqual(true);
        });

        then('the process refusal render matches the snapshot', () => {
          expect(asMasked(result.out, scene.dirRoot)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case5] crew-move-twin: a pointer of the set-aside twin cannot be written',
    () => {
      const scene = useBeforeAll(async () => {
        const made = genScene();
        // the twin's .git link is read-only: the rename succeeds, the pointer write after it fails
        chmodSync(join(made.treeOf('local'), '.git'), 0o444);
        return made;
      });
      const twin = useBeforeAll(async () => ({
        status: scene.getStatusOf(scene.treeOf('local')),
      }));

      when('[t0] apply runs with --setaside-twin-why', () => {
        const result = useBeforeAll(async () =>
          scene.run(
            [
              '--tree',
              TREE,
              '--to',
              'local',
              '--mode',
              'apply',
              '--setaside-twin-why',
              WHY,
            ],
            { live: ['mechanic', 'foreman'] },
          ),
        );

        then('it exits 1 and says the twin was put back', () => {
          expect(result.code).toEqual(1);
          expect(result.out).toContain(
            `a pointer of the set-aside twin could not be written; the twin was put back at ${scene.treeOf('local')}`,
          );
        });

        then(
          'the twin stands at its own path and still reads as it did; no set-aside pair is left',
          () => {
            expect(scene.getStatusOf(scene.treeOf('local'))).toEqual(
              twin.status,
            );
            const names = existsSync(scene.asideDirOf())
              ? readdirSync(scene.asideDirOf())
              : [];
            expect(names).toEqual([]);
            expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
          },
        );

        then(
          'the grove own words ride under the tree, never flush-left',
          () => {
            const lines = result.out.split('\n');
            expect(lines.filter((line) => line.startsWith('cp:'))).toEqual([]);
            expect(
              lines.filter((line) => line.startsWith('💥 MalfunctionError')),
            ).toEqual([]);
            expect(
              lines.some((line) =>
                line.startsWith('   │  │  💥 MalfunctionError: a pointer'),
              ),
            ).toEqual(true);
          },
        );

        then('the put-back render matches the snapshot', () => {
          expect(asMasked(result.out, scene.dirRoot)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case4] crew-move-twin: the call is wrong', () => {
    const scene = useBeforeAll(async () => genScene());

    when('[t0] --setaside-twin-why is under three words', () => {
      const result = useBeforeAll(async () =>
        scene.run([
          '--tree',
          TREE,
          '--to',
          'local',
          '--setaside-twin-why',
          'just because',
        ]),
      );

      then('it exits 2 and names the bound', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain(
          '--setaside-twin-why needs a reason of three words or more',
        );
      });

      then('the bound refusal render matches the snapshot', () => {
        expect(asMasked(result.out, scene.dirRoot)).toMatchSnapshot();
      });
    });

    when('[t1] --setaside-twin-why rides beside --drop-twin-why', () => {
      const result = useBeforeAll(async () =>
        scene.run([
          '--tree',
          TREE,
          '--to',
          'local',
          '--setaside-twin-why',
          WHY,
          '--drop-twin-why',
          'stale twin of a merged pull',
        ]),
      );

      then('it exits 2 and names the two acts', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain(
          '--setaside-twin-why and --drop-twin-why name two acts on one twin',
        );
      });

      then('the two-acts refusal render matches the snapshot', () => {
        expect(asMasked(result.out, scene.dirRoot)).toMatchSnapshot();
      });
    });

    when('[t2] --setaside-twin-why rides beside --into-extant', () => {
      const result = useBeforeAll(async () =>
        scene.run([
          '--tree',
          TREE,
          '--to',
          'local',
          '--into-extant',
          '--setaside-twin-why',
          WHY,
        ]),
      );

      then('it exits 2 and names the flag pair', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain(
          '--into-extant takes no --setaside-twin-why',
        );
      });

      then('the flag-pair refusal render matches the snapshot', () => {
        expect(asMasked(result.out, scene.dirRoot)).toMatchSnapshot();
      });
    });
  });
});
