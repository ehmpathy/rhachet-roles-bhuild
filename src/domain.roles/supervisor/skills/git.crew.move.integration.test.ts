/**
 * .what = clamps on `git.crew.move` — move a crew from one grove to another
 *
 * .why  = a weekly limit stalled every crew on one grove while other groves held free seats, and no
 *         verb took a crew between boxes. the verb must:
 *           1. plan: read only. names the source from the ledger, the branch and head, the carry,
 *              each seat and its transcript, and every refusal
 *           2. apply: raise the tree at the destination on the same branch, carry every dirty path
 *              byte for byte, carry the transcripts under the destination's own project dir, flip the
 *              ledger, boot the seats resumed, and leave the source on disk untouched
 *           3. verify: prove the same head, bytes, ledger row, and live seats; exit 1 on a miss
 *           4. refuse (exit 2, naught moved) a busy seat, a box with typed text, a held or unknown
 *              grove, an org outside the allow list, a destination path already a worktree
 *           5. work in every direction: cloud to local, local to cloud, cloud to cloud
 *           6. --into-extant: land the crew INTO a destination worktree that already stands on the same
 *              branch at the same head. each source path is written when absent, skipped when the bytes are
 *              the same, overwritten only over a clean tracked copy, and refused (naught written) over any
 *              other bytes. a destination path the source does not carry is never touched
 *
 * .how  = temp groves: one dir per grove holds its own $HOME/git/<org>/..., all cut from one bare origin.
 *         a bash driver sources the operations file and replaces the three boundaries — ssh (runs the
 *         remote command with the grove's HOME), crew.boot (records), duct.read (reads a pane fixture).
 *         the box half (git, tar, sha256sum) runs for real. no real grove, ledger, or tree is in reach
 *         (rule.require.hermetic-tests)
 */
import { execFileSync, spawnSync } from 'child_process';
import { createHash } from 'crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'fs';
import { ConstraintError, MalfunctionError } from 'helpful-errors';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../.test/tempDirs';
import { getEnvClearOfOperator } from './work/work.harness';

const DIR_SKILLS = __dirname;
const PATH_OPERATIONS = join(DIR_SKILLS, 'work', 'movework.sh');
const PATH_VERB = join(DIR_SKILLS, 'git.crew.move.sh');
const TREE = 'infrastructure.beav.fix-x';
const BRANCH = 'beav/fix-x';

// claude keys a project dir on the cwd, every non-alphanumeric as a dash
const asProjectDir = (path: string): string =>
  path.replace(/[^A-Za-z0-9]/g, '-');

type Box = 'local' | 'grove-a' | 'grove-b';

const genScene = (input: {
  org?: string;
  side?: Box;
  unpushed?: boolean;
  destTreePreexists?: boolean;
  destHookFails?: boolean;
  destStale?:
    | 'behind'
    | 'diverged'
    | 'rebased'
    | 'rebased-stray'
    | 'rebased-merge';
  destMirror?: 'clean' | 'dirty';
  destTwin?: 'safe' | 'dirty' | 'unmerged';
  destExtant?: 'disjoint' | 'differs' | 'behind';
  // a third seat, the reflector, that holds no transcript: 'shell' = its duct stands as a bare shell, 'nopane' = no duct stands
  bareSeat?: 'shell' | 'nopane';
  // the repo tracks `.claude` as a link to one actor, and the source tree relinked it to another (what the tree's own init does)
  // 'same' = the source tree's link is the committed one too (an older init accepted it), so no mirror can name the wanted actor
  claudeLink?: boolean | 'same';
  // the repo is a package that runs itself (ehmpathy/rhachet's own shape): "prepare" calls "npm run prepare:rhachet",
  // which reaches the package's OWN bin only through its "bin" field — "prepare" never names "bin/" in its own text
  selfBuilt?: boolean;
}) => {
  const org = input.org ?? 'sandpine';
  const side: Box = input.side ?? 'grove-a';
  const dirRoot = realpathSync(tempDirs.genOne({ slug: 'crew-move' }));
  const dirHome = join(dirRoot, 'home');
  const dirGroves = join(dirRoot, 'groves');
  const dirForest = join(dirRoot, 'forest');
  const dirPanes = join(dirRoot, 'panes');
  const pathOrigin = join(dirRoot, 'origin.git');
  const pathGitconfig = join(dirRoot, 'gitconfig');
  for (const dir of [
    dirHome,
    join(dirGroves, 'grove-a'),
    join(dirGroves, 'grove-b'),
    join(dirForest, 'groves'),
    dirPanes,
  ]) {
    mkdirSync(dir, { recursive: true });
  }
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
    join(homeOf(box), 'git', org, '_worktrees', TREE);
  const mainOf = (box: Box): string =>
    join(homeOf(box), 'git', org, 'infrastructure');

  // origin, seeded once
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', pathOrigin], {
    env: envGit,
  });
  const dirSeed = join(dirRoot, 'seed');
  git(dirRoot, ['clone', '-q', pathOrigin, dirSeed]);
  mkdirSync(join(dirSeed, 'src'));
  writeFileSync(join(dirSeed, 'readme.md'), 'hi\n');
  writeFileSync(join(dirSeed, 'src', 'a.ts'), 'export const a = 1;\n');
  writeFileSync(join(dirSeed, 'src', 'b.ts'), 'export const b = 2;\n');
  writeFileSync(
    join(dirSeed, '.gitignore'),
    'node_modules/\n.log/\n.agent/repo=*/\n',
  );
  if (input.claudeLink) {
    // two actors tracked, and `.claude` committed as a link to the ambient one
    for (const [actor, file] of [
      ['actor.via.repo=ambient', 'settings.of.repo.json'],
      ['actor.via.slug=.default', 'settings.json'],
    ] satisfies Array<[string, string]>) {
      mkdirSync(join(dirSeed, '.agent', '.actors', actor, 'brain', '.claude'), {
        recursive: true,
      });
      writeFileSync(
        join(dirSeed, '.agent', '.actors', actor, 'brain', '.claude', file),
        '{}\n',
      );
    }
    symlinkSync(
      '.agent/.actors/actor.via.repo=ambient/brain/.claude',
      join(dirSeed, '.claude'),
    );
  }
  if (input.selfBuilt) {
    // ehmpathy/rhachet's own shape (read off its real package.json, 2026-11-21): "prepare" never names
    // "bin/" in its own text — it calls "npm run prepare:rhachet", which reaches the package's own
    // bin/run only through the "bin" field, several calls removed
    writeFileSync(
      join(dirSeed, 'package.json'),
      JSON.stringify(
        {
          name: 'pkg',
          bin: { pkg: './bin/run' },
          scripts: {
            prepare:
              'if [ -e .git ] && [ -z $CI ]; then npm run prepare:husky && npm run prepare:rhachet; fi',
            'prepare:rhachet': 'rhachet init',
            'build:compile:tsc': 'tsc',
            'build:complete': 'touch dist/.build.stamp',
          },
        },
        null,
        2,
      ),
    );
    mkdirSync(join(dirSeed, 'bin'));
    writeFileSync(join(dirSeed, 'bin', 'run'), '#!/bin/sh\n', { mode: 0o755 });
    writeFileSync(
      join(dirSeed, '.gitignore'),
      'node_modules/\n.log/\n.agent/repo=*/\ndist/\n',
    );
  }
  git(dirSeed, ['add', '-A']);
  git(dirSeed, ['commit', '-q', '-m', 'init']);
  git(dirSeed, ['push', '-q', 'origin', 'main']);

  // the source box: a main checkout, and the crew's tree on a pushed branch
  mkdirSync(join(homeOf(side), 'git', org, '_worktrees'), { recursive: true });
  git(dirRoot, ['clone', '-q', pathOrigin, mainOf(side)]);
  git(mainOf(side), ['worktree', 'add', '-q', '-b', BRANCH, treeOf(side)]);
  writeFileSync(join(treeOf(side), 'src', 'c.ts'), 'export const c = 3;\n');
  git(treeOf(side), ['add', 'src/c.ts']);
  git(treeOf(side), ['commit', '-q', '-m', 'feat: c']);
  git(treeOf(side), ['push', '-q', '-u', 'origin', BRANCH]);
  if (input.unpushed) {
    writeFileSync(join(treeOf(side), 'src', 'd.ts'), 'export const d = 4;\n');
    git(treeOf(side), ['add', 'src/d.ts']);
    git(treeOf(side), ['commit', '-q', '-m', 'feat: d, unpushed']);
  }

  // the dirty set: modified, staged add, unstaged delete, untracked (deep, exec bit, symlink),
  // and the ignored paths the carry must leave out
  const tree = treeOf(side);
  writeFileSync(join(tree, 'src', 'a.ts'), 'export const a = 100; // edited\n');
  writeFileSync(join(tree, 'src', 'staged.ts'), 'export const staged = 1;\n');
  git(tree, ['add', 'src/staged.ts']);
  execFileSync('rm', [join(tree, 'src', 'b.ts')]);
  writeFileSync(join(tree, 'notes.md'), 'a note\n');
  mkdirSync(join(tree, 'docs', 'deep'), { recursive: true });
  writeFileSync(join(tree, 'docs', 'deep', 'x.txt'), 'deep\n');
  mkdirSync(join(tree, 'bin'), { recursive: true });
  writeFileSync(join(tree, 'bin', 'run.sh'), '#!/bin/sh\necho run\n', {
    mode: 0o755,
  });
  symlinkSync('src/a.ts', join(tree, 'link-to-a'));
  mkdirSync(join(tree, 'node_modules'), { recursive: true });
  writeFileSync(join(tree, 'node_modules', 'junk'), 'junk\n');
  mkdirSync(join(tree, '.log'), { recursive: true });
  writeFileSync(join(tree, '.log', 'x.log'), 'log\n');
  if (input.claudeLink === true) {
    // the source tree's own init relinked `.claude` to the actor it wants: a box-local change, never carried
    rmSync(join(tree, '.claude'));
    symlinkSync(
      '.agent/.actors/actor.via.slug=.default/brain/.claude',
      join(tree, '.claude'),
    );
  }

  // the role links: gitignored, so git carries none. repo=.this is the repo's own and is never relinked
  for (const link of [
    'repo=ehmpathy/role=mechanic',
    'repo=bhrain/role=driver',
    'repo=.this/role=any',
  ]) {
    mkdirSync(join(tree, '.agent', link), { recursive: true });
    writeFileSync(join(tree, '.agent', link, 'readme.md'), 'a role\n');
  }

  // the seats' conversations: an older and a newer mechanic transcript, a foreman one, a session dir
  const dirProjects = join(
    tree,
    '.agent',
    '.actors',
    'actor.via.hash=aaaa',
    'brain',
    '.claude',
    'projects',
    asProjectDir(`/src-box${tree}`),
  );
  mkdirSync(join(dirProjects, 'ses-mech-new', 'subagents'), {
    recursive: true,
  });
  const setTranscript = (name: string, role: string, ageSecs: number) => {
    const path = join(dirProjects, name);
    writeFileSync(
      path,
      `{"type":"user","message":"hi"}\n{"customTitle":"${role}"}\n`,
    );
    const at = Date.now() / 1000 - ageSecs;
    utimesSync(path, at, at);
  };
  setTranscript('ses-mech-old.jsonl', 'mechanic', 7200);
  setTranscript('ses-mech-new.jsonl', 'mechanic', 60);
  setTranscript('ses-fore.jsonl', 'foreman', 120);
  writeFileSync(
    join(dirProjects, 'ses-mech-new', 'subagents', 's1.jsonl'),
    'sub\n',
  );

  // the destination, when a test needs the path already taken
  if (input.destTreePreexists) {
    const dest: Box = side === 'local' ? 'grove-a' : 'local';
    mkdirSync(join(homeOf(dest), 'git', org, '_worktrees'), {
      recursive: true,
    });
    git(dirRoot, ['clone', '-q', pathOrigin, mainOf(dest)]);
    git(mainOf(dest), [
      'worktree',
      'add',
      '-q',
      '-b',
      'beav/other',
      treeOf(dest),
    ]);
  }

  // the destination, when a test needs an extant worktree of the same tree: the same branch at the same head
  // (cut from the pushed branch), with work of its own that the source does not carry: untracked record files
  // and one tracked edit. 'disjoint' shares one untracked file with the source, at the same bytes; 'differs'
  // holds two paths the source carries at other bytes (one untracked, one a tracked edit); 'behind' stands
  // at another head
  const pathsRecord = [
    'records/r1.json',
    'records/r4.json',
    'records/deep/r2.json',
    'records/deep/r3.json',
    'records/deep/r5.json',
  ];
  if (input.destExtant) {
    const dest: Box = side === 'local' ? 'grove-a' : 'local';
    mkdirSync(join(homeOf(dest), 'git', org, '_worktrees'), {
      recursive: true,
    });
    git(dirRoot, ['clone', '-q', pathOrigin, mainOf(dest)]);
    git(mainOf(dest), [
      'worktree',
      'add',
      '-q',
      '-b',
      BRANCH,
      treeOf(dest),
      `origin/${BRANCH}`,
    ]);
    if (input.destExtant === 'behind')
      git(treeOf(dest), ['reset', '-q', '--hard', 'origin/main']);
    mkdirSync(join(treeOf(dest), 'records', 'deep'), { recursive: true });
    for (const path of pathsRecord)
      writeFileSync(
        join(treeOf(dest), path),
        `{"record":"${path}","private":true}\n`,
      );
    writeFileSync(
      join(treeOf(dest), 'readme.md'),
      'hi, edited at the destination\n',
    );
    if (input.destExtant === 'disjoint')
      writeFileSync(join(treeOf(dest), 'notes.md'), 'a note\n');
    if (input.destExtant === 'differs') {
      writeFileSync(
        join(treeOf(dest), 'notes.md'),
        'a different note at the destination\n',
      );
      writeFileSync(
        join(treeOf(dest), 'src', 'a.ts'),
        'export const a = 7; // edited at the destination\n',
      );
    }
  }
  const getShaOf = (box: Box, path: string): string => {
    const full = join(treeOf(box), path);
    return existsSync(full)
      ? createHash('sha256').update(readFileSync(full)).digest('hex')
      : 'ABSENT';
  };

  // the destination, when a test needs a stale twin: an earlier life of the same tree, at the same path on the
  // same branch, whose one commit was pushed (its remote ref stale at that commit, as a box that never fetched
  // after the source pushed again) and, unless 'unmerged', merged into origin/main. the source head lacks it
  if (input.destTwin) {
    const dest: Box = side === 'local' ? 'grove-a' : 'local';
    mkdirSync(join(homeOf(dest), 'git', org, '_worktrees'), {
      recursive: true,
    });
    git(dirRoot, ['clone', '-q', pathOrigin, mainOf(dest)]);
    git(mainOf(dest), [
      'worktree',
      'add',
      '-q',
      '-b',
      BRANCH,
      treeOf(dest),
      'origin/main',
    ]);
    writeFileSync(join(treeOf(dest), 'twin.ts'), 'export const twin = 1;\n');
    git(treeOf(dest), ['add', 'twin.ts']);
    git(treeOf(dest), [
      'commit',
      '-q',
      '-m',
      'feat: twin work, shipped long ago',
    ]);
    const twinHead = git(treeOf(dest), ['rev-parse', 'HEAD']).trim();
    if (input.destTwin !== 'unmerged')
      git(treeOf(dest), ['push', '-q', 'origin', 'HEAD:main']);
    git(mainOf(dest), [
      'update-ref',
      `refs/remotes/origin/${BRANCH}`,
      twinHead,
    ]);
    git(treeOf(dest), [
      'branch',
      '-q',
      `--set-upstream-to=origin/${BRANCH}`,
      BRANCH,
    ]);
    if (input.destTwin === 'dirty')
      writeFileSync(join(treeOf(dest), 'wip.txt'), 'unshipped\n');
  }

  // the destination, when a test needs a stale local copy of the branch: behind the source head (an ancestor
  // of it) or diverged (a commit the source head lacks), alone or held by a mirror worktree under _mirrors/
  const dirMirror = join(
    homeOf(side === 'local' ? 'grove-a' : 'local'),
    'git',
    org,
    '_mirrors',
    'infrastructure.mirror',
  );
  if (input.destStale) {
    const dest: Box = side === 'local' ? 'grove-a' : 'local';
    mkdirSync(join(homeOf(dest), 'git', org, '_worktrees'), {
      recursive: true,
    });
    git(dirRoot, ['clone', '-q', pathOrigin, mainOf(dest)]);
    if (input.destMirror) {
      mkdirSync(join(homeOf(dest), 'git', org, '_mirrors'), {
        recursive: true,
      });
      git(mainOf(dest), [
        'worktree',
        'add',
        '-q',
        '-b',
        BRANCH,
        dirMirror,
        'origin/main',
      ]);
      if (input.destMirror === 'dirty')
        writeFileSync(join(dirMirror, 'scratch.txt'), 'wip\n');
    } else if (input.destStale === 'behind') {
      git(mainOf(dest), ['branch', BRANCH, 'origin/main']);
    } else if (
      input.destStale === 'rebased' ||
      input.destStale === 'rebased-stray' ||
      input.destStale === 'rebased-merge'
    ) {
      // a pre-rebase copy: the same patch as the source's commit, under another sha (another message)
      git(mainOf(dest), ['checkout', '-q', '-b', BRANCH, 'origin/main']);
      writeFileSync(join(mainOf(dest), 'src', 'c.ts'), 'export const c = 3;\n');
      git(mainOf(dest), ['add', 'src/c.ts']);
      git(mainOf(dest), [
        'commit',
        '-q',
        '-m',
        'feat: c, as it stood before the rebase',
      ]);
      if (input.destStale === 'rebased-stray') {
        writeFileSync(
          join(mainOf(dest), 'stray.ts'),
          'export const stray = 1;\n',
        );
        git(mainOf(dest), ['add', 'stray.ts']);
        git(mainOf(dest), [
          'commit',
          '-q',
          '-m',
          'feat: stray, only at the destination',
        ]);
      }
      if (input.destStale === 'rebased-merge') {
        // a side branch merged in with a merge commit: a merge has no patch of its own, so it is never set aside
        git(mainOf(dest), ['checkout', '-q', '-b', 'side-work', 'origin/main']);
        writeFileSync(
          join(mainOf(dest), 'side.ts'),
          'export const side = 1;\n',
        );
        git(mainOf(dest), ['add', 'side.ts']);
        git(mainOf(dest), ['commit', '-q', '-m', 'feat: side work']);
        git(mainOf(dest), ['checkout', '-q', BRANCH]);
        git(mainOf(dest), [
          'merge',
          '-q',
          '--no-ff',
          '-m',
          'merge: side work into the branch',
          'side-work',
        ]);
      }
      git(mainOf(dest), ['checkout', '-q', 'main']);
    } else {
      git(mainOf(dest), ['checkout', '-q', '-b', BRANCH, 'origin/main']);
      writeFileSync(
        join(mainOf(dest), 'stray.ts'),
        'export const stray = 1;\n',
      );
      git(mainOf(dest), ['add', 'stray.ts']);
      git(mainOf(dest), [
        'commit',
        '-q',
        '-m',
        'feat: stray, only at the destination',
      ]);
      git(mainOf(dest), ['checkout', '-q', 'main']);
    }
  }

  // the destination clone, when a test needs it to hold a husky post-checkout hook whose install never
  // ran: the hook leaves a marker, then fails as the real one did (`.husky/_/husky.sh: No such file`)
  const pathHookMarker = join(dirRoot, 'hook-ran.txt');
  if (input.destHookFails) {
    const dest: Box = side === 'local' ? 'grove-a' : 'local';
    mkdirSync(join(homeOf(dest), 'git', org, '_worktrees'), {
      recursive: true,
    });
    git(dirRoot, ['clone', '-q', pathOrigin, mainOf(dest)]);
    writeFileSync(
      join(mainOf(dest), '.git', 'hooks', 'post-checkout'),
      [
        '#!/bin/sh',
        `echo ran >> '${pathHookMarker}'`,
        '. "$(dirname "$0")/_/husky.sh"',
        '',
      ].join('\n'),
      { mode: 0o755 },
    );
  }

  // the ledger and the forest registry
  const dirLedger = join(dirRoot, 'crewwork', 'crews');
  mkdirSync(dirLedger, { recursive: true });
  writeFileSync(
    join(dirLedger, `${TREE}.json`),
    JSON.stringify({
      tree: TREE,
      grove: side === 'local' ? 'local' : `cloud://${side}`,
      kind: 'behavior',
      position: '',
      roles: input.bareSeat ? 'mechanic,foreman,reflector' : 'mechanic,foreman',
      bootedFirst: 0,
      bootedLast: 0,
    }),
  );
  for (const name of ['grove-a', 'grove-b']) {
    writeFileSync(
      join(dirForest, 'groves', `${name}.json`),
      JSON.stringify({ name }),
    );
  }

  const setPane = (role: string, text: string) =>
    writeFileSync(join(dirPanes, `${role}.txt`), text);
  setPane('mechanic', '❯ \n');
  setPane('foreman', '❯ \n');
  if (input.bareSeat === 'shell')
    setPane('reflector', 'camper in the-tree on beav/fix-x\n➜ \n');

  const getLedgerGrove = (): string =>
    JSON.parse(readFileSync(join(dirLedger, `${TREE}.json`), 'utf-8')).grove;

  /**
   * .what = run the verb in a driver whose box, seat, and registry boundaries are faked
   * .mock = `ssh` (each grove a dir; the remote command runs with that grove's HOME),
   *         `crew.boot`, `duct.read`, `__duct_uri_holds_live_claude`, and `npx` (first on PATH)
   * .why  = a move spans two boxes and a live claude per seat; a hermetic run cannot hold two
   *         hosts, a tmux server per grove, and a registry install, so each boundary is a fake
   *         that records its call or replays a pane
   * .real = ssh: case70 [t1r] hands the move's own argv to the real client (`FAKE_SSH_REAL`).
   *         git, rsync, flock, and the ledger run for real in every case.
   *         `duct.read`: ductwork.verbs case13, case14 [t1], case18 run it on a private tmux socket.
   *         `npx rhachet roles link`: the supervisor acceptance suite runs it in a consumer repo.
   *         `crew.boot` and `__duct_uri_holds_live_claude` on a live pane: no hermetic real run
   *         here; proven by the hetzner walk, and owed a clamp
   *         (`.dream/v2026_11_27.test.real-seat-boundaries-for-crew-move.md`)
   */
  const run = (
    args: string[],
    opts?: {
      pathOperations?: string;
      live?: string[];
      orgs?: string;
      localOnly?: string;
      bootRc?: number;
      bootSays?: string;
      installCmd?: string;
      buildCmd?: string;
      linkNeedsDist?: boolean;
      remoteShell?: string;
      linkFails?: boolean;
      sshNoise?: boolean;
      /** a grove whose ssh finds no route: exit 255, as a box off the tailnet answers */
      sshDown?: string;
      /** a seat whose duct.read fails with no verdict (`cannot reach`), never `is absent` */
      readFails?: string;
      /** seats whose liveness read gets no answer: rc 3, as an unread grove */
      unread?: string[];
      /** the move lock of the tree is held by another apply */
      lockHeld?: boolean;
      /** a grove, registered here, whose box run goes through the REAL ssh client */
      sshReal?: string;
    },
  ) => {
    if (opts?.sshReal) {
      writeFileSync(
        join(dirForest, 'groves', `${opts.sshReal}.json`),
        JSON.stringify({ name: opts.sshReal }),
      );
      // the wake's alias, written as a woken grove holds it: the row's login (camper) is pinned, so the
      // cure does not turn on whether the local user happens to be camper (rule.require.hermetic-tests)
      mkdirSync(join(dirHome, '.ssh'), { recursive: true });
      writeFileSync(
        join(dirHome, '.ssh', 'config'),
        `Host ${opts.sshReal}\n  HostName ${opts.sshReal}\n  User camper\n  Port 22\n`,
      );
    }
    const pathLog = join(dirRoot, 'calls.log');
    // a fake npx: `npx rhachet roles link --repo R --role X` makes the link dir in the cwd, or fails when told to
    const dirBin = join(dirRoot, 'bin');
    mkdirSync(dirBin, { recursive: true });
    writeFileSync(
      join(dirBin, 'npx'),
      [
        '#!/bin/sh',
        '[ -n "$FAKE_LINK_FAILS" ] && { echo "link refused" >&2; exit 1; }',
        // a self-hosted rhachet links roles through its own dist: no dist, no link
        '[ -n "$FAKE_LINK_NEEDS_DIST" ] && [ ! -e dist/contract/cli/invoke.js ] && { echo "Cannot find module ../dist/contract/cli/invoke" >&2; exit 1; }',
        'while [ $# -gt 0 ]; do case "$1" in --repo) repo="$2"; shift 2 ;; --role) role="$2"; shift 2 ;; *) shift ;; esac; done',
        'mkdir -p ".agent/repo=$repo/role=$role"',
        'exit 0',
      ].join('\n'),
      { mode: 0o755 },
    );
    const body = [
      'set -uo pipefail',
      // one pipe for both streams, so the render reads in the order a terminal shows it (a `└─` never above a `├─`)
      'exec 2>&1',
      `source '${opts?.pathOperations ?? PATH_OPERATIONS}'`,
      // the grove is a dir: the remote command runs with that grove's HOME
      // (a grove's login shell is zsh: FAKE_REMOTE_SHELL=zsh reads the whole remote command line as zsh does)
      // (an ssh channel prints notices on stderr, as a multiplexed control socket does: FAKE_SSH_NOISE is that line)
      // (a box run, the transport of the whole move, runs under the move lock: one with no connect bound is refused, so the bound is clamped)
      // (a grove named in FAKE_SSH_REAL is handed to the REAL ssh client, with the argv the move built: the transport is the real one)
      'ssh() { local bound="" argv=("$@"); while [[ $# -gt 0 ]]; do case "$1" in -o) [[ "$2" != ConnectTimeout=* ]] || bound=1; shift 2 ;; -p|-l|-i|-F) shift 2 ;; -*) shift ;; *) host="$1"; shift; break ;; esac; done; [[ "$host" != "${FAKE_SSH_REAL:-}" ]] || { command ssh "${argv[@]}"; return $?; }; [[ "$1" != "bash -c "* || -n "$bound" ]] || { echo "fake ssh: a grove run with no ConnectTimeout, unbounded under the move lock" >&2; return 255; }; [[ "$host" != "${FAKE_SSH_DOWN:-}" ]] || { echo "ssh: connect to host $host port 22: No route to host" >&2; return 255; }; [[ -z "${FAKE_SSH_NOISE:-}" ]] || echo "$FAKE_SSH_NOISE" >&2; HOME="$FAKE_GROVES/$host" "${FAKE_REMOTE_SHELL:-bash}" -c "$*"; }',
      'crew.boot() { echo "crew.boot $*" >> "$CALL_LOG"; echo "(fake crew.boot)"; [[ -n "${FAKE_BOOT_SAYS:-}" ]] && echo "$FAKE_BOOT_SAYS"; return ${FAKE_BOOT_RC:-0}; }',
      'duct.read() { local u="" ; while [[ $# -gt 0 ]]; do case "$1" in --on) u="$2"; shift 2 ;; *) shift ;; esac; done; [[ "${u##*/}" != "${FAKE_READ_FAILS:-}" ]] || { echo "✋ duct.read: cannot reach the grove" >&2; return 2; }; local f="$FAKE_PANES/${u##*/}.txt"; [[ -f "$f" ]] || { echo "✋ duct.read: session $u is absent" >&2; return 2; }; cat "$f"; }',
      '__duct_uri_holds_live_claude() { [[ " ${FAKE_UNREAD:-} " != *" ${1##*/} "* ]] || return 3; [[ " $FAKE_LIVE " == *" ${1##*/} "* ]]; }',
      // another apply holds the tree's move lock: a distinct open file description, so flock -n refuses
      '[[ -z "${FAKE_LOCK_HELD:-}" ]] || { mkdir -p "$CREWWORK_DIR/.locks"; exec 7>"$CREWWORK_DIR/.locks/move.$FAKE_LOCK_HELD.lock"; flock 7; }',
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
        FAKE_LINK_FAILS: opts?.linkFails ? '1' : '',
        FAKE_LINK_NEEDS_DIST: opts?.linkNeedsDist ? '1' : '',
        // the build of a self-hosted tree, replaced by one that makes the dist: absent = the paved pnpm build
        GIT_CREW_MOVE_BUILD_CMD: opts?.buildCmd ?? '',
        FAKE_SSH_NOISE: opts?.sshNoise
          ? 'mux_client_request_session: session request failed: Session open refused by peer'
          : '',
        // the role link, replaced by the fake: rhachet is never reached
        GIT_CREW_MOVE_LINK_CMD: join(dirBin, 'npx'),
        FAKE_LIVE: (opts?.live ?? []).join(' '),
        FAKE_SSH_DOWN: opts?.sshDown ?? '',
        FAKE_SSH_REAL: opts?.sshReal ?? '',
        FAKE_READ_FAILS: opts?.readFails ?? '',
        FAKE_UNREAD: (opts?.unread ?? []).join(' '),
        FAKE_LOCK_HELD: opts?.lockHeld ? TREE : '',
        // the operator's knobs: unset unless the case sets them (getEnvClearOfOperator cleared any the shell held)
        ...(opts?.orgs ? { GIT_CREW_MOVE_ORGS: opts.orgs } : {}),
        ...(opts?.localOnly
          ? { GIT_CREW_MOVE_LOCAL_ONLY_TREES: opts.localOnly }
          : {}),
        FAKE_BOOT_RC: String(opts?.bootRc ?? 0),
        FAKE_BOOT_SAYS: opts?.bootSays ?? '',
        // the live-claude read after a boot: one read, no wait
        GIT_CREW_MOVE_LIVE_TRIES: '1',
        GIT_CREW_MOVE_LIVE_WAIT: '0',
        FAKE_REMOTE_SHELL: opts?.remoteShell ?? 'bash',
        CALL_LOG: pathLog,
        // the lockfile install, replaced by one that leaves an ignored marker
        GIT_CREW_MOVE_INSTALL_CMD:
          opts?.installCmd ??
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

  // .what = the sorted `git status` of a tree, the shape the carry must reproduce
  const getStatus = (box: Box): string =>
    git(treeOf(box), ['status', '--porcelain=v1', '--untracked-files=all'])
      .split('\n')
      .filter(
        (line) =>
          line &&
          !line.includes('.agent/') &&
          !line.includes('.log/') &&
          !line.includes('node_modules'),
      )
      .sort()
      .join('\n');

  // .what = an output with the temp root and the commit shas and bundle sizes masked, so a snapshot holds across runs
  const getMasked = (out: string): string =>
    out
      .split(dirRoot)
      .join('<root>')
      .split(asProjectDir(dirRoot))
      .join('<root-as-project-dir>')
      .replace(/\b[0-9a-f]{40}\b/g, '<sha>')
      .replace(/\b[0-9a-f]{12}\b/g, '<head12>')
      .replace(/git bundle \(\d+ B\)/g, 'git bundle (<bytes> B)')
      .replace(/__EXIT__=\d+\n?/, '');

  return {
    run,
    treeOf,
    mainOf,
    homeOf,
    getLedgerGrove,
    getStatus,
    getMasked,
    getShaOf,
    pathsRecord,
    git,
    setPane,
    dirRoot,
    dirForest,
    dirLedger,
    dirMirror,
    pathHookMarker,
  };
};

// .what = the transcript clamp: the newest of each seat sits under the destination tree's own project dir
//         (claude keys the dir on the cwd), the older one stayed, and the source's dir name is not copied
const assertTranscriptsInOwnDir = (scene: ReturnType<typeof genScene>) => {
  const dest = scene.treeOf('local');
  const dirBrain = join(
    dest,
    '.agent',
    '.actors',
    'actor.via.hash=aaaa',
    'brain',
    '.claude',
    'projects',
  );
  const dirProjects = join(dirBrain, asProjectDir(dest));
  expect(existsSync(join(dirProjects, 'ses-mech-new.jsonl'))).toEqual(true);
  expect(existsSync(join(dirProjects, 'ses-fore.jsonl'))).toEqual(true);
  expect(
    existsSync(join(dirProjects, 'ses-mech-new', 'subagents', 's1.jsonl')),
  ).toEqual(true);
  expect(existsSync(join(dirProjects, 'ses-mech-old.jsonl'))).toEqual(false);
  expect(
    existsSync(
      join(dirBrain, asProjectDir(`/src-box${scene.treeOf('grove-a')}`)),
    ),
  ).toEqual(false);
};

// .what = the role-link clamp: every role the source held is linked at the destination; repo=.this is tracked, not linked
const assertRoleLinksCarried = (scene: ReturnType<typeof genScene>) => {
  const dest = scene.treeOf('local');
  expect(
    existsSync(join(dest, '.agent', 'repo=ehmpathy', 'role=mechanic')),
  ).toEqual(true);
  expect(
    existsSync(join(dest, '.agent', 'repo=bhrain', 'role=driver')),
  ).toEqual(true);
  expect(existsSync(join(dest, '.agent', 'repo=.this'))).toEqual(false);
};

describe('git.crew.move', () => {
  afterAll(() => {
    tempDirs.delAll();
  });

  given(
    '[case1] a crew tree on grove-a with a dirty set, and the ledger names it',
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when('[t0] plan runs, cloud to local', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local']),
        );

        then('it exits 0 and names the source from the ledger', () => {
          expect(result.code).toEqual(0);
          expect(result.out).toContain(
            'from: cloud://grove-a — from the ledger row',
          );
          expect(result.out).toContain('to: local');
        });

        then(
          'it names the branch, its head, and that the head is pushed',
          () => {
            const head = scene
              .git(scene.treeOf('grove-a'), ['rev-parse', 'HEAD'])
              .trim();
            expect(result.out).toContain(
              `branch: ${BRANCH} @ ${head.slice(0, 12)}`,
            );
            expect(result.out).toContain('pushed: yes');
          },
        );

        then(
          'it lists the seven dirty paths and leaves out node_modules and .log',
          () => {
            expect(result.out).toContain('carry: 7 path(s)');
            expect(result.out).toContain('src/a.ts');
            expect(result.out).toContain('docs/deep/x.txt');
            expect(result.out).not.toContain('node_modules/junk');
            expect(result.out).not.toContain('x.log');
          },
        );

        then('it names each seat, its state, and its transcript', () => {
          expect(result.out).toContain(
            'mechanic: idle at the source · transcript',
          );
          expect(result.out).toContain('ses-mech-new.jsonl');
          expect(result.out).not.toContain('ses-mech-old.jsonl');
          expect(result.out).toContain(
            'foreman: idle at the source · transcript',
          );
        });

        then('the whole render holds across runs', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });

        then('it says plan only, and moved naught', () => {
          expect(result.out).toContain('plan only');
          expect(existsSync(scene.treeOf('local'))).toEqual(false);
          expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
          expect(result.calls).toEqual([]);
        });
      });
    },
  );

  given('[case2] apply, cloud to local, then verify', () => {
    const scene = useBeforeAll(async () => genScene({}));
    const before = useBeforeAll(async () => ({
      status: scene.getStatus('grove-a'),
    }));

    when('[t0] apply runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(
          [
            '--tree',
            TREE,
            '--to',
            'local',
            '--mode',
            'apply',
            '--why',
            'weekly limit on grove-a',
          ],
          { live: ['mechanic', 'foreman'] },
        ),
      );

      then('it exits 0', () => {
        expect(result.out).toContain('✅ moved');
        expect(result.code).toEqual(0);
      });

      then('the whole render holds across runs', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });

      then(
        'the tree stands at the destination on the same branch at the same head',
        () => {
          const dest = scene.treeOf('local');
          expect(
            scene.git(dest, ['symbolic-ref', '--short', 'HEAD']).trim(),
          ).toEqual(BRANCH);
          expect(scene.git(dest, ['rev-parse', 'HEAD']).trim()).toEqual(
            scene.git(scene.treeOf('grove-a'), ['rev-parse', 'HEAD']).trim(),
          );
        },
      );

      then('the dirty paths match the source, status for status', () => {
        expect(scene.getStatus('local')).toEqual(before.status);
        expect(
          readFileSync(join(scene.treeOf('local'), 'src', 'a.ts'), 'utf-8'),
        ).toEqual('export const a = 100; // edited\n');
        expect(existsSync(join(scene.treeOf('local'), 'src', 'b.ts'))).toEqual(
          false,
        );
        expect(
          readFileSync(
            join(scene.treeOf('local'), 'docs', 'deep', 'x.txt'),
            'utf-8',
          ),
        ).toEqual('deep\n');
      });

      then('the exec bit and the symlink ride', () => {
        expect(
          statSync(join(scene.treeOf('local'), 'bin', 'run.sh')).mode & 0o111,
        ).not.toEqual(0);
        expect(
          execFileSync('readlink', [join(scene.treeOf('local'), 'link-to-a')])
            .toString()
            .trim(),
        ).toEqual('src/a.ts');
      });

      then(
        'the ignored install output is not carried, and the install ran at the destination',
        () => {
          expect(
            existsSync(join(scene.treeOf('local'), 'node_modules', 'junk')),
          ).toEqual(false);
          expect(
            existsSync(join(scene.treeOf('local'), 'node_modules', '.ok')),
          ).toEqual(true);
          expect(
            existsSync(join(scene.treeOf('local'), '.log', 'x.log')),
          ).toEqual(false);
        },
      );

      then(
        "the newest transcript of each seat lands under the destination tree's own project dir",
        () => {
          assertTranscriptsInOwnDir(scene);
        },
      );

      then(
        "🔴 the role links the source held stand at the destination, and the repo's own are not relinked",
        () => {
          assertRoleLinksCarried(scene);
          expect(result.out).toContain(
            'roles linked: bhrain/driver, ehmpathy/mechanic',
          );
        },
      );

      then(
        'the ledger names the destination and the move is logged with its why',
        () => {
          expect(scene.getLedgerGrove()).toEqual('local');
          const log = readFileSync(
            join(scene.dirRoot, 'crewwork', 'moves.jsonl'),
            'utf-8',
          );
          expect(JSON.parse(log.trim().split('\n').pop()!)).toMatchObject({
            tree: TREE,
            from: 'cloud://grove-a',
            to: 'local',
            why: 'weekly limit on grove-a',
          });
        },
      );

      then('each seat is booted at the destination, resumed', () => {
        expect(result.calls).toEqual([
          `crew.boot --tree ${TREE} --grove local --roles mechanic --resume mechanic`,
          `crew.boot --tree ${TREE} --grove local --roles foreman --resume foreman`,
        ]);
      });

      then('the source tree and its dirty bytes are untouched', () => {
        expect(scene.getStatus('grove-a')).toEqual(before.status);
        expect(
          readFileSync(join(scene.treeOf('grove-a'), 'src', 'a.ts'), 'utf-8'),
        ).toEqual('export const a = 100; // edited\n');
        expect(
          existsSync(join(scene.treeOf('grove-a'), 'node_modules', 'junk')),
        ).toEqual(true);
      });
    });

    when('[t1] verify runs, with both seats live at the destination', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'verify'], {
          live: ['mechanic', 'foreman'],
        }),
      );

      then('it exits 0, the source read from the move log', () => {
        expect(result.code).toEqual(0);
        expect(result.out).toContain(
          'from: cloud://grove-a — from the move log',
        );
        expect(result.out).toContain('✓ ledger');
        expect(result.out).toContain('✓ tree');
        expect(result.out).toContain('✓ seat mechanic');
        expect(result.out).toContain('the move holds');
      });

      then('the verify render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t2] verify runs, with one seat dead', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'verify'], {
          live: ['mechanic'],
        }),
      );

      then('it exits 1 and names the dead seat', () => {
        expect(result.code).toEqual(1);
        expect(result.out).toContain('✗ seat foreman: no live claude at local');
      });

      then('the verify miss render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when(
      '[t2b] verify runs, and one seat is unread: its grove did not answer',
      () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'verify'], {
            live: ['mechanic'],
            unread: ['foreman'],
          }),
        );

        then('it exits 1 and names the seat unread, never dead', () => {
          expect(result.code).toEqual(1);
          expect(result.out).toContain(
            '✗ seat foreman: unread — local did not answer',
          );
          expect(result.out).toContain('✓ seat mechanic');
        });

        then('it prints no resume cure for a seat it could not read', () => {
          expect(result.out).not.toContain('✗ seat foreman: no live claude');
        });

        then('the verify unread render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      },
    );

    when(
      '[t2c] verify runs, and the source grove does not answer the digest read',
      () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'verify'], {
            live: ['mechanic', 'foreman'],
            sshDown: 'grove-a',
          }),
        );

        then(
          'it exits 1 and names the tree unread, with the read own cause',
          () => {
            expect(result.code).toEqual(1);
            expect(result.out).toContain(
              '✗ tree: unread — the source digest is unread: ssh: connect to host grove-a port 22: No route to host',
            );
          },
        );

        then(
          'it never says the ends differ for an end it could not read',
          () => {
            expect(result.out).not.toContain('the ends differ');
          },
        );

        then('the verify tree-unread render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      },
    );

    when('[t3] verify runs after a destination file drifted', () => {
      const result = useBeforeAll(async () => {
        writeFileSync(join(scene.treeOf('local'), 'notes.md'), 'drifted\n');
        return scene.run(
          ['--tree', TREE, '--to', 'local', '--mode', 'verify'],
          { live: ['mechanic', 'foreman'] },
        );
      });

      then('it exits 1 and names the path that differs', () => {
        expect(result.code).toEqual(1);
        expect(result.out).toContain('✗ tree: the ends differ');
        expect(result.out).toContain('notes.md');
      });

      then('the drift render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given(
    '[case2b] verify runs over a finished move, and the destination holds a path its own install wrote under .agent/.cache',
    () => {
      const scene = useBeforeAll(async () => genScene({}));
      const applied = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
          live: ['mechanic', 'foreman'],
        }),
      );

      when(
        '[t0] a destination-only .agent/.cache file stands beside the move',
        () => {
          const result = useBeforeAll(async () => {
            const dirTrash = join(
              scene.treeOf('local'),
              '.agent',
              '.cache',
              'repo=ehmpathy',
              'role=mechanic',
              'skill=rmsafe',
              'trash',
            );
            mkdirSync(dirTrash, { recursive: true });
            // the trash dir's own ignore file keeps itself visible to git, as the real one does, so it reads as an untracked path
            writeFileSync(join(dirTrash, '.gitignore'), '*\n!.gitignore\n');
            return scene.run(
              ['--tree', TREE, '--to', 'local', '--mode', 'verify'],
              { live: ['mechanic', 'foreman'] },
            );
          });

          then('precondition: the move it verifies was applied, exit 0', () => {
            expect(applied.code).toEqual(0);
          });

          then(
            'it exits 0 and the move holds, since .agent/.cache is box-local',
            () => {
              expect(result.code).toEqual(0);
              expect(result.out).toContain('✓ tree');
              expect(result.out).not.toContain('.agent/.cache');
              expect(result.out).toContain('the move holds');
            },
          );

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(result.out)).toMatchSnapshot();
          });
        },
      );

      when(
        '[t1] a carried path drifts at the destination, beside the .agent/.cache file',
        () => {
          const result = useBeforeAll(async () => {
            writeFileSync(join(scene.treeOf('local'), 'notes.md'), 'drifted\n');
            return scene.run(
              ['--tree', TREE, '--to', 'local', '--mode', 'verify'],
              { live: ['mechanic', 'foreman'] },
            );
          });

          then(
            'it exits 1 and names the carried path, never the .agent/.cache one',
            () => {
              expect(result.code).toEqual(1);
              expect(result.out).toContain('✗ tree: the ends differ');
              expect(result.out).toContain('notes.md');
              expect(result.out).not.toContain('.agent/.cache');
            },
          );

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(result.out)).toMatchSnapshot();
          });
        },
      );
    },
  );

  given(
    '[case3] apply, local to cloud, where the destination repo is absent',
    () => {
      const scene = useBeforeAll(async () => genScene({ side: 'local' }));
      const before = useBeforeAll(async () => ({
        status: scene.getStatus('local'),
      }));

      when('[t0] apply runs with --to as a bare grove name', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'grove-b', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
          }),
        );

        then('it exits 0, clones the repo there, and raises the tree', () => {
          expect(result.out).toContain('from: local — from the ledger row');
          expect(result.code).toEqual(0);
          expect(result.out).toContain('cloned');
          expect(existsSync(scene.mainOf('grove-b'))).toEqual(true);
          expect(
            scene
              .git(scene.treeOf('grove-b'), ['symbolic-ref', '--short', 'HEAD'])
              .trim(),
          ).toEqual(BRANCH);
        });

        then('the dirty set matches and the ledger names the grove', () => {
          expect(scene.getStatus('grove-b')).toEqual(before.status);
          expect(scene.getLedgerGrove()).toEqual('cloud://grove-b');
          expect(result.calls[0]).toContain('--grove cloud://grove-b');
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case4] apply, cloud to cloud, with a commit no remote holds', () => {
    const scene = useBeforeAll(async () => genScene({ unpushed: true }));
    const before = useBeforeAll(async () => ({
      status: scene.getStatus('grove-a'),
    }));

    when('[t0] plan runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'cloud://grove-b']),
      );

      then('it says the head is not pushed and a bundle carries it', () => {
        expect(result.code).toEqual(0);
        expect(result.out).toContain(
          'pushed: no — 1 commit(s) no remote holds; a git bundle carries them',
        );
        expect(result.out).toContain('absent; apply clones');
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t1] apply runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(
          ['--tree', TREE, '--to', 'cloud://grove-b', '--mode', 'apply'],
          { live: ['mechanic', 'foreman'] },
        ),
      );

      then(
        'it exits 0, the commits ride a bundle, and the head matches',
        () => {
          expect(result.code).toEqual(0);
          expect(result.out).toContain('rode a git bundle');
          expect(
            scene.git(scene.treeOf('grove-b'), ['rev-parse', 'HEAD']).trim(),
          ).toEqual(
            scene.git(scene.treeOf('grove-a'), ['rev-parse', 'HEAD']).trim(),
          );
          expect(
            existsSync(join(scene.treeOf('grove-b'), 'src', 'd.ts')),
          ).toEqual(true);
          expect(scene.getStatus('grove-b')).toEqual(before.status);
          expect(scene.getLedgerGrove()).toEqual('cloud://grove-b');
        },
      );

      then('the source grove still holds its tree', () => {
        expect(existsSync(scene.treeOf('grove-a'))).toEqual(true);
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given(
    '[case4b] apply, where the destination cannot fetch and no commit rides a bundle',
    () => {
      const scene = useBeforeAll(async () => {
        const s = genScene({});
        // the destination already holds the repo, cut before the branch was pushed, and its origin is gone
        mkdirSync(join(s.homeOf('grove-b'), 'git', 'sandpine'), {
          recursive: true,
        });
        s.git(s.dirRoot, [
          'clone',
          '-q',
          join(s.dirRoot, 'seed'),
          s.mainOf('grove-b'),
        ]);
        s.git(s.mainOf('grove-b'), [
          'remote',
          'set-url',
          'origin',
          join(s.dirRoot, 'origin-gone.git'),
        ]);
        return s;
      });

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(
            ['--tree', TREE, '--to', 'cloud://grove-b', '--mode', 'apply'],
            { live: ['mechanic', 'foreman'] },
          ),
        );

        then(
          'it fails, and the refusal names the fetch and git own words',
          () => {
            expect(result.code).toEqual(1);
            expect(result.out).toContain('🟡 the fetch failed: ');
            expect(result.out).toContain('origin-gone.git');
            expect(result.out).toMatch(
              /the destination cannot fetch [0-9a-f]{12} \(the fetch failed: .+\), and the source holds no unpushed commit to bundle/,
            );
          },
        );

        then('the ledger still names the source', () => {
          expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  // .what = the refusal clamp for a busy seat at the source; asserted on the live file, and again
  //         on a copy with the refusal cut, which must FAIL it (the teeth)
  const assertBusyRefused = (
    scene: ReturnType<typeof genScene>,
    result: { code: number | null; out: string },
  ) => {
    expect(result.code).toEqual(2);
    expect(result.out).toContain(
      'ConstraintError: seat mechanic is busy mid-turn at the source',
    );
    expect(existsSync(scene.treeOf('local'))).toEqual(false);
    expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
  };

  // .what = a copy of the operations with one edit, kept outside the repo (the live file is never cut)
  const genCutCopy = (input: {
    slug: string;
    from: string;
    into: string;
    also?: { from: string; into: string }[];
  }): string => {
    const dirCopy = tempDirs.genOne({ slug: input.slug });
    const pathCopy = join(dirCopy, 'ops.sh');
    const sourceLive = readFileSync(PATH_OPERATIONS, 'utf-8').replace(
      /^__crew_move_here=.*$/m,
      `__crew_move_here='${join(DIR_SKILLS, 'work')}'`,
    );
    const sourceCut = [
      { from: input.from, into: input.into },
      ...(input.also ?? []),
    ].reduce((source, edit) => {
      // a cut whose target is gone would test the live code and pass: fail loud instead
      if (!source.includes(edit.from))
        throw new MalfunctionError(
          'the cut target is absent from the operations',
          {
            target: edit.from,
            hint: 'the operations changed under the clamp; point the cut at the current line',
          },
        );
      return source.replace(edit.from, edit.into);
    }, sourceLive);
    writeFileSync(pathCopy, sourceCut);
    return pathCopy;
  };

  given('[case5] a seat at the source is busy mid-turn', () => {
    const scene = useBeforeAll(async () => {
      const s = genScene({});
      s.setPane('mechanic', '✻ Brewed… (12s · ↓ 3.2k tokens)\n❯ \n');
      return s;
    });

    when('[t0] apply runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply']),
      );

      then('it exits 2 and moves naught', () => {
        assertBusyRefused(scene, result);
        expect(result.calls).toEqual([]);
      });

      then('the busy refusal render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when(
      '[t1] a copy of the operations with the busy refusal cut runs the same call',
      () => {
        const result = useBeforeAll(async () => {
          const pathOperations = genCutCopy({
            slug: 'crew-move-teeth-busy',
            from: 'busy:*) __crew_move_refuse',
            into: 'busy:*) : __crew_move_refuse',
          });
          return scene.run(['--tree', TREE, '--to', 'local'], {
            pathOperations,
          });
        });

        then(
          'the busy clamp goes RED without the refusal (the clamp bites)',
          () => {
            expect(() => assertBusyRefused(scene, result)).toThrow();
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      },
    );
  });

  given('[case6] a seat at the source has text in its box', () => {
    const scene = useBeforeAll(async () => {
      const s = genScene({});
      s.setPane('foreman', '❯ half typed words\n');
      return s;
    });

    when('[t0] plan runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local']),
      );

      then('it exits 2 and names the seat', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain(
          'ConstraintError: seat foreman has text in its box at the source',
        );
      });

      then('the typed refusal render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given('[case8] the destination grove is not registered', () => {
    const scene = useBeforeAll(async () => genScene({}));

    when('[t0] plan runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'grove-nope']),
      );

      then('it exits 2 and names the grove', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain(
          "the destination grove 'grove-nope' is not registered",
        );
      });

      then('the unknown-grove refusal render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given('[case9] the tree sits under an org outside the allow list', () => {
    const scene = useBeforeAll(async () => genScene({ org: 'evilcorp' }));

    when('[t0] plan runs, with GIT_CREW_MOVE_ORGS set', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local'], {
          orgs: 'ehmpathy sandpine',
        }),
      );

      then(
        'it exits 2 and names the org, the allowed ones, and the knob that widens them',
        () => {
          expect(result.code).toEqual(2);
          expect(result.out).toContain(
            "the tree's org 'evilcorp' is outside ehmpathy, sandpine (GIT_CREW_MOVE_ORGS)",
          );
          expect(result.out).toContain('widen GIT_CREW_MOVE_ORGS to move it');
        },
      );

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t1] plan runs, with GIT_CREW_MOVE_ORGS unset', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local']),
      );

      then('no org is bound: the plan exits 0 and names no org refusal', () => {
        expect(result.code).toEqual(0);
        expect(result.out).not.toContain("the tree's org");
      });

      then(
        'the plan says both guards are unbound, and the knob that binds each',
        () => {
          expect(result.out).toContain(
            '├─ guards: orgs: unbound, every org moves (set GIT_CREW_MOVE_ORGS to bind)',
          );
          expect(result.out).toContain(
            'local-only trees: unbound, any tree may go to a cloud grove (set GIT_CREW_MOVE_LOCAL_ONLY_TREES to bind)',
          );
        },
      );

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when(
      '[t2] plan runs, with both guards bound and the tree inside them',
      () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local'], {
            orgs: 'evilcorp sandpine',
            localOnly: 'notebook.*',
          }),
        );

        then('the plan exits 0 and names each bound guard by its value', () => {
          expect(result.code).toEqual(0);
          expect(result.out).toContain(
            '├─ guards: orgs: evilcorp sandpine · local-only trees: notebook.*',
          );
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      },
    );
  });

  given(
    '[case69] the tree is local-only (GIT_CREW_MOVE_LOCAL_ONLY_TREES)',
    () => {
      const scene = useBeforeAll(async () => genScene({ side: 'local' }));
      const localOnly = 'infrastructure.* !infrastructure.direction.*';

      when('[t0] plan runs onto a cloud grove', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'grove-a'], { localOnly }),
        );

        then(
          'it exits 2 ahead of any box read, names the glob it matches, and names the one place it moves',
          () => {
            expect(result.code).toEqual(2);
            expect(result.out).toContain(
              `'${TREE}' is a local-only tree (it matches 'infrastructure.*'), so it moves onto no cloud grove`,
            );
            expect(result.out).toContain(
              `fix: rhx git.crew.move --tree ${TREE} --to local`,
            );
            expect(result.out).not.toContain('plan only');
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when('[t1] a `!` glob spares the tree', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'grove-a'], {
            localOnly: 'infrastructure.* !infrastructure.beav.*',
          }),
        );

        then('the guard lets it through: the plan exits 0', () => {
          expect(result.code).toEqual(0);
          expect(result.out).not.toContain('is a local-only tree');
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case10] the destination path is already a worktree', () => {
    const scene = useBeforeAll(async () =>
      genScene({ destTreePreexists: true }),
    );

    when('[t0] apply runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply']),
      );

      then('it exits 2 and moves naught', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain('is already a worktree');
        expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
        expect(result.calls).toEqual([]);
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given(
    '[case10b] the destination path holds a stale twin: clean, upstream 0/0, its head in origin/main',
    () => {
      const scene = useBeforeAll(async () => genScene({ destTwin: 'safe' }));
      // an object, never a bare string: useBeforeAll hands back a proxy, and a proxy over a string holds no string methods
      const twin = useBeforeAll(async () => ({
        head: scene.git(scene.treeOf('local'), ['rev-parse', 'HEAD']).trim(),
      }));
      const WHY = 'stale twin of a merged pull';

      when('[t0] plan runs with no --drop-twin-why', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local']),
        );

        then('it still refuses, and the fix names --drop-twin-why', () => {
          expect(result.code).toEqual(2);
          expect(result.out).toContain(
            'is already a worktree (a stale twin at',
          );
          expect(result.out).toContain("--drop-twin-why '<why>'");
          expect(existsSync(scene.treeOf('local'))).toEqual(true);
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when('[t1] --drop-twin-why is under three words', () => {
        const result = useBeforeAll(async () =>
          scene.run([
            '--tree',
            TREE,
            '--to',
            'local',
            '--drop-twin-why',
            'just because',
          ]),
        );

        then('it exits 2 and names the bound', () => {
          expect(result.code).toEqual(2);
          expect(result.out).toContain(
            '--drop-twin-why needs a reason of three words or more',
          );
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when('[t2] plan runs with --drop-twin-why', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--drop-twin-why', WHY]),
        );

        then('it exits 0 and names the drop as a settle, with the why', () => {
          expect(result.code).toEqual(0);
          expect(result.out).toContain(
            `settle: drop the stale twin worktree ${scene.treeOf('local')} at ${twin.head.slice(0, 12)}`,
          );
          expect(result.out).toContain(`settle: drop-twin why: ${WHY}`);
          expect(result.out).toContain(`--drop-twin-why '${WHY}'`);
        });

        then(
          'the branch tip, the twin head, is set aside past its shipped commit',
          () => {
            expect(result.out).toContain(
              `settle: set aside ${BRANCH} ${twin.head.slice(0, 12)} as refs/crew-move-setaside/${BRANCH}/${twin.head}`,
            );
            expect(result.out).toContain('no patch twin, already in origin/');
          },
        );

        then('plan reads only: the twin still stands', () => {
          expect(existsSync(join(scene.treeOf('local'), 'twin.ts'))).toEqual(
            true,
          );
          expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when('[t3] apply runs with --drop-twin-why', () => {
        const result = useBeforeAll(async () =>
          scene.run(
            [
              '--tree',
              TREE,
              '--to',
              'local',
              '--mode',
              'apply',
              '--drop-twin-why',
              WHY,
            ],
            { live: ['mechanic', 'foreman'] },
          ),
        );

        then('it exits 0 and says it dropped the twin', () => {
          expect(result.out).toContain('✅ moved');
          expect(result.code).toEqual(0);
          expect(result.out).toContain(
            `dropped the stale twin worktree ${scene.treeOf('local')} at ${twin.head.slice(0, 12)}`,
          );
          expect(result.out).toContain(`drop-twin why: ${WHY}`);
        });

        then(
          'the tree stands at the destination on the branch at the source head, the twin file gone',
          () => {
            const dest = scene.treeOf('local');
            expect(
              scene.git(dest, ['symbolic-ref', '--short', 'HEAD']).trim(),
            ).toEqual(BRANCH);
            expect(scene.git(dest, ['rev-parse', 'HEAD']).trim()).toEqual(
              scene.git(scene.treeOf('grove-a'), ['rev-parse', 'HEAD']).trim(),
            );
            expect(existsSync(join(dest, 'twin.ts'))).toEqual(false);
          },
        );

        then(
          'no commit is lost: the twin head stays reachable under the set-aside ref, and in origin/main',
          () => {
            expect(
              scene
                .git(scene.mainOf('local'), [
                  'rev-parse',
                  `refs/crew-move-setaside/${BRANCH}/${twin.head}`,
                ])
                .trim(),
            ).toEqual(twin.head);
            expect(
              spawnSync('git', [
                '-C',
                scene.mainOf('local'),
                'merge-base',
                '--is-ancestor',
                twin.head,
                'origin/main',
              ]).status,
            ).toEqual(0);
          },
        );

        then(
          'the source tree is untouched and the ledger names the destination',
          () => {
            expect(
              readFileSync(
                join(scene.treeOf('grove-a'), 'src', 'a.ts'),
                'utf-8',
              ),
            ).toEqual('export const a = 100; // edited\n');
            expect(scene.getLedgerGrove()).toEqual('local');
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case10c] the destination path holds a twin with a dirty path', () => {
    const scene = useBeforeAll(async () => genScene({ destTwin: 'dirty' }));

    when('[t0] apply runs with --drop-twin-why', () => {
      const result = useBeforeAll(async () =>
        scene.run([
          '--tree',
          TREE,
          '--to',
          'local',
          '--mode',
          'apply',
          '--drop-twin-why',
          'stale twin of a merged pull',
        ]),
      );

      then(
        'it exits 2, names the dirty path count, and the twin and its bytes stay',
        () => {
          expect(result.code).toEqual(2);
          expect(result.out).toContain(
            'it is no stale twin safe to drop: 1 dirty path(s)',
          );
          expect(
            readFileSync(join(scene.treeOf('local'), 'wip.txt'), 'utf-8'),
          ).toEqual('unshipped\n');
          expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
          expect(result.calls).toEqual([]);
        },
      );

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given(
    '[case10d] the destination path holds a clean twin whose head is not in origin/main',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ destTwin: 'unmerged' }),
      );

      when('[t0] apply runs with --drop-twin-why', () => {
        const result = useBeforeAll(async () =>
          scene.run([
            '--tree',
            TREE,
            '--to',
            'local',
            '--mode',
            'apply',
            '--drop-twin-why',
            'stale twin of a merged pull',
          ]),
        );

        then('it exits 2, names the unmerged head, and the twin stays', () => {
          expect(result.code).toEqual(2);
          expect(result.out).toContain('its head is not in origin/');
          expect(existsSync(join(scene.treeOf('local'), 'twin.ts'))).toEqual(
            true,
          );
          expect(result.calls).toEqual([]);
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case11] the call itself is wrong', () => {
    const scene = useBeforeAll(async () => genScene({}));

    when('[t0] --to is absent', () => {
      const result = useBeforeAll(async () => scene.run(['--tree', TREE]));
      then('it exits 2 and names the fix', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain('--to is required');
      });
      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t1] --mode is unknown', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'yolo']),
      );
      then('it exits 2', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain('--mode takes plan | apply | verify');
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t2] the tree is already on the destination', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'grove-a']),
      );
      then('it exits 2 and points at verify', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain('is on cloud://grove-a already');
        expect(result.out).toContain('--mode verify');
      });
      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t3] verify runs for a tree that never moved', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'verify']),
      );
      then('it exits 2: the move log names no source', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain('the move log names no move');
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t4] a flag is mistyped', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tre', TREE, '--to', 'local']),
      );
      then('🔴 it exits 2 and names every valid flag, not only --help', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain("unknown arg '--tre'");
        for (const flag of [
          '--tree',
          '--to',
          '--from',
          '--mode',
          '--why',
          '--setaside-why',
          '--drop-twin-why',
          '--setaside-twin-why',
          '--into-extant',
        ])
          expect(result.out).toContain(flag);
        expect(result.out).toContain(
          'fix: rhx git.crew.move --tree <tree> --to <grove>',
        );
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t5] a flag that takes a value is handed the next flag', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', '--to', 'local']),
      );
      then('🔴 it exits 2 and blames --tree, never --to', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain(
          "--tree takes a value, got the next flag '--to'",
        );
        expect(result.out).not.toContain('--to is required');
      });
      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t6] the last flag is handed no value at all', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to']),
      );
      then('it exits 2 and says --to got none', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain('--to takes a value, got none');
      });
      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    // .why = a reason is prose, and prose may open with `--`; only a flag of this verb is a value it lacks
    when('[t7] a --why whose prose opens with --', () => {
      const result = useBeforeAll(async () =>
        scene.run([
          '--tree',
          TREE,
          '--to',
          'local',
          '--why',
          '-- the weekly cap moved',
        ]),
      );
      then('the reason is taken as its value, never refused', () => {
        expect(result.out).not.toContain('--why takes a value');
      });
      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t8] a --why whose value is a flag of this verb', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--why', '--to', 'local']),
      );
      then('it exits 2 and blames --why, never --to', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain(
          "--why takes a value, got the next flag '--to'",
        );
      });
      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given('[case12] the verb file, run by its own cli', () => {
    when('[t0] --help runs', () => {
      const result = useBeforeAll(async () => {
        const r = spawnSync('bash', [PATH_VERB, '--help']);
        return {
          code: r.status,
          out: `${r.stdout.toString()}${r.stderr.toString()}`,
        };
      });
      then('it prints the usage and exits 0', () => {
        expect(result.code).toEqual(0);
        expect(result.out).toContain(
          'rhx git.crew.move --tree <tree> --to <grove>',
        );
        expect(result.out).toContain(
          '--mode   plan (default) | apply | verify',
        );
        expect(result.out).toContain(
          'settle: set aside <branch> <old> as refs/crew-move-setaside/<branch>/<old-sha>',
        );
        expect(result.out).toContain("--setaside-why '<why>'");
        expect(result.out).toContain("--drop-twin-why '<why>'");
      });
      then('the help render matches the snapshot', () => {
        expect(result.out).toMatchSnapshot();
      });
      then(
        'it names the one retry of an install that fails with a racy ENOENT',
        () => {
          expect(result.out).toContain('ENOENT');
        },
      );
    });
  });

  given('[case14] the install fails at the destination', () => {
    const scene = useBeforeAll(async () => genScene({}));

    when('[t0] apply runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
          installCmd: 'echo install-broke >&2; false',
        }),
      );

      then(
        'it exits 1, the ledger is not flipped, and no seat is booted',
        () => {
          expect(result.code).toEqual(1);
          expect(result.out).toContain('install-broke');
          expect(result.out).toContain('not yet in the ledger');
          expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
          expect(result.calls).toEqual([]);
        },
      );

      then(
        'the install own words ride under the step, never flush-left',
        () => {
          const lines = result.out.split('\n');
          expect(lines).not.toContain('install-broke');
          expect(lines).toContain('   │  │  install-broke');
        },
      );

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  // .what = an install command that counts each run in node_modules/.runs, and fails with `cause` on each run before `okOnRun`
  const genInstallCmd = (input: { cause: string; okOnRun: number }) =>
    [
      'mkdir -p node_modules',
      'echo run >> node_modules/.runs',
      'runs=$(wc -l < node_modules/.runs)',
      `if [ "$runs" -ge ${input.okOnRun} ]; then echo ok > node_modules/.ok; exit 0; fi`,
      `echo '${input.cause}' >&2`,
      'exit 1',
    ].join('; ');
  const getRuns = (scene: { treeOf: (box: 'local') => string }) =>
    readFileSync(join(scene.treeOf('local'), 'node_modules', '.runs'), 'utf-8')
      .split('\n')
      .filter(Boolean).length;

  given(
    '[case14b] the install fails once with a racy ENOENT, then holds',
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
            installCmd: genInstallCmd({
              cause: 'ENOENT: no such file or directory, open pkg.json',
              okOnRun: 2,
            }),
          }),
        );

        then(
          'the install runs twice, the move completes, and the line says it retried',
          () => {
            expect(result.code).toEqual(0);
            expect(getRuns(scene)).toEqual(2);
            expect(result.out).toContain('retried once after a racy ENOENT');
            expect(scene.getLedgerGrove()).toEqual('local');
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case14c] the install fails with ENOENT on every run', () => {
    const scene = useBeforeAll(async () => genScene({}));

    when('[t0] apply runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
          installCmd: genInstallCmd({
            cause: 'ENOENT: gone for good',
            okOnRun: 99,
          }),
        }),
      );

      then('it retries once and no more, then fails as before', () => {
        expect(result.code).toEqual(1);
        expect(getRuns(scene)).toEqual(2);
        expect(result.out).toContain('not yet in the ledger');
        expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given('[case14d] the install fails with another cause', () => {
    const scene = useBeforeAll(async () => genScene({}));

    when('[t0] apply runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
          installCmd: genInstallCmd({
            cause: 'ERR_PNPM_LOCKFILE_BREAKING_CHANGE',
            okOnRun: 99,
          }),
        }),
      );

      then('it runs once: only a racy ENOENT earns a retry', () => {
        expect(result.code).toEqual(1);
        expect(getRuns(scene)).toEqual(1);
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given('[case15] a seat fails to boot at the destination', () => {
    const scene = useBeforeAll(async () => genScene({}));

    when('[t0] apply runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
          bootRc: 1,
        }),
      );

      then(
        'it exits 1 and names the cure; the ledger has moved with the tree',
        () => {
          expect(result.code).toEqual(1);
          expect(result.out).toContain('2 seat(s) failed to boot');
          expect(result.out).toContain(
            `rhx git.crew.heal --tree ${TREE} --what boot --mode apply`,
          );
          expect(scene.getLedgerGrove()).toEqual('local');
        },
      );

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given('[case15b] a seat boots but its bar is not stamped', () => {
    const scene = useBeforeAll(async () => genScene({}));

    when('[t0] apply runs and each boot says its bar was not stamped', () => {
      const result = useBeforeAll(async () =>
        scene.run(
          [
            '--tree',
            TREE,
            '--to',
            'local',
            '--mode',
            'apply',
            '--why',
            'weekly limit on grove-a',
          ],
          {
            live: ['mechanic', 'foreman'],
            bootSays:
              '🟡 status box NOT stamped — the home /gone/notebook is gone on local',
          },
        ),
      );

      then(
        'the move holds, and one summary line counts the bars and names the cure',
        () => {
          expect(result.code).toEqual(0);
          expect(result.out).toContain('2 seat bar(s) NOT stamped');
          expect(result.out).toContain(`rhx git.crew.refresh --tree ${TREE}`);
          expect(scene.getLedgerGrove()).toEqual('local');
        },
      );

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given('[case15c] every seat boots and its bar is stamped', () => {
    const scene = useBeforeAll(async () => genScene({}));

    when('[t0] apply runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(
          [
            '--tree',
            TREE,
            '--to',
            'local',
            '--mode',
            'apply',
            '--why',
            'weekly limit on grove-a',
          ],
          {
            live: ['mechanic', 'foreman'],
            bootSays:
              '🏷️  status box — infrastructure · beav/fix-x (pinned to the duct)',
          },
        ),
      );

      then(
        'the stamp line rides the boot output, and no miss is counted',
        () => {
          expect(result.code).toEqual(0);
          expect(result.out).toContain(
            '🏷️  status box — infrastructure · beav/fix-x (pinned to the duct)',
          );
          expect(result.out).not.toContain('NOT stamped');
          expect(result.out).not.toContain('seat bars are unread');
        },
      );

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  // .what = the carry clamp: a destination that does not match the source stops the move before the ledger flips
  const assertCorruptCarryStopped = (
    scene: ReturnType<typeof genScene>,
    result: { code: number | null; out: string; calls: string[] },
  ) => {
    expect(result.code).toEqual(1);
    expect(result.out).toContain(
      'the destination tree does not match the source',
    );
    expect(result.out).toContain('the ledger was NOT flipped');
    expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
    expect(result.calls).toEqual([]);
  };

  given(
    '[case16] the bytes at the destination differ from the source after the carry',
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when(
        '[t0] a copy of the operations whose unpack corrupts a carried file runs apply',
        () => {
          const result = useBeforeAll(async () => {
            // .why = the restage still holds (each path lands), so only the digest proof can see the bad bytes
            const pathOperations = genCutCopy({
              slug: 'crew-move-teeth-carry',
              from: 'tar -xpf "$tmp/files.tar" -C "$d" --no-same-owner || { rm -rf "$tmp"; return 1; }',
              into: 'tar -xpf "$tmp/files.tar" -C "$d" --no-same-owner && printf "corrupt\\n" > "$d/notes.md" # a carried file corrupted',
            });
            return scene.run(
              ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
              { pathOperations },
            );
          });

          then(
            'the proof stops the move: exit 1, the ledger kept, no seat booted',
            () => {
              assertCorruptCarryStopped(scene, result);
              expect(result.out).toContain('notes.md');
            },
          );

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(result.out)).toMatchSnapshot();
          });
        },
      );

      when(
        '[t1] a copy of the operations with the proof cut runs the same call, on a fresh scene',
        () => {
          const result = useBeforeAll(async () => {
            const fresh = genScene({});
            const pathOperations = genCutCopy({
              slug: 'crew-move-teeth-proof',
              from: 'tar -xpf "$tmp/files.tar" -C "$d" --no-same-owner || { rm -rf "$tmp"; return 1; }',
              into: ': # the carried files are dropped',
              also: [
                {
                  from: '      dd="$(__crew_move_digest_diff "$tree" "$__mv_from" "$__mv_to")" || { __crew_move_digest_unread_halt "$tree" "$dd"; return 1; }\n    fi\n    if [[ -n "$dd" ]]; then',
                  into: '      dd=""\n    fi\n    if [[ -n "$dd" ]]; then',
                },
              ],
            });
            return {
              fresh,
              result: fresh.run(
                ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
                { pathOperations },
              ),
            };
          });

          then(
            'the carry clamp goes RED without the proof (the clamp bites)',
            () => {
              expect(() =>
                assertCorruptCarryStopped(result.fresh, result.result),
              ).toThrow();
            },
          );
        },
      );
    },
  );

  given(
    '[case17] a grove whose login shell is zsh reads the remote command line',
    () => {
      const scene = useBeforeAll(async () => genScene({ unpushed: true }));
      const before = useBeforeAll(async () => ({
        status: scene.getStatus('grove-a'),
      }));

      when(
        '[t0] apply runs, cloud to cloud, with zsh as the remote shell',
        () => {
          const result = useBeforeAll(async () => {
            // an absent zsh is an absent resource: fail loud, never fall back to bash and pass
            const probe = spawnSync('zsh', ['-c', 'true']);
            if (probe.status !== 0)
              throw new ConstraintError(
                'zsh is required to clamp the remote command line',
                { hint: 'sudo apt install zsh' },
              );
            return scene.run(
              ['--tree', TREE, '--to', 'grove-b', '--mode', 'apply'],
              { remoteShell: 'zsh', live: ['mechanic', 'foreman'] },
            );
          });

          then(
            'it exits 0: the program, the bundle, and the pack all cross the zsh quote',
            () => {
              expect(result.out).toContain('✅ moved');
              expect(result.code).toEqual(0);
              expect(
                scene
                  .git(scene.treeOf('grove-b'), ['rev-parse', 'HEAD'])
                  .trim(),
              ).toEqual(
                scene
                  .git(scene.treeOf('grove-a'), ['rev-parse', 'HEAD'])
                  .trim(),
              );
              expect(scene.getStatus('grove-b')).toEqual(before.status);
              expect(scene.getLedgerGrove()).toEqual('cloud://grove-b');
            },
          );

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(result.out)).toMatchSnapshot();
          });
        },
      );
    },
  );

  // .what = the hook clamp: a destination clone whose post-checkout hook fails never blocks the move,
  //         because the move's own git acts run with the repo's hooks off
  const assertMovedPastTheHook = (
    scene: ReturnType<typeof genScene>,
    result: { code: number | null; out: string },
  ) => {
    expect(result.out).toContain('✅ moved');
    expect(result.code).toEqual(0);
    expect(
      scene.git(scene.treeOf('local'), ['rev-parse', 'HEAD']).trim(),
    ).toEqual(scene.git(scene.treeOf('grove-a'), ['rev-parse', 'HEAD']).trim());
    expect(scene.getLedgerGrove()).toEqual('local');
  };

  // .what = a copy of the operations with the repo's hooks left on, as the verb ran before the cure
  const genHooksOnCopy = (slug: string): string =>
    genCutCopy({
      slug,
      from: '__mvbox_git() { git -c core.hooksPath=/dev/null "$@"; }',
      into: '__mvbox_git() { git "$@"; }',
    });

  given(
    '[case22] the destination clone holds a post-checkout hook that fails',
    () => {
      const scene = useBeforeAll(async () => genScene({ destHookFails: true }));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
          }),
        );

        then('it exits 0 and the hook never ran', () => {
          assertMovedPastTheHook(scene, result);
          expect(existsSync(scene.pathHookMarker)).toEqual(false);
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case23] a copy of the operations with the repo hooks left on meets the failed hook',
    () => {
      const scene = useBeforeAll(async () => genScene({ destHookFails: true }));

      when('[t0] apply runs on the copy', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            pathOperations: genHooksOnCopy('crew-move-teeth-hook'),
            live: ['mechanic', 'foreman'],
          }),
        );

        then(
          'the hook clamp goes RED with the hooks on (the clamp bites)',
          () => {
            expect(() => assertMovedPastTheHook(scene, result)).toThrow();
            expect(result.out).toContain(
              'the worktree could not be made at the destination',
            );
            expect(result.out).toContain('husky.sh');
            expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
            expect(result.calls).toEqual([]);
          },
        );

        then(
          'the failed step 1 left the worktree half made: registered, on the branch',
          () => {
            expect(
              scene
                .git(scene.treeOf('local'), ['symbolic-ref', '--short', 'HEAD'])
                .trim(),
            ).toEqual(BRANCH);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when(
        '[t1] plan runs on the live operations over the half-made worktree',
        () => {
          const result = useBeforeAll(async () =>
            scene.run(['--tree', TREE, '--to', 'local']),
          );

          then('it exits 0 and says apply adopts the half-made tree', () => {
            expect(result.code).toEqual(0);
            expect(result.out).toContain('half made by a prior apply');
            expect(result.out).toContain('apply adopts it');
            expect(result.out).not.toContain('is already a worktree');
          });

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(result.out)).toMatchSnapshot();
          });
        },
      );

      when('[t2] apply runs again on the live operations', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
          }),
        );

        then(
          'it converges: the half-made tree is adopted and the move completes',
          () => {
            assertMovedPastTheHook(scene, result);
            expect(result.out).toContain(
              '(adopted: a prior apply half made it)',
            );
            expect(scene.getStatus('local')).toEqual(
              scene.getStatus('grove-a'),
            );
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    "[case13] a transcript must land under the destination tree's own project dir",
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when(
        '[t0] a copy of the operations that keeps the source project dir name runs apply',
        () => {
          const result = useBeforeAll(async () => {
            const pathOperations = genCutCopy({
              slug: 'crew-move-teeth-dir',
              from: 'dst="$d/$pre/$enc/$rest"',
              into: 'dst="$d/$f"',
            });
            return scene.run(
              ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
              { pathOperations, live: ['mechanic', 'foreman'] },
            );
          });

          then(
            'the transcript clamp goes RED without the re-keyed project dir (the clamp bites)',
            () => {
              expect(result.code).toEqual(0);
              expect(() => assertTranscriptsInOwnDir(scene)).toThrow();
            },
          );

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(result.out)).toMatchSnapshot();
          });
        },
      );
    },
  );

  // .what = the husk clamp: a boot that exits 0 but leaves the foreman a bare shell is a failed move,
  //         named with the exact cure; the mechanic, which came up live, is not blamed
  const assertHuskNamed = (result: { code: number | null; out: string }) => {
    expect(result.code).toEqual(1);
    expect(result.out).toContain(
      'foreman: the boot returned, but the seat holds no live claude at local (a bare shell)',
    );
    expect(result.out).toContain('1 seat(s) left as a bare shell at local');
    expect(result.out).toContain(
      `rhx git.crew.boot --tree ${TREE} --grove local --roles foreman --resume foreman`,
    );
    expect(result.out).not.toContain('mechanic: the boot returned');
  };

  given(
    '[case18] a boot exits 0 but leaves the foreman a bare shell at the destination',
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when(
        '[t0] apply runs, with only the mechanic live at the destination',
        () => {
          const result = useBeforeAll(async () =>
            scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
              live: ['mechanic'],
            }),
          );

          then(
            'it exits 1, names the husk seat, and prints the exact cure; the ledger has moved',
            () => {
              assertHuskNamed(result);
              expect(result.out).toContain(
                'mechanic: up at local, resumed, a live claude',
              );
              expect(scene.getLedgerGrove()).toEqual('local');
            },
          );

          then('the husk render matches the snapshot', () => {
            expect(scene.getMasked(result.out)).toMatchSnapshot();
          });
        },
      );

      when(
        '[t1] a copy of the operations with the live read cut runs the same call, on a fresh scene',
        () => {
          const result = useBeforeAll(async () => {
            const pathOperations = genCutCopy({
              slug: 'crew-move-teeth-husk',
              from: 'live_rc=0; __crew_move_seat_live "$dest_host" "$tree" "${__mv_roles[$i]}" || live_rc=$?',
              into: 'live_rc=0',
            });
            return genScene({}).run(
              ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
              { pathOperations, live: ['mechanic'] },
            );
          });

          then(
            'the husk clamp goes RED without the live read (the clamp bites)',
            () => {
              expect(() => assertHuskNamed(result)).toThrow();
            },
          );
        },
      );
    },
  );

  // .what = the verify clamp: a seat that landed with no registration and no ledger role is still read,
  //         because the move log kept the seats the move meant to raise
  const assertUnregisteredHuskNamed = (result: {
    code: number | null;
    out: string;
  }) => {
    expect(result.code).toEqual(1);
    expect(result.out).toContain('✗ seat foreman: no live claude at local');
    expect(result.out).toContain(
      `cure: rhx git.crew.boot --tree ${TREE} --grove local --roles foreman --resume foreman`,
    );
    expect(result.out).toContain('✓ seat mechanic');
  };

  // .what = apply a move, then strip the foreman from the ledger (the destination never registered it)
  const genMovedSceneWithUnregisteredForeman = () => {
    const scene = genScene({});
    scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
      live: ['mechanic', 'foreman'],
    });
    const pathRow = join(scene.dirLedger, `${TREE}.json`);
    const row = JSON.parse(readFileSync(pathRow, 'utf-8'));
    writeFileSync(pathRow, JSON.stringify({ ...row, roles: 'mechanic' }));
    return scene;
  };

  given(
    '[case19] verify runs after a move whose foreman seat never registered at the destination',
    () => {
      const scene = useBeforeAll(async () =>
        genMovedSceneWithUnregisteredForeman(),
      );

      when('[t0] verify runs, with only the mechanic live', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'verify'], {
            live: ['mechanic'],
          }),
        );

        then('it exits 1, names the foreman husk, and prints the cure', () => {
          assertUnregisteredHuskNamed(result);
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when(
        '[t1] a copy of the operations that reads only the registry runs verify',
        () => {
          const result = useBeforeAll(async () => {
            const pathOperations = genCutCopy({
              slug: 'crew-move-teeth-verify-roles',
              from: '__crew_move_log_roles "$tree" "$__mv_to"; } | awk',
              into: 'true; } | awk',
            });
            return scene.run(
              ['--tree', TREE, '--to', 'local', '--mode', 'verify'],
              { pathOperations, live: ['mechanic'] },
            );
          });

          then(
            'the verify clamp goes RED without the move-log roles (the clamp bites)',
            () => {
              expect(() => assertUnregisteredHuskNamed(result)).toThrow();
            },
          );

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(result.out)).toMatchSnapshot();
          });
        },
      );
    },
  );

  given('[case20] the role links cannot be made at the destination', () => {
    const scene = useBeforeAll(async () => genScene({}));

    when('[t0] apply runs, and every link is refused', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
          linkFails: true,
          live: ['mechanic', 'foreman'],
        }),
      );

      then(
        'it exits 1, names each role and the cure, flips no ledger row, and boots no seat',
        () => {
          expect(result.code).toEqual(1);
          expect(result.out).toContain(
            'the role link(s) did not stand at the destination: bhrain/driver, ehmpathy/mechanic',
          );
          expect(result.out).toContain(
            'npx rhachet roles link --repo <repo> --role <role>',
          );
          expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
          expect(result.calls).toEqual([]);
        },
      );

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  // .what = the carry clamp for the links, run on a copy of the operations with the read of the source's links cut:
  //         a move then raises seats in a tree that holds no role, which the clamp must catch
  given(
    "[case21] a copy of the operations that never reads the source's role links",
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () => {
          const pathOperations = genCutCopy({
            slug: 'crew-move-teeth-links',
            from: 'links="$(__crew_move_box_run "$__mv_from" __mvbox_role_links "$tree" </dev/null)" || {',
            into: 'links="" || {',
          });
          return scene.run(
            ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
            { pathOperations, live: ['mechanic', 'foreman'] },
          );
        });

        then(
          'the role-link clamp goes RED without the read (the clamp bites)',
          () => {
            expect(result.code).toEqual(0);
            expect(() => assertRoleLinksCarried(scene)).toThrow();
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  // .what = the steps the move log holds for the scene, in the order logged
  const getLoggedSteps = (scene: ReturnType<typeof genScene>): string[] =>
    readFileSync(join(scene.dirRoot, 'crewwork', 'moves.jsonl'), 'utf-8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line).step);

  // .what = apply cut at the install (the tunnel dropped), the state the first real cut left behind
  const genCutScene = () => {
    const scene = genScene({});
    const cut = scene.run(
      ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
      { installCmd: 'echo install-broke >&2; false' },
    );
    return { scene, cut };
  };

  // .what = the resume clamp: a second apply over the cut one adopts the destination tree the log vouches for,
  //         proves the carry again instead of a second carry, runs the install, and completes the move
  const assertCutApplyResumed = (
    scene: ReturnType<typeof genScene>,
    result: { code: number | null; out: string; calls: string[] },
  ) => {
    expect(result.code).toEqual(0);
    expect(result.out).toContain('✅ moved');
    expect(result.out).toContain('adopted: a prior apply was cut after it');
    expect(result.out).toContain(
      'carried by the prior apply; re-proved, not carried again',
    );
    expect(result.out).toContain('placed by the prior apply');
    expect(scene.getLedgerGrove()).toEqual('local');
    expect(scene.getStatus('local')).toEqual(scene.getStatus('grove-a'));
    expect(
      existsSync(join(scene.treeOf('local'), 'node_modules', '.ok')),
    ).toEqual(true);
    expect(result.calls).toEqual([
      `crew.boot --tree ${TREE} --grove local --roles mechanic --resume mechanic`,
      `crew.boot --tree ${TREE} --grove local --roles foreman --resume foreman`,
    ]);
  };

  given('[case24] an apply is cut at the install, after the carry', () => {
    const state = useBeforeAll(async () => genCutScene());

    when('[t0] the first apply meets a failed install', () => {
      then(
        'it exits 1, the ledger is not flipped, and the log holds each step done',
        () => {
          expect(state.cut.code).toEqual(1);
          expect(state.cut.out).toContain('install-broke');
          expect(state.cut.out).toContain('run this apply again to resume');
          expect(state.scene.getLedgerGrove()).toEqual('cloud://grove-a');
          expect(getLoggedSteps(state.scene)).toEqual([
            'begin',
            'up',
            'carry',
            'conversations',
          ]);
        },
      );

      then('the render matches the snapshot', () => {
        expect(state.scene.getMasked(state.cut.out)).toMatchSnapshot();
      });
    });

    when('[t1] verify runs over the cut apply', () => {
      const result = useBeforeAll(async () =>
        state.scene.run(['--tree', TREE, '--to', 'local', '--mode', 'verify']),
      );

      then(
        'it reads the source from the log, names the steps held and the step cut, and exits 1',
        () => {
          expect(result.code).toEqual(1);
          expect(result.out).toContain(
            'from: cloud://grove-a — from the move log',
          );
          expect(result.out).toContain(
            'move log: an apply was cut; it holds: begin up carry conversations — cut before: install',
          );
          expect(result.out).toContain('✗ ledger');
          expect(result.out).toContain('✓ tree');
        },
      );

      then('the render matches the snapshot', () => {
        expect(state.scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t2] plan runs over the cut apply', () => {
      const result = useBeforeAll(async () =>
        state.scene.run(['--tree', TREE, '--to', 'local']),
      );

      then(
        'it exits 0 and says apply adopts the tree and resumes at the install',
        () => {
          expect(result.code).toEqual(0);
          expect(result.out).toContain('cut by a prior apply');
          expect(result.out).toContain('apply resumes at: install');
          expect(result.out).not.toContain('is already a worktree');
        },
      );

      then('the render matches the snapshot', () => {
        expect(state.scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t3] apply runs again, with a sound install', () => {
      const result = useBeforeAll(async () =>
        state.scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
          live: ['mechanic', 'foreman'],
        }),
      );

      then('it resumes at the install and completes the move', () => {
        assertCutApplyResumed(state.scene, result);
        expect(getLoggedSteps(state.scene)).toEqual([
          'begin',
          'up',
          'carry',
          'conversations',
          'resume',
          'up',
          'carry',
          'conversations',
          'install',
          'links',
          'ledger',
        ]);
      });

      then('the render matches the snapshot', () => {
        expect(state.scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t4] verify runs after the resumed move', () => {
      const result = useBeforeAll(async () =>
        state.scene.run(['--tree', TREE, '--to', 'local', '--mode', 'verify'], {
          live: ['mechanic', 'foreman'],
        }),
      );

      then('it exits 0 and the move holds', () => {
        expect(result.code).toEqual(0);
        expect(result.out).toContain('the move holds');
      });

      then('the render matches the snapshot', () => {
        expect(state.scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given('[case25] a destination tree no log line vouches for', () => {
    const state = useBeforeAll(async () => {
      const scene = genScene({});
      const cut = scene.run(
        ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
        { installCmd: 'echo install-broke >&2; false' },
      );
      writeFileSync(join(scene.dirRoot, 'crewwork', 'moves.jsonl'), '');
      return { scene, cut };
    });

    when('[t0] apply runs', () => {
      const result = useBeforeAll(async () =>
        state.scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply']),
      );

      then(
        'precondition: the seed apply was cut at the install, exit 1',
        () => {
          expect(state.cut.code).toEqual(1);
        },
      );

      then('it exits 2 and refuses, as before', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain('is already a worktree');
        expect(state.scene.getLedgerGrove()).toEqual('cloud://grove-a');
        expect(result.calls).toEqual([]);
      });

      then('the render matches the snapshot', () => {
        expect(state.scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given(
    '[case26] a copy of the operations that never reads the log for a cut apply',
    () => {
      const state = useBeforeAll(async () => genCutScene());

      when('[t0] apply runs over the cut one', () => {
        const result = useBeforeAll(async () => {
          const pathOperations = genCutCopy({
            slug: 'crew-move-teeth-resume',
            from: 'jq -rs --arg t "$tree" --arg f "$from"',
            into: ': jq -rs --arg t "$tree" --arg f "$from"',
          });
          return state.scene.run(
            ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
            { pathOperations, live: ['mechanic', 'foreman'] },
          );
        });

        then(
          'the resume clamp goes RED without the log vouch (the clamp bites)',
          () => {
            expect(() => assertCutApplyResumed(state.scene, result)).toThrow();
            expect(result.code).toEqual(2);
            expect(result.out).toContain('is already a worktree');
          },
        );

        then('the render matches the snapshot', () => {
          expect(state.scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  // .what = the settle clamp: a destination branch behind the source head is fast-forwarded, and the tree rises on it
  const assertStaleBranchSettled = (
    scene: ReturnType<typeof genScene>,
    result: { code: number | null; out: string },
    stale: { sha: string },
  ) => {
    const head = scene
      .git(scene.treeOf('grove-a'), ['rev-parse', 'HEAD'])
      .trim();
    expect(result.code).toEqual(0);
    expect(result.out).toContain(
      `settled: fast-forwarded ${BRANCH} ${stale.sha.slice(0, 12)} -> ${head.slice(0, 12)}`,
    );
    expect(
      scene
        .git(scene.mainOf('local'), ['rev-parse', `refs/heads/${BRANCH}`])
        .trim(),
    ).toEqual(head);
    expect(
      scene.git(scene.treeOf('local'), ['rev-parse', 'HEAD']).trim(),
    ).toEqual(head);
    expect(scene.getLedgerGrove()).toEqual('local');
  };

  given(
    '[case27] the destination holds a stale local copy of the branch, behind the source head',
    () => {
      const scene = useBeforeAll(async () => genScene({ destStale: 'behind' }));
      const stale = useBeforeAll(async () => ({
        sha: scene
          .git(scene.mainOf('local'), ['rev-parse', `refs/heads/${BRANCH}`])
          .trim(),
      }));

      when('[t0] plan runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local']),
        );

        then(
          'it exits 0 and names the fast-forward it will settle, and moves naught',
          () => {
            const head = scene
              .git(scene.treeOf('grove-a'), ['rev-parse', 'HEAD'])
              .trim();
            expect(result.code).toEqual(0);
            expect(result.out).toContain(
              `settle: fast-forward ${BRANCH} ${stale.sha.slice(0, 12)} -> ${head.slice(0, 12)}`,
            );
            expect(result.out).not.toContain('another commit');
            expect(
              scene
                .git(scene.mainOf('local'), [
                  'rev-parse',
                  `refs/heads/${BRANCH}`,
                ])
                .trim(),
            ).toEqual(stale.sha);
            expect(existsSync(scene.treeOf('local'))).toEqual(false);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when('[t1] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
          }),
        );

        then(
          'it fast-forwards the branch, reads it back at the source head, and completes the move',
          () => {
            assertStaleBranchSettled(scene, result, stale);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case28] the destination holds a stale branch in a clean mirror worktree, and the head is not pushed',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ destStale: 'behind', destMirror: 'clean', unpushed: true }),
      );
      const stale = useBeforeAll(async () => ({
        sha: scene
          .git(scene.mainOf('local'), ['rev-parse', `refs/heads/${BRANCH}`])
          .trim(),
      }));

      when('[t0] plan runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local']),
        );

        then(
          'it exits 0 and names the mirror removal and the fast-forward',
          () => {
            expect(result.code).toEqual(0);
            expect(result.out).toContain(
              `settle: remove the clean mirror worktree ${scene.dirMirror}`,
            );
            expect(result.out).toContain(
              `settle: fast-forward ${BRANCH} ${stale.sha.slice(0, 12)}`,
            );
            expect(existsSync(scene.dirMirror)).toEqual(true);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when('[t1] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
          }),
        );

        then(
          'it removes the mirror without force, fast-forwards the branch, and completes the move',
          () => {
            assertStaleBranchSettled(scene, result, stale);
            expect(result.out).toContain(
              `settled: removed the clean mirror worktree ${scene.dirMirror}`,
            );
            expect(existsSync(scene.dirMirror)).toEqual(false);
            expect(
              scene.git(scene.mainOf('local'), [
                'worktree',
                'list',
                '--porcelain',
              ]),
            ).not.toContain(scene.dirMirror);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case29] the destination branch holds a commit the source head lacks',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ destStale: 'diverged' }),
      );
      const stale = useBeforeAll(async () => ({
        sha: scene
          .git(scene.mainOf('local'), ['rev-parse', `refs/heads/${BRANCH}`])
          .trim(),
      }));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply']),
        );

        then(
          'it exits 2, leaves the branch where it was, and moves naught',
          () => {
            expect(result.code).toEqual(2);
            expect(result.out).toContain(
              `branch ${BRANCH} exists at the destination at another commit (${stale.sha.slice(0, 12)}) that holds commits the source head lacks`,
            );
            expect(result.out).toContain(
              `no patch twin: ${stale.sha.slice(0, 12)} feat: stray, only at the destination`,
            );
            expect(
              scene
                .git(scene.mainOf('local'), [
                  'rev-parse',
                  `refs/heads/${BRANCH}`,
                ])
                .trim(),
            ).toEqual(stale.sha);
            expect(existsSync(scene.treeOf('local'))).toEqual(false);
            expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
            expect(result.calls).toEqual([]);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case30] the destination branch is held by a dirty mirror worktree',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ destStale: 'behind', destMirror: 'dirty' }),
      );

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply']),
        );

        then('it exits 2, names the dirty mirror, and removes naught', () => {
          expect(result.code).toEqual(2);
          expect(result.out).toContain(
            `in the mirror worktree ${scene.dirMirror}, which is dirty`,
          );
          expect(existsSync(join(scene.dirMirror, 'scratch.txt'))).toEqual(
            true,
          );
          expect(existsSync(scene.treeOf('local'))).toEqual(false);
          expect(result.calls).toEqual([]);
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case31] a copy of the operations that never asks the box to settle',
    () => {
      const scene = useBeforeAll(async () => genScene({ destStale: 'behind' }));
      const stale = useBeforeAll(async () => ({
        sha: scene
          .git(scene.mainOf('local'), ['rev-parse', `refs/heads/${BRANCH}`])
          .trim(),
      }));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () => {
          const pathOperations = genCutCopy({
            slug: 'crew-move-teeth-settle',
            from: '[[ ${#__mv_settle[@]} -gt 0 ]] && settle=yes',
            into: ': ${#__mv_settle[@]}',
          });
          return scene.run(
            ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
            { pathOperations, live: ['mechanic', 'foreman'] },
          );
        });

        then(
          'the settle clamp goes RED without the settle (the clamp bites)',
          () => {
            expect(() =>
              assertStaleBranchSettled(scene, result, stale),
            ).toThrow();
            expect(result.code).toEqual(2);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  // .what = the set-aside clamp: a destination branch that diverged only by a rebase (every commit it holds that the
  //         source head lacks has a patch twin in the head) is set aside under a ref, then pointed at the head
  const getSetAsideRef = (stale: { sha: string }): string =>
    `refs/crew-move-setaside/${BRANCH}/${stale.sha}`;
  const assertDivergedTwinsSettled = (
    scene: ReturnType<typeof genScene>,
    result: { code: number | null; out: string },
    stale: { sha: string },
  ) => {
    const head = scene
      .git(scene.treeOf('grove-a'), ['rev-parse', 'HEAD'])
      .trim();
    expect(result.code).toEqual(0);
    expect(result.out).toContain(
      `settled: set aside ${BRANCH} ${stale.sha.slice(0, 12)} as ${getSetAsideRef(stale)}`,
    );
    expect(
      scene
        .git(scene.mainOf('local'), ['rev-parse', getSetAsideRef(stale)])
        .trim(),
    ).toEqual(stale.sha);
    expect(
      scene
        .git(scene.mainOf('local'), ['rev-list', getSetAsideRef(stale)])
        .split('\n'),
    ).toContain(stale.sha);
    expect(
      scene
        .git(scene.mainOf('local'), ['rev-parse', `refs/heads/${BRANCH}`])
        .trim(),
    ).toEqual(head);
    expect(
      scene.git(scene.treeOf('local'), ['rev-parse', 'HEAD']).trim(),
    ).toEqual(head);
    expect(scene.getLedgerGrove()).toEqual('local');
  };

  given(
    '[case32] the destination branch diverged only by a rebase: every commit it holds that the head lacks has a patch twin',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ destStale: 'rebased' }),
      );
      const stale = useBeforeAll(async () => ({
        sha: scene
          .git(scene.mainOf('local'), ['rev-parse', `refs/heads/${BRANCH}`])
          .trim(),
      }));

      when('[t0] plan runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local']),
        );

        then('it exits 0, names the set-aside settle, and moves naught', () => {
          const head = scene
            .git(scene.treeOf('grove-a'), ['rev-parse', 'HEAD'])
            .trim();
          expect(result.code).toEqual(0);
          expect(result.out).toContain(
            `settle: set aside ${BRANCH} ${stale.sha.slice(0, 12)} as ${getSetAsideRef(stale)}, then point it at ${head.slice(0, 12)}`,
          );
          expect(result.out).not.toContain('another commit');
          expect(
            scene
              .git(scene.mainOf('local'), ['rev-parse', `refs/heads/${BRANCH}`])
              .trim(),
          ).toEqual(stale.sha);
          expect(
            scene
              .git(scene.mainOf('local'), [
                'for-each-ref',
                'refs/crew-move-setaside',
              ])
              .trim(),
          ).toEqual('');
          expect(existsSync(scene.treeOf('local'))).toEqual(false);
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when('[t1] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
          }),
        );

        then(
          'it sets the old tip aside, moves the branch to the head, and the old sha stays reachable',
          () => {
            assertDivergedTwinsSettled(scene, result, stale);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case33] the destination branch holds a patch twin and one commit with no twin',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ destStale: 'rebased-stray' }),
      );
      const stale = useBeforeAll(async () => ({
        sha: scene
          .git(scene.mainOf('local'), ['rev-parse', `refs/heads/${BRANCH}`])
          .trim(),
      }));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply']),
        );

        then(
          'it exits 2, names the commit with no twin (not the twin), and leaves the branch and the refs alone',
          () => {
            expect(result.code).toEqual(2);
            expect(result.out).toContain(
              `branch ${BRANCH} exists at the destination at another commit (${stale.sha.slice(0, 12)}) that holds commits the source head lacks`,
            );
            expect(result.out).toContain(
              `no patch twin: ${stale.sha.slice(0, 12)} feat: stray, only at the destination`,
            );
            expect(result.out).not.toContain('as it stood before the rebase');
            expect(result.out).toContain("fix: pass --setaside-why '<why>'");
            expect(
              scene
                .git(scene.mainOf('local'), [
                  'rev-parse',
                  `refs/heads/${BRANCH}`,
                ])
                .trim(),
            ).toEqual(stale.sha);
            expect(
              scene
                .git(scene.mainOf('local'), [
                  'for-each-ref',
                  'refs/crew-move-setaside',
                ])
                .trim(),
            ).toEqual('');
            expect(existsSync(scene.treeOf('local'))).toEqual(false);
            expect(result.calls).toEqual([]);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case34] a copy of the operations that never judges patch twins',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ destStale: 'rebased' }),
      );
      const stale = useBeforeAll(async () => ({
        sha: scene
          .git(scene.mainOf('local'), ['rev-parse', `refs/heads/${BRANCH}`])
          .trim(),
      }));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () => {
          const pathOperations = genCutCopy({
            slug: 'crew-move-teeth-twins',
            from: '__crew_move_judge_twins "$tree"',
            into: 'false "$tree"',
          });
          return scene.run(
            ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
            { pathOperations, live: ['mechanic', 'foreman'] },
          );
        });

        then(
          'the set-aside clamp goes RED without the twin judge (the clamp bites)',
          () => {
            expect(() =>
              assertDivergedTwinsSettled(scene, result, stale),
            ).toThrow();
            expect(result.code).toEqual(2);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  // .what = the override clamp: --setaside-why keeps the commits with no patch twin under the same set-aside ref
  const WHY_SETASIDE = 'stray work rebased with conflicts, kept under the ref';
  const assertOverrideSettled = (
    scene: ReturnType<typeof genScene>,
    result: { code: number | null; out: string },
    stale: { sha: string },
  ) => {
    assertDivergedTwinsSettled(scene, result, stale);
    expect(result.out).toContain(`set-aside why: ${WHY_SETASIDE}`);
    // the tip is the commit with no twin: it stays reachable from the ref
    expect(
      scene.git(scene.mainOf('local'), [
        'merge-base',
        '--is-ancestor',
        stale.sha,
        getSetAsideRef(stale),
      ]),
    ).toEqual('');
  };

  given(
    '[case35] the destination branch holds a commit with no patch twin, and --setaside-why names why it is kept',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ destStale: 'rebased-stray' }),
      );
      const stale = useBeforeAll(async () => ({
        sha: scene
          .git(scene.mainOf('local'), ['rev-parse', `refs/heads/${BRANCH}`])
          .trim(),
      }));

      when('[t0] plan runs', () => {
        const result = useBeforeAll(async () =>
          scene.run([
            '--tree',
            TREE,
            '--to',
            'local',
            '--setaside-why',
            WHY_SETASIDE,
          ]),
        );

        then(
          'it exits 0, names the set-aside, each commit with no twin kept under the ref, and the why, and moves naught',
          () => {
            const head = scene
              .git(scene.treeOf('grove-a'), ['rev-parse', 'HEAD'])
              .trim();
            expect(result.code).toEqual(0);
            expect(result.out).toContain(
              `settle: set aside ${BRANCH} ${stale.sha.slice(0, 12)} as ${getSetAsideRef(stale)}, then point it at ${head.slice(0, 12)}`,
            );
            expect(result.out).toContain(
              `settle: no patch twin, kept under ${getSetAsideRef(stale)}: ${stale.sha.slice(0, 12)} feat: stray, only at the destination`,
            );
            expect(result.out).not.toContain(
              'feat: c, as it stood before the rebase',
            );
            expect(result.out).toContain(
              `settle: set-aside why: ${WHY_SETASIDE}`,
            );
            expect(result.out).toContain(
              `--mode apply --setaside-why '${WHY_SETASIDE}'`,
            );
            expect(
              scene
                .git(scene.mainOf('local'), [
                  'rev-parse',
                  `refs/heads/${BRANCH}`,
                ])
                .trim(),
            ).toEqual(stale.sha);
            expect(
              scene
                .git(scene.mainOf('local'), [
                  'for-each-ref',
                  'refs/crew-move-setaside',
                ])
                .trim(),
            ).toEqual('');
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when('[t1] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(
            [
              '--tree',
              TREE,
              '--to',
              'local',
              '--mode',
              'apply',
              '--setaside-why',
              WHY_SETASIDE,
            ],
            { live: ['mechanic', 'foreman'] },
          ),
        );

        then(
          'it sets the old tip aside, prints the why, moves the branch to the head, and the stray commit stays reachable',
          () => {
            assertOverrideSettled(scene, result, stale);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case36] --setaside-why holds fewer than three words', () => {
    const scene = useBeforeAll(async () =>
      genScene({ destStale: 'rebased-stray' }),
    );

    when('[t0] plan runs', () => {
      const result = useBeforeAll(async () =>
        scene.run([
          '--tree',
          TREE,
          '--to',
          'local',
          '--setaside-why',
          'because rebased',
        ]),
      );

      then('it exits 2 and moves naught', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain(
          '--setaside-why needs a reason of three words or more',
        );
        expect(existsSync(scene.treeOf('local'))).toEqual(false);
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given(
    '[case37] the destination branch holds a merge commit the head lacks, and --setaside-why is given',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ destStale: 'rebased-merge' }),
      );
      const stale = useBeforeAll(async () => ({
        sha: scene
          .git(scene.mainOf('local'), ['rev-parse', `refs/heads/${BRANCH}`])
          .trim(),
      }));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run([
            '--tree',
            TREE,
            '--to',
            'local',
            '--mode',
            'apply',
            '--setaside-why',
            WHY_SETASIDE,
          ]),
        );

        then(
          'it exits 2, names the merge, and leaves the branch and the refs alone',
          () => {
            expect(result.code).toEqual(2);
            expect(result.out).toContain(
              'a merge commit among them is never set aside',
            );
            expect(result.out).toContain(
              `${stale.sha.slice(0, 12)} merge: side work into the branch`,
            );
            expect(
              scene
                .git(scene.mainOf('local'), [
                  'rev-parse',
                  `refs/heads/${BRANCH}`,
                ])
                .trim(),
            ).toEqual(stale.sha);
            expect(
              scene
                .git(scene.mainOf('local'), [
                  'for-each-ref',
                  'refs/crew-move-setaside',
                ])
                .trim(),
            ).toEqual('');
            expect(existsSync(scene.treeOf('local'))).toEqual(false);
            expect(result.calls).toEqual([]);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case38] a copy of the operations whose override leaves the box to recheck the twins',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ destStale: 'rebased-stray' }),
      );
      const stale = useBeforeAll(async () => ({
        sha: scene
          .git(scene.mainOf('local'), ['rev-parse', `refs/heads/${BRANCH}`])
          .trim(),
      }));

      when('[t0] apply runs with the flag', () => {
        const result = useBeforeAll(async () => {
          const pathOperations = genCutCopy({
            slug: 'crew-move-teeth-override',
            from: '__mv_setaside=force',
            into: '__mv_setaside=yes',
          });
          return scene.run(
            [
              '--tree',
              TREE,
              '--to',
              'local',
              '--mode',
              'apply',
              '--setaside-why',
              WHY_SETASIDE,
            ],
            { pathOperations, live: ['mechanic', 'foreman'] },
          );
        });

        then(
          'the override clamp goes RED without the force (the clamp bites)',
          () => {
            expect(() => assertOverrideSettled(scene, result, stale)).toThrow();
            expect(result.code).toEqual(2);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  // .what = the merge clamps: --into-extant lands a crew INTO a destination worktree that already stands on the
  //         same branch at the same head, and never touches a path the source does not carry
  const COUNTS_SOURCE = 'source: 7 dirty, 4 untracked';
  const getSnapshotOf = (scene: ReturnType<typeof genScene>) => ({
    records: scene.pathsRecord.map((path) => scene.getShaOf('local', path)),
    readme: scene.getShaOf('local', 'readme.md'),
    status: scene.getStatus('local'),
  });

  given(
    '[case40] plan, --into-extant, a destination worktree on the same branch at the same head with work of its own',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ destExtant: 'disjoint' }),
      );
      const before = useBeforeAll(async () => getSnapshotOf(scene));

      when('[t0] plan runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--into-extant']),
        );

        then(
          'it exits 0 and names the merge: four writes, one overwrite of a clean tracked copy, one delete, one skip, no conflict',
          () => {
            expect(result.code).toEqual(0);
            expect(result.out).toContain(
              `merge: into the extant destination worktree ${scene.treeOf('local')} (same branch, same head)`,
            );
            expect(result.out).toContain(
              'write: 4 · overwrite a clean tracked copy: 1 · delete: 1 · skip, same bytes: 1 · already gone: 0 · conflict: 0',
            );
            expect(result.out).not.toContain('is already a worktree');
            expect(result.out).not.toContain(
              'is checked out at the destination',
            );
          },
        );

        then(
          'it names the destination-only paths and the counts of both trees, before and after',
          () => {
            expect(result.out).toContain(
              'destination-only paths, never touched: 6',
            );
            expect(result.out).toContain(
              `before — ${COUNTS_SOURCE} · destination: 7 dirty, 6 untracked`,
            );
            expect(result.out).toContain(
              `after (expected) — ${COUNTS_SOURCE} · destination: 13 dirty, 9 untracked`,
            );
          },
        );

        then('it says the verdict of each source path', () => {
          expect(result.out).toMatch(/write\s+\?\?\s+docs\/deep\/x\.txt/);
          expect(result.out).toMatch(/overwrite\s+\sM\s+src\/a\.ts/);
          expect(result.out).toMatch(/skip\s+\?\?\s+notes\.md/);
          expect(result.out).toMatch(/delete\s+\sD\s+src\/b\.ts/);
        });

        then('the whole render holds across runs', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });

        then(
          'it says plan only, and moved naught: the destination is byte for byte as before',
          () => {
            expect(result.out).toContain('plan only');
            expect(result.out).toContain('--mode apply --into-extant');
            expect(getSnapshotOf(scene)).toEqual(before);
            expect(
              existsSync(join(scene.treeOf('local'), 'src', 'staged.ts')),
            ).toEqual(false);
            expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
            expect(result.calls).toEqual([]);
          },
        );
      });
    },
  );

  given('[case41] apply, --into-extant, then verify', () => {
    const scene = useBeforeAll(async () =>
      genScene({ destExtant: 'disjoint' }),
    );
    const before = useBeforeAll(async () => ({
      dest: getSnapshotOf(scene),
      source: scene.getStatus('grove-a'),
    }));

    when('[t0] apply runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(
          [
            '--tree',
            TREE,
            '--to',
            'local',
            '--into-extant',
            '--mode',
            'apply',
            '--why',
            'weekly limit on grove-a',
          ],
          {
            live: ['mechanic', 'foreman'],
          },
        ),
      );

      then('it exits 0', () => {
        expect(result.out).toContain('✅ moved');
        expect(result.code).toEqual(0);
      });

      then('the whole render holds across runs', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });

      then(
        'every source path stands at the destination with the same bytes',
        () => {
          const dest = scene.treeOf('local');
          expect(readFileSync(join(dest, 'src', 'a.ts'), 'utf-8')).toEqual(
            'export const a = 100; // edited\n',
          );
          expect(readFileSync(join(dest, 'src', 'staged.ts'), 'utf-8')).toEqual(
            'export const staged = 1;\n',
          );
          expect(
            readFileSync(join(dest, 'docs', 'deep', 'x.txt'), 'utf-8'),
          ).toEqual('deep\n');
          expect(readFileSync(join(dest, 'notes.md'), 'utf-8')).toEqual(
            'a note\n',
          );
          expect(existsSync(join(dest, 'src', 'b.ts'))).toEqual(false);
          expect(
            statSync(join(dest, 'bin', 'run.sh')).mode & 0o111,
          ).not.toEqual(0);
          expect(
            execFileSync('readlink', [join(dest, 'link-to-a')])
              .toString()
              .trim(),
          ).toEqual('src/a.ts');
        },
      );

      then(
        '🔴 each destination-only path is byte for byte as before: the records and the tracked edit',
        () => {
          const after = getSnapshotOf(scene);
          expect(after.records).toEqual(before.dest.records);
          expect(after.records).not.toContain('ABSENT');
          expect(after.readme).toEqual(before.dest.readme);
          expect(
            readFileSync(join(scene.treeOf('local'), 'readme.md'), 'utf-8'),
          ).toEqual('hi, edited at the destination\n');
        },
      );

      then(
        'the status of the destination holds its own work and the carried paths, and the staged add stays staged',
        () => {
          const lines = scene.getStatus('local').split('\n');
          for (const line of before.dest.status.split('\n'))
            expect(lines).toContain(line);
          expect(lines).toContain('A  src/staged.ts');
          expect(lines).toContain(' M readme.md');
          expect(lines).toContain('?? records/deep/r2.json');
          expect(lines).toContain(' D src/b.ts');
        },
      );

      then(
        'it prints the counts of both trees before and after, and the proof by sha256',
        () => {
          expect(result.out).toContain(
            `before — ${COUNTS_SOURCE} · destination: 7 dirty, 6 untracked`,
          );
          expect(result.out).toContain(
            `after — ${COUNTS_SOURCE} · destination: 13 dirty, 9 untracked`,
          );
          expect(result.out).toContain(
            'written: 4 · overwritten: 1 · deleted: 1 · skipped, same bytes: 1 · already gone: 0',
          );
          expect(result.out).toContain(
            'destination-only paths: 6, sha256 before and after equal',
          );
          expect(result.out).toContain(
            'every source path stands at the destination with the same bytes (sha256 read back)',
          );
        },
      );

      then(
        'the transcripts, the role links, the ledger, and the seats move as in any apply',
        () => {
          assertTranscriptsInOwnDir(scene);
          assertRoleLinksCarried(scene);
          expect(scene.getLedgerGrove()).toEqual('local');
          expect(result.calls).toEqual([
            `crew.boot --tree ${TREE} --grove local --roles mechanic --resume mechanic`,
            `crew.boot --tree ${TREE} --grove local --roles foreman --resume foreman`,
          ]);
        },
      );

      then('the source tree and its dirty bytes are untouched', () => {
        expect(scene.getStatus('grove-a')).toEqual(before.source);
      });
    });

    when('[t1] verify runs with --into-extant, both seats live', () => {
      const result = useBeforeAll(async () =>
        scene.run(
          [
            '--tree',
            TREE,
            '--to',
            'local',
            '--into-extant',
            '--mode',
            'verify',
          ],
          { live: ['mechanic', 'foreman'] },
        ),
      );

      then('it exits 0 and proves every source path at the destination', () => {
        expect(result.code).toEqual(0);
        expect(result.out).toContain(
          '✓ tree: every source path stands at the destination with the same bytes',
        );
        expect(result.out).toContain('the move holds');
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  // .what = the conflict clamp, asserted on the live file, and again on a copy with the refusal cut: naught written
  const assertConflictRefused = (
    scene: ReturnType<typeof genScene>,
    result: { code: number | null; out: string; calls: string[] },
    before: ReturnType<typeof getSnapshotOf>,
  ) => {
    expect(result.code).toEqual(2);
    expect(result.out).toContain(
      'the extant destination worktree holds notes.md with other bytes',
    );
    expect(result.out).toContain(
      'the extant destination worktree holds src/a.ts with other bytes',
    );
    expect(result.out).toContain('naught was moved');
    expect(getSnapshotOf(scene)).toEqual(before);
    expect(
      readFileSync(join(scene.treeOf('local'), 'notes.md'), 'utf-8'),
    ).toEqual('a different note at the destination\n');
    expect(existsSync(join(scene.treeOf('local'), 'src', 'staged.ts'))).toEqual(
      false,
    );
    expect(existsSync(join(scene.treeOf('local'), 'docs'))).toEqual(false);
    expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
    expect(result.calls).toEqual([]);
  };

  given(
    '[case42] --into-extant, the destination holds two paths the source carries at other bytes',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ destExtant: 'differs' }),
      );
      const before = useBeforeAll(async () => getSnapshotOf(scene));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run([
            '--tree',
            TREE,
            '--to',
            'local',
            '--into-extant',
            '--mode',
            'apply',
          ]),
        );

        then(
          'it exits 2, names each path, writes naught, and leaves every destination byte as it was',
          () => {
            assertConflictRefused(scene, result, before);
            expect(result.out).toContain('fix:');
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  // .what = the head clamp: the destination worktree must stand at the source head
  const assertHeadRefused = (
    scene: ReturnType<typeof genScene>,
    result: { code: number | null; out: string; calls: string[] },
  ) => {
    expect(result.code).toEqual(2);
    expect(result.out).toContain(
      'the extant destination worktree is not at the source head',
    );
    expect(existsSync(join(scene.treeOf('local'), 'src', 'staged.ts'))).toEqual(
      false,
    );
    expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
    expect(result.calls).toEqual([]);
  };

  given(
    '[case43] --into-extant, the destination worktree stands at another head',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ destExtant: 'behind' }),
      );

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run([
            '--tree',
            TREE,
            '--to',
            'local',
            '--into-extant',
            '--mode',
            'apply',
          ]),
        );

        then('it exits 2, names both heads, and moves naught', () => {
          assertHeadRefused(scene, result);
          expect(result.out).toMatch(
            /source [0-9a-f]{12}, destination [0-9a-f]{12}/,
          );
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when(
        '[t1] a copy of the operations with the head refusal cut runs the plan',
        () => {
          const result = useBeforeAll(async () => {
            const pathOperations = genCutCopy({
              slug: 'crew-move-teeth-extant-head',
              from: '{ __crew_move_refuse "the extant destination worktree is not at the source head',
              into: '{ : "the extant destination worktree is not at the source head',
            });
            return scene.run(
              ['--tree', TREE, '--to', 'local', '--into-extant'],
              { pathOperations },
            );
          });

          then(
            'the head clamp goes RED without the refusal (the clamp bites)',
            () => {
              expect(() => assertHeadRefused(scene, result)).toThrow();
            },
          );

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(result.out)).toMatchSnapshot();
          });
        },
      );
    },
  );

  given(
    '[case44] --into-extant, no worktree of the tree stands at the destination',
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when('[t0] plan runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--into-extant']),
        );

        then(
          'it exits 2, says the destination holds no extant worktree, and names the plain move as the fix',
          () => {
            expect(result.code).toEqual(2);
            expect(result.out).toContain(
              'the destination holds no extant worktree',
            );
            expect(result.out).toContain('drop --into-extant');
            expect(existsSync(scene.treeOf('local'))).toEqual(false);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case46] a copy of the operations whose plan never refuses a conflict meets the box',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ destExtant: 'differs' }),
      );
      const before = useBeforeAll(async () => getSnapshotOf(scene));

      when('[t0] apply runs on the copy', () => {
        const result = useBeforeAll(async () => {
          const pathOperations = genCutCopy({
            slug: 'crew-move-teeth-extant-conflict',
            from: '__crew_move_refuse "the extant destination worktree holds $p with $why"',
            into: ': "the extant destination worktree holds $p with $why"',
          });
          return scene.run(
            [
              '--tree',
              TREE,
              '--to',
              'local',
              '--into-extant',
              '--mode',
              'apply',
            ],
            { pathOperations },
          );
        });

        then(
          'the box judges again: it exits 2, names each path, and writes naught',
          () => {
            expect(result.code).toEqual(2);
            expect(result.out).toContain(
              'the destination holds notes.md with other bytes',
            );
            expect(result.out).toContain(
              'the destination holds src/a.ts with other bytes',
            );
            expect(result.out).toContain('the merge wrote naught');
            expect(getSnapshotOf(scene)).toEqual(before);
            expect(
              existsSync(join(scene.treeOf('local'), 'src', 'staged.ts')),
            ).toEqual(false);
            expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
            expect(result.calls).toEqual([]);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case47] the source grove prints channel noise on stderr beside the dirty set',
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when('[t0] plan runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local'], { sshNoise: true }),
        );

        then(
          'it counts and lists the seven dirty paths only: a notice is no dirty path',
          () => {
            expect(result.code).toEqual(0);
            expect(result.out).toContain('carry: 7 path(s)');
            expect(result.out).not.toContain('mux_client_request_session');
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case45] --into-extant with a flag that settles a fresh raise', () => {
    const scene = useBeforeAll(async () =>
      genScene({ destExtant: 'disjoint' }),
    );

    when('[t0] plan runs with --drop-twin-why', () => {
      const result = useBeforeAll(async () =>
        scene.run([
          '--tree',
          TREE,
          '--to',
          'local',
          '--into-extant',
          '--drop-twin-why',
          'a stale twin may go',
        ]),
      );

      then('it exits 2 and names the flag it cannot join', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain('--into-extant takes no --drop-twin-why');
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t1] plan runs with --setaside-why', () => {
      const result = useBeforeAll(async () =>
        scene.run([
          '--tree',
          TREE,
          '--to',
          'local',
          '--into-extant',
          '--setaside-why',
          'the old tip may be kept aside',
        ]),
      );

      then('it exits 2 and names the flag it cannot join', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain('--into-extant takes no --setaside-why');
        expect(result.out).toContain('fix: drop one of the two flags');
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  // ── cause 1: a package whose tarball ships read-only files cannot be patched on a cold store ──────────────
  // .what = a fake pnpm: a patched package is copied in with a read-only exec file (a built dist ships 0555), and
  //         the patch step needs the owner write bit, which the mode alone says (a root run holds no write-bit
  //         check, so the mode is read, never a write tried)
  const PKG_DIR =
    'node_modules/.pnpm/pkg@1.0.0_patch_hash=abc/node_modules/pkg';
  const INSTALL_READONLY_PKG = [
    `f=${PKG_DIR}/dist/run.sh`,
    `[ -e "$f" ] || { mkdir -p ${PKG_DIR}/dist && printf 'echo hi\\n' > "$f" && chmod 555 "$f"; }`,
    'mode="$(stat -c %a "$f")"',
    'if [ $(( 0$mode & 0200 )) -eq 0 ]; then',
    `  echo " ERR_PNPM_PATCH_FAILED  Could not apply patch $PWD/patches/pkg@1.0.0.patch to $PWD/${PKG_DIR}" >&2`,
    '  exit 1',
    'fi',
    'echo patched >> "$f"',
    'echo ok > node_modules/.ok',
  ].join('\n');

  // .what = the clamp: the apply finishes, the read-only package dir was made writable, and the run says so
  const assertPatchFailureCured = (
    scene: ReturnType<typeof genScene>,
    result: { code: number | null; out: string },
  ) => {
    expect(result.code).toEqual(0);
    expect(result.out).toContain('retried after ERR_PNPM_PATCH_FAILED');
    expect(result.out).toContain('pkg@1.0.0_patch_hash=abc');
    expect(result.out).toContain('✅ moved');
    expect(
      existsSync(join(scene.treeOf('local'), 'node_modules', '.ok')),
    ).toEqual(true);
    expect(
      readFileSync(
        join(scene.treeOf('local'), PKG_DIR, 'dist', 'run.sh'),
        'utf-8',
      ),
    ).toContain('patched');
    expect(scene.getLedgerGrove()).toEqual('local');
  };

  given(
    '[case48] the destination install fails to patch a package whose files are read-only',
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
            installCmd: INSTALL_READONLY_PKG,
          }),
        );

        then(
          'it makes only the named package dir writable, installs again, and the move finishes',
          () => {
            assertPatchFailureCured(scene, result);
          },
        );

        then('the first log is kept beside the second', () => {
          const log = readFileSync(
            join(
              scene.treeOf('local'),
              '.log',
              'git.crew.move',
              'install.log.patch1',
            ),
            'utf-8',
          );
          expect(log).toContain('ERR_PNPM_PATCH_FAILED');
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when(
        '[t1] a copy of the operations with the writable step cut runs the same call, on a fresh scene',
        () => {
          const teeth = useBeforeAll(async () => {
            const pathOperations = genCutCopy({
              slug: 'crew-move-teeth-patch-writable',
              from: 'chmod -R u+w -- "$pdir"',
              into: ': chmod -R u+w -- "$pdir"',
            });
            const sceneFresh = genScene({});
            return {
              scene: sceneFresh,
              result: sceneFresh.run(
                ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
                {
                  pathOperations,
                  live: ['mechanic', 'foreman'],
                  installCmd: INSTALL_READONLY_PKG,
                },
              ),
            };
          });

          then('the clamp goes RED without the step (the clamp bites)', () => {
            expect(() =>
              assertPatchFailureCured(teeth.scene, teeth.result),
            ).toThrow();
          });
        },
      );
    },
  );

  given(
    '[case49] the destination install fails for a cause that is no patch',
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
            installCmd:
              'echo " ERR_PNPM_FETCH_404  no such package" >&2; exit 1',
          }),
        );

        then(
          'the failure stands: no retry is made, the run exits 1 and the ledger does not flip',
          () => {
            expect(result.code).toEqual(1);
            expect(result.out).toContain('ERR_PNPM_FETCH_404');
            expect(result.out).not.toContain('retried after');
            expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  // ── cause 3: every dependency lands, and the tree's OWN lifecycle hook is what fails ──────────────────────
  // .what = 2026-11-20, rhachet-roles-bhrain.beav.feat-subconscious-term-distill moved to the cloud grove: `pnpm install --frozen-lockfile` landed all
  //         1043 packages, then the tree's own `prepare` hook ran `rhachet repo introspect`, which refused the branch's role hooks (exit 2). the move
  //         stopped before its seats, and the repair verb refused a tree with no duct. the source box, installed long before, never ran the hook again.
  //         the fake: a pnpm that adds its packages, then runs the tree's prepare hook (the header line names the tree dir) unless the lifecycle
  //         hooks are off, which the command text says (`--ignore-scripts` joins the first word of the command)
  const HOOK_CAUSE = '✋ ConstraintError: hooks that boot their own role';
  const installHookFails = (input: {
    header: string;
    hooksOffPasses: boolean;
  }) =>
    [
      'set -- --frozen-lockfile',
      'mkdir -p node_modules/.pnpm',
      'echo "Progress: resolved 3, reused 3, downloaded 0, added 3, done"',
      `case "$*" in *ignore-scripts*) ${input.hooksOffPasses ? 'echo ok > node_modules/.ok; exit 0' : 'echo " ERR_PNPM_NO_MATCHING_VERSION  none" >&2; exit 1'} ;; esac`,
      `echo "${input.header}"`,
      `echo "${HOOK_CAUSE}" >&2`,
      'echo " ELIFECYCLE  Command failed with exit code 2." >&2',
      'exit 2',
    ].join('\n');
  const INSTALL_OWN_HOOK_FAILS = installHookFails({
    header: '> pkg@1.0.0 prepare $PWD',
    hooksOffPasses: true,
  });

  // .what = the clamp: the move finishes, the line says the hook did NOT run and why, and the first log is kept
  const assertOwnHookFailureCured = (
    scene: ReturnType<typeof genScene>,
    result: { code: number | null; out: string },
  ) => {
    expect(result.code).toEqual(0);
    expect(result.out).toContain(
      "the tree's own prepare hook failed after every dependency landed",
    );
    expect(result.out).toContain(HOOK_CAUSE);
    expect(result.out).toContain('the prepare hook did NOT run');
    expect(result.out).toContain('✅ moved');
    expect(
      existsSync(join(scene.treeOf('local'), 'node_modules', '.ok')),
    ).toEqual(true);
    expect(scene.getLedgerGrove()).toEqual('local');
  };

  given(
    "[case58] the destination install lands every dependency, then the tree's own prepare hook fails",
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
            installCmd: INSTALL_OWN_HOOK_FAILS,
          }),
        );

        then(
          'the install runs again with the lifecycle hooks off, and the move runs on to the ledger and the seats',
          () => {
            assertOwnHookFailureCured(scene, result);
          },
        );

        then('the first log is kept, and it holds the cause', () => {
          const log = readFileSync(
            join(
              scene.treeOf('local'),
              '.log',
              'git.crew.move',
              'install.log.prepare',
            ),
            'utf-8',
          );
          expect(log).toContain('ELIFECYCLE');
          expect(log).toContain(HOOK_CAUSE);
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when(
        '[t1] a copy of the operations that runs the same install again, on a fresh scene',
        () => {
          const teeth = useBeforeAll(async () => {
            const pathOperations = genCutCopy({
              slug: 'crew-move-teeth-own-hook',
              from: 'rcmd="${cmd//--frozen-lockfile/--frozen-lockfile --ignore-scripts}"',
              into: 'rcmd="$cmd"',
            });
            const sceneFresh = genScene({});
            return {
              scene: sceneFresh,
              result: sceneFresh.run(
                ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
                {
                  pathOperations,
                  live: ['mechanic', 'foreman'],
                  installCmd: INSTALL_OWN_HOOK_FAILS,
                },
              ),
            };
          });

          then(
            'the clamp goes RED without the hooks off (the clamp bites)',
            () => {
              expect(() =>
                assertOwnHookFailureCured(teeth.scene, teeth.result),
              ).toThrow();
            },
          );
        },
      );
    },
  );

  given(
    "[case59] the hook that fails is a dependency's own, named by a dir that is not the tree",
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
            installCmd: installHookFails({
              header:
                '> dep@2.0.0 postinstall /somewhere/node_modules/.pnpm/dep@2.0.0/node_modules/dep',
              hooksOffPasses: true,
            }),
          }),
        );

        then(
          'the failure stands: no run again, the exit is 1, and the ledger does not flip',
          () => {
            expect(result.code).toEqual(1);
            expect(result.out).not.toContain('did NOT run');
            expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case60] the run with the hooks off fails too', () => {
    const scene = useBeforeAll(async () => genScene({}));

    when('[t0] apply runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
          live: ['mechanic', 'foreman'],
          installCmd: installHookFails({
            header: '> pkg@1.0.0 prepare $PWD',
            hooksOffPasses: false,
          }),
        }),
      );

      then(
        'the failure stands: the exit is 1, the cause of the run with the hooks off is in the log, and the ledger does not flip',
        () => {
          expect(result.code).toEqual(1);
          expect(result.out).not.toContain('did NOT run');
          expect(result.out).toContain('ERR_PNPM_NO_MATCHING_VERSION');
          expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
        },
      );

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  // .what = the same fake, as the real pnpm behaves with a frozen install: a frozen (headless) run imports every package
  //         afresh, so a dir made writable is replaced by a read-only one; a run without the frozen preference keeps
  //         the dir that stands. the first word of the command stands for the flag the verb reads
  const INSTALL_READONLY_PKG_FROZEN = [
    'set -- --frozen-lockfile',
    `case "$1" in *no-prefer*) : ;; *) rm -rf ${PKG_DIR}/dist ;; esac`,
    INSTALL_READONLY_PKG,
  ].join('\n');

  // .what = the clamp: a frozen install is run again WITHOUT the frozen preference, so the patch lands on the writable dir
  given(
    '[case55] the install is frozen: a frozen run again would import the read-only dir afresh',
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
            installCmd: INSTALL_READONLY_PKG_FROZEN,
          }),
        );

        then(
          'the run again keeps the dir that stands: the patch lands and the move finishes',
          () => {
            assertPatchFailureCured(scene, result);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when(
        '[t1] a copy of the operations that runs the same frozen install again, on a fresh scene',
        () => {
          const teeth = useBeforeAll(async () => {
            const pathOperations = genCutCopy({
              slug: 'crew-move-teeth-patch-frozen',
              from: 'rcmd="${cmd//--frozen-lockfile/--no-prefer-frozen-lockfile}"',
              into: 'rcmd="$cmd"',
            });
            const sceneFresh = genScene({});
            return {
              scene: sceneFresh,
              result: sceneFresh.run(
                ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
                {
                  pathOperations,
                  live: ['mechanic', 'foreman'],
                  installCmd: INSTALL_READONLY_PKG_FROZEN,
                },
              ),
            };
          });

          then(
            'the clamp goes RED without the substitution (the clamp bites)',
            () => {
              expect(() =>
                assertPatchFailureCured(teeth.scene, teeth.result),
              ).toThrow();
            },
          );
        },
      );
    },
  );

  // .what = the run again may pick versions, and the lockfile is the repo's: a run that changes it is restored and fails
  const INSTALL_READONLY_PKG_THAT_EDITS_THE_LOCKFILE = [
    '[ -e pnpm-lock.yaml ] || echo v1 > pnpm-lock.yaml',
    // the first run again picks versions once (a marker says so); the install of the restored lockfile does not
    INSTALL_READONLY_PKG.replace(
      'echo ok > node_modules/.ok',
      '[ -e .lock-edited ] || { echo v2 >> pnpm-lock.yaml; touch .lock-edited; }\necho ok > node_modules/.ok',
    ),
  ].join('\n');

  given(
    '[case54] the run again, after the package dir was made writable, changes the lockfile',
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
            installCmd: INSTALL_READONLY_PKG_THAT_EDITS_THE_LOCKFILE,
          }),
        );

        then(
          'the lockfile is restored, the install of it passes over the dirs that stand, and the move finishes',
          () => {
            expect(result.code).toEqual(0);
            expect(result.out).toContain(
              'the run again changed pnpm-lock.yaml, so it was restored from the copy taken before',
            );
            expect(
              readFileSync(
                join(scene.treeOf('local'), 'pnpm-lock.yaml'),
                'utf-8',
              ),
            ).toEqual('v1\n');
            expect(scene.getLedgerGrove()).toEqual('local');
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case56] the run again changes the lockfile, and the install of the restored lockfile fails',
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
            // every run edits the lockfile, and the run after the restore fails
            installCmd: [
              '[ -e pnpm-lock.yaml ] || echo v1 > pnpm-lock.yaml',
              INSTALL_READONLY_PKG.replace(
                'echo ok > node_modules/.ok',
                '[ -e .ran-once ] && { echo " ERR_PNPM_OUTDATED_LOCKFILE  the lockfile is out of date" >&2; exit 1; }\necho v2 >> pnpm-lock.yaml\ntouch .ran-once\necho ok > node_modules/.ok',
              ),
            ].join('\n'),
          }),
        );

        then(
          'the install fails, the lockfile is as it was, and the ledger does not flip',
          () => {
            expect(result.code).toEqual(1);
            expect(result.out).toContain(
              'the install of the restored lockfile failed',
            );
            expect(
              readFileSync(
                join(scene.treeOf('local'), 'pnpm-lock.yaml'),
                'utf-8',
              ),
            ).toEqual('v1\n');
            expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  // ── cause 2: the tree commits `.claude` as a link to one actor; the tree's own init wants another ─────────
  // .what = a fake init in the install: it refuses to replace a `.claude` link that points at another actor than the one
  //         it wants, as the real `rhx init` does, and links its own where `.claude` is absent
  const INSTALL_INIT_WANTS_DEFAULT = [
    'want=.agent/.actors/actor.via.slug=.default/brain/.claude',
    'if [ -L .claude ] && [ "$(readlink .claude)" != "$want" ]; then',
    '  echo "✋ ConstraintError: .claude is a symlink to another place: found $(readlink .claude), wanted $want" >&2',
    '  exit 1',
    'fi',
    '[ -e .claude ] || ln -s "$want" .claude',
    'mkdir -p node_modules && echo ok > node_modules/.ok',
  ].join('\n');

  const assertClaudeLinkSettled = (
    scene: ReturnType<typeof genScene>,
    result: { code: number | null; out: string },
  ) => {
    expect(result.code).toEqual(0);
    expect(result.out).toContain('✅ moved');
    expect(result.out).toContain('.claude link relinked:');
    expect(result.out).not.toContain('refused the .claude link');
    expect(readlinkSync(join(scene.treeOf('local'), '.claude'))).toEqual(
      '.agent/.actors/actor.via.slug=.default/brain/.claude',
    );
    expect(scene.getLedgerGrove()).toEqual('local');
  };

  given(
    "[case50] a tree whose committed `.claude` link points at another actor than its source tree's link",
    () => {
      const scene = useBeforeAll(async () => genScene({ claudeLink: true }));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
            installCmd: INSTALL_INIT_WANTS_DEFAULT,
          }),
        );

        then(
          'the destination link is settled before the install, the init passes, and the move finishes',
          () => {
            assertClaudeLinkSettled(scene, result);
          },
        );

        then(
          'the carry never held `.claude`: the source link is untouched',
          () => {
            expect(
              readlinkSync(join(scene.treeOf('grove-a'), '.claude')),
            ).toEqual('.agent/.actors/actor.via.slug=.default/brain/.claude');
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when(
        '[t1] a copy of the operations with the settle cut runs the same call, on a fresh scene',
        () => {
          const teeth = useBeforeAll(async () => {
            const pathOperations = genCutCopy({
              slug: 'crew-move-teeth-claude-link',
              from: 'rm -f -- "$at" || return 1',
              into: ': rm -f -- "$at" || return 1',
            });
            const sceneFresh = genScene({ claudeLink: true });
            return {
              scene: sceneFresh,
              result: sceneFresh.run(
                ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
                {
                  pathOperations,
                  live: ['mechanic', 'foreman'],
                  installCmd: INSTALL_INIT_WANTS_DEFAULT,
                },
              ),
            };
          });

          then(
            'the clamp goes RED without the settle (the clamp bites)',
            () => {
              expect(() =>
                assertClaudeLinkSettled(teeth.scene, teeth.result),
              ).toThrow();
            },
          );
        },
      );
    },
  );

  // .what = the clamp: the source link is the committed one, so the mirror changes naught, the init refuses at the destination,
  //         and the link is dropped and the install runs once more so the init links its own
  const assertClaudeLinkDropped = (
    scene: ReturnType<typeof genScene>,
    result: { code: number | null; out: string },
  ) => {
    expect(result.code).toEqual(0);
    expect(result.out).toContain('✅ moved');
    expect(result.out).toContain(
      'retried after the init refused the .claude link',
    );
    expect(readlinkSync(join(scene.treeOf('local'), '.claude'))).toEqual(
      '.agent/.actors/actor.via.slug=.default/brain/.claude',
    );
    expect(scene.getLedgerGrove()).toEqual('local');
  };

  given(
    "[case57] the source tree's `.claude` link is the committed one, and the destination init wants another actor",
    () => {
      const scene = useBeforeAll(async () => genScene({ claudeLink: 'same' }));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
            installCmd: INSTALL_INIT_WANTS_DEFAULT,
          }),
        );

        then(
          'the install is run again over the dropped link, the init links its own, and the move finishes',
          () => {
            assertClaudeLinkDropped(scene, result);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when(
        '[t1] a copy of the operations with the drop cut runs the same call, on a fresh scene',
        () => {
          const teeth = useBeforeAll(async () => {
            const pathOperations = genCutCopy({
              slug: 'crew-move-teeth-claude-drop',
              from: 'rm -f -- "$d/.claude" || return 1',
              into: ': rm -f -- "$d/.claude" || return 1',
            });
            const sceneFresh = genScene({ claudeLink: 'same' });
            return {
              scene: sceneFresh,
              result: sceneFresh.run(
                ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
                {
                  pathOperations,
                  live: ['mechanic', 'foreman'],
                  installCmd: INSTALL_INIT_WANTS_DEFAULT,
                },
              ),
            };
          });

          then('the clamp goes RED without the drop (the clamp bites)', () => {
            expect(() =>
              assertClaudeLinkDropped(teeth.scene, teeth.result),
            ).toThrow();
          });
        },
      );
    },
  );

  given('[case51] a tree with no `.claude` link at all', () => {
    const scene = useBeforeAll(async () => genScene({}));

    when('[t0] apply runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
          live: ['mechanic', 'foreman'],
          installCmd: INSTALL_INIT_WANTS_DEFAULT,
        }),
      );

      then('the run says naught of a link and the move finishes', () => {
        expect(result.code).toEqual(0);
        expect(result.out).not.toContain('.claude link');
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  // ── cause 3: a seat with no transcript comes up bare, as the plan says; apply and verify must agree ─────
  const assertBareSeatPasses = (result: {
    code: number | null;
    out: string;
  }) => {
    expect(result.code).toEqual(0);
    expect(result.out).not.toContain('left as a bare shell');
    expect(result.out).not.toContain('holds no live claude');
  };

  given(
    '[case52] a third seat, the reflector, holds no transcript, and its duct stands as a bare shell',
    () => {
      const scene = useBeforeAll(async () => genScene({ bareSeat: 'shell' }));

      when('[t0] plan runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local']),
        );

        then('it says the seat comes up bare', () => {
          expect(result.out).toContain(
            'reflector: idle at the source · no transcript — the seat comes up bare, no clone is hatched',
          );
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when('[t1] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
          }),
        );

        then(
          'it passes the seat as a bare shell, as the plan said: the move finishes with exit 0',
          () => {
            assertBareSeatPasses(result);
            expect(result.out).toContain(
              'reflector: up at local, a bare shell',
            );
            expect(result.out).toContain('✅ moved');
          },
        );

        then(
          'the seat is booted bare: no resume, since no conversation moved',
          () => {
            expect(result.calls).toContain(
              `crew.boot --tree ${TREE} --grove local --roles reflector`,
            );
            expect(result.calls).not.toContain(
              `crew.boot --tree ${TREE} --grove local --roles reflector --resume reflector`,
            );
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when('[t2] verify runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'verify'], {
            live: ['mechanic', 'foreman'],
          }),
        );

        then('it passes the bare seat too: exit 0, the move holds', () => {
          assertBareSeatPasses(result);
          expect(result.out).toContain(
            '✓ seat reflector: a bare shell at local',
          );
          expect(result.out).toContain('the move holds');
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when(
        '[t3] verify runs over a move log written before the bare seats were logged',
        () => {
          const result = useBeforeAll(async () => {
            const pathLog = join(scene.dirRoot, 'crewwork', 'moves.jsonl');
            const rows = readFileSync(pathLog, 'utf-8')
              .trim()
              .split('\n')
              .map((line) => {
                const row = JSON.parse(line);
                delete row.bare;
                return JSON.stringify(row);
              });
            writeFileSync(pathLog, `${rows.join('\n')}\n`);
            return scene.run(
              ['--tree', TREE, '--to', 'local', '--mode', 'verify'],
              { live: ['mechanic', 'foreman'] },
            );
          });

          then(
            'it still passes the bare seat: the source holds no transcript for it, read there',
            () => {
              assertBareSeatPasses(result);
              expect(result.out).toContain(
                '✓ seat reflector: a bare shell at local',
              );
            },
          );

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(result.out)).toMatchSnapshot();
          });
        },
      );

      when(
        '[t4] verify runs with a seat that HAS a transcript and no live claude',
        () => {
          const result = useBeforeAll(async () =>
            scene.run(['--tree', TREE, '--to', 'local', '--mode', 'verify'], {
              live: ['mechanic'],
            }),
          );

          then(
            'it still fails that seat: only a seat the plan said comes up bare passes as a shell',
            () => {
              expect(result.code).toEqual(1);
              expect(result.out).toContain(
                '✗ seat foreman: no live claude at local',
              );
              expect(result.out).toContain(
                '✓ seat reflector: a bare shell at local',
              );
            },
          );

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(result.out)).toMatchSnapshot();
          });
        },
      );

      when(
        '[t5] a copy of the operations that holds every seat to a live claude runs the apply, on a fresh scene',
        () => {
          const result = useBeforeAll(async () => {
            const pathOperations = genCutCopy({
              slug: 'crew-move-teeth-bare-seat',
              from: 'elif [[ -z "$hasconv" ]]; then',
              into: 'elif false; then',
            });
            return genScene({ bareSeat: 'shell' }).run(
              ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
              { pathOperations, live: ['mechanic', 'foreman'] },
            );
          });

          then(
            'the clamp goes RED without the bare-seat branch (the clamp bites)',
            () => {
              expect(() => assertBareSeatPasses(result)).toThrow();
            },
          );
        },
      );
    },
  );

  given(
    '[case53] a third seat holds no transcript, and no duct stands for it at the destination',
    () => {
      const scene = useBeforeAll(async () => genScene({ bareSeat: 'nopane' }));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
          }),
        );

        then(
          'it fails that seat: a seat with no duct is no bare shell, and the cure names a boot',
          () => {
            expect(result.code).toEqual(1);
            expect(result.out).toContain('reflector: no duct stands at local');
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when('[t1] verify runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'verify'], {
            live: ['mechanic', 'foreman'],
          }),
        );

        then(
          'it fails that seat, and the cure boots it plain: a bare seat has no conversation to resume',
          () => {
            expect(result.code).toEqual(1);
            expect(result.out).toContain(
              '✗ seat reflector: no duct stands at local',
            );
            expect(result.out).toContain(
              `cure: rhx git.crew.boot --tree ${TREE} --grove local --roles reflector\n`,
            );
            expect(result.out).not.toContain(
              '--roles reflector --resume reflector',
            );
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  // ── a self-hosted repo: its prepare hook runs its own build output, and a fresh worktree has none ────────
  // .what = 2026-11-21, rhachet.beav.fix-claudemd-excludes-common moved to the cloud grove: `pnpm install` failed in prepare
  //         (bin/run.jit requires ../dist/contract/cli/invoke), the run with the hooks off passed, and every `npx rhachet roles link`
  //         then failed on the same absent dist. the tree stood at the destination with no role links and no ledger row.
  //         the fake: an install whose prepare hook fails until the dist stands, and a role link that fails the same way
  const BUILD_MAKES_DIST =
    'mkdir -p dist/contract/cli && echo built > dist/contract/cli/invoke.js && touch dist/.build.stamp';
  const INSTALL_PREPARE_NEEDS_DIST = [
    'set -- --frozen-lockfile',
    'mkdir -p node_modules/.pnpm',
    'echo "Progress: resolved 3, reused 3, downloaded 0, added 3, done"',
    'if [ -e dist/contract/cli/invoke.js ]; then echo ok > node_modules/.ok; exit 0; fi',
    'case "$*" in *ignore-scripts*) echo ok > node_modules/.ok; exit 0 ;; esac',
    'echo "> pkg@1.0.0 prepare $PWD"',
    'echo "Error: Cannot find module ../dist/contract/cli/invoke" >&2',
    'echo " ELIFECYCLE  Command failed with exit code 1." >&2',
    'exit 1',
  ].join('\n');

  // .what = the clamp: the tree is built first, the install runs its hooks against the dist, the roles link, the ledger flips
  const assertSelfBuiltMoved = (
    scene: ReturnType<typeof genScene>,
    result: { code: number | null; out: string },
  ) => {
    expect(result.code).toEqual(0);
    expect(result.out).toContain(
      'built first, so the install and the role links find it',
    );
    expect(result.out).not.toContain('did NOT run');
    expect(
      existsSync(
        join(scene.treeOf('local'), 'dist', 'contract', 'cli', 'invoke.js'),
      ),
    ).toEqual(true);
    expect(
      existsSync(join(scene.treeOf('local'), 'node_modules', '.ok')),
    ).toEqual(true);
    assertRoleLinksCarried(scene);
    expect(scene.getLedgerGrove()).toEqual('local');
  };

  given(
    '[case63] the repo runs itself in its prepare hook, and the fresh destination tree has no dist',
    () => {
      const scene = useBeforeAll(async () => genScene({ selfBuilt: true }));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
            installCmd: INSTALL_PREPARE_NEEDS_DIST,
            buildCmd: BUILD_MAKES_DIST,
            linkNeedsDist: true,
          }),
        );

        then(
          'the tree is built first, then installed, then linked, and the move finishes',
          () => {
            assertSelfBuiltMoved(scene, result);
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when(
        '[t1] a copy of the operations that never builds first runs the same apply, on a fresh scene',
        () => {
          const teeth = useBeforeAll(async () => {
            const pathOperations = genCutCopy({
              slug: 'crew-move-teeth-build-first',
              from: 'if ! __mvbox_needs_build "$d"; then echo "build=none"; return 0; fi',
              into: 'if true; then echo "build=none"; return 0; fi',
            });
            const sceneFresh = genScene({ selfBuilt: true });
            return {
              scene: sceneFresh,
              result: sceneFresh.run(
                ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
                {
                  pathOperations,
                  live: ['mechanic', 'foreman'],
                  installCmd: INSTALL_PREPARE_NEEDS_DIST,
                  buildCmd: BUILD_MAKES_DIST,
                  linkNeedsDist: true,
                },
              ),
            };
          });

          then(
            'the clamp goes RED without the build (the role links fail on the absent dist)',
            () => {
              expect(teeth.result.code).toEqual(1);
              expect(teeth.result.out).toContain(
                'the role link(s) did not stand at the destination',
              );
              expect(() =>
                assertSelfBuiltMoved(teeth.scene, teeth.result),
              ).toThrow();
            },
          );

          then('the render matches the snapshot', () => {
            expect(teeth.scene.getMasked(teeth.result.out)).toMatchSnapshot();
          });
        },
      );
    },
  );

  given('[case64] a repo that does not run itself in its prepare hook', () => {
    const scene = useBeforeAll(async () => genScene({}));

    when('[t0] apply runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
          live: ['mechanic', 'foreman'],
          // a build that would leave a marker, so a build that ran is seen
          buildCmd: 'touch .build-ran',
        }),
      );

      then('no build runs, and the move finishes as it did', () => {
        expect(result.code).toEqual(0);
        expect(result.out).not.toContain('built first');
        expect(existsSync(join(scene.treeOf('local'), '.build-ran'))).toEqual(
          false,
        );
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given(
    '[case65] a resume: the first apply stopped at the role links, with the install logged done and no dist',
    () => {
      const scene = useBeforeAll(async () => genScene({ selfBuilt: true }));

      when(
        '[t0] the first apply runs with a build that makes no dist, so the links fail',
        () => {
          const first = useBeforeAll(async () =>
            scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
              live: ['mechanic', 'foreman'],
              installCmd: INSTALL_PREPARE_NEEDS_DIST,
              buildCmd: 'true',
              linkNeedsDist: true,
            }),
          );

          then('the links fail, and the ledger does not flip', () => {
            expect(first.code).toEqual(1);
            expect(first.out).toContain(
              'the role link(s) did not stand at the destination',
            );
            expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
          });

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(first.out)).toMatchSnapshot();
          });
        },
      );

      when('[t1] apply runs again with a build that makes the dist', () => {
        const again = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['mechanic', 'foreman'],
            installCmd: INSTALL_PREPARE_NEEDS_DIST,
            buildCmd: BUILD_MAKES_DIST,
            linkNeedsDist: true,
          }),
        );

        then(
          'the resume builds too, runs the install again, links the roles, and flips the ledger',
          () => {
            expect(again.code).toEqual(0);
            expect(again.out).toContain(
              'built first, so the install and the role links find it',
            );
            expect(
              existsSync(
                join(
                  scene.treeOf('local'),
                  'dist',
                  'contract',
                  'cli',
                  'invoke.js',
                ),
              ),
            ).toEqual(true);
            assertRoleLinksCarried(scene);
            expect(scene.getLedgerGrove()).toEqual('local');
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(again.out)).toMatchSnapshot();
        });
      });
    },
  );

  // ── a partial dist dir left by a cut build: the dir stands, the file the bin requires does not ──────────
  // .what = 2026-11-21, rhachet.beav.fix-init-refuses-ambient-claude-link moved to a cloud grove:
  //         the live apply's step 4 printed only "installed by the prior apply" with no build line, then the role
  //         links failed with MODULE_NOT_FOUND for ../dist/contract/cli/invoke. a prior cut build had `mkdir -p dist`
  //         before it crashed, so the dist DIR stood with no dist/contract/cli/invoke.js inside it, and the needs-build
  //         guard once read the bare dir alone as proof of a build: it saw the dir, called the tree already built, and
  //         never built it again on the resume. the fix: the guard reads for the file the bin requires, not the dir
  //         that may merely stand over it
  const BUILD_MAKES_ONLY_DIST = 'mkdir -p dist';

  given(
    '[case66] a resume: a prior build made the dist dir, then crashed before it wrote the file the bin requires',
    () => {
      const scene = useBeforeAll(async () => genScene({ selfBuilt: true }));

      when(
        '[t0] the first apply builds only the dist dir, so the links fail, and the install is logged done',
        () => {
          const first = useBeforeAll(async () =>
            scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
              live: ['mechanic', 'foreman'],
              buildCmd: BUILD_MAKES_ONLY_DIST,
              linkNeedsDist: true,
            }),
          );

          then(
            'the links fail on the absent file, and the ledger does not flip',
            () => {
              expect(first.code).toEqual(1);
              expect(first.out).toContain(
                'the role link(s) did not stand at the destination',
              );
              expect(existsSync(join(scene.treeOf('local'), 'dist'))).toEqual(
                true,
              );
              expect(
                existsSync(
                  join(
                    scene.treeOf('local'),
                    'dist',
                    'contract',
                    'cli',
                    'invoke.js',
                  ),
                ),
              ).toEqual(false);
              expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
            },
          );

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(first.out)).toMatchSnapshot();
          });
        },
      );

      when(
        '[t1] a copy of the operations that still guards by the dist DIRECTORY resumes the apply',
        () => {
          const teeth = useBeforeAll(async () => {
            const pathOperations = genCutCopy({
              slug: 'crew-move-teeth-partial-dist',
              from: '[ ! -f "$d/dist/.build.stamp" ] || return 1',
              into: '[ ! -d "$d/dist" ] || return 1',
            });
            return scene.run(
              ['--tree', TREE, '--to', 'local', '--mode', 'apply'],
              {
                pathOperations,
                live: ['mechanic', 'foreman'],
                buildCmd: BUILD_MAKES_DIST,
                linkNeedsDist: true,
              },
            );
          });

          then(
            'the dir-only guard goes RED: it reads the leftover dir as already built, skips the build, and the links fail again',
            () => {
              expect(teeth.code).toEqual(1);
              expect(teeth.out).toContain('installed by the prior apply');
              expect(teeth.out).not.toContain('built first');
              expect(teeth.out).toContain(
                'the role link(s) did not stand at the destination',
              );
              expect(
                existsSync(
                  join(
                    scene.treeOf('local'),
                    'dist',
                    'contract',
                    'cli',
                    'invoke.js',
                  ),
                ),
              ).toEqual(false);
              expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
            },
          );

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(teeth.out)).toMatchSnapshot();
          });
        },
      );

      when(
        '[t2] the real operations (the fixed guard) resumes the same apply',
        () => {
          const again = useBeforeAll(async () =>
            scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
              live: ['mechanic', 'foreman'],
              buildCmd: BUILD_MAKES_DIST,
              linkNeedsDist: true,
            }),
          );

          then(
            'the fixed guard goes GREEN: the leftover dir is no proof of a build, so it builds again, links, and flips the ledger',
            () => {
              expect(again.code).toEqual(0);
              expect(again.out).toContain(
                'built first, so the install and the role links find it',
              );
              expect(
                existsSync(
                  join(
                    scene.treeOf('local'),
                    'dist',
                    'contract',
                    'cli',
                    'invoke.js',
                  ),
                ),
              ).toEqual(true);
              assertRoleLinksCarried(scene);
              expect(scene.getLedgerGrove()).toEqual('local');
            },
          );

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(again.out)).toMatchSnapshot();
          });
        },
      );
    },
  );

  // ── the real package.json shape: "prepare" never names "bin/" directly ──────────────────────────────
  // .what = 2026-11-21, rhachet.beav.fix-init-refuses-ambient-claude-link, moved to a cloud grove,
  //         a second time over: the live apply's step 4 printed only "installed by the prior apply" with no build
  //         line, then MODULE_NOT_FOUND ../dist/contract/cli/invoke for every role link. ehmpathy/rhachet's own
  //         "prepare" (read off its real package.json) is `if [ -e .git ] && [ -z $CI ]; then npm run prepare:husky
  //         && npm run prepare:rhachet; fi` — it never names "bin/" in its own text; it reaches its own bin only
  //         through the package's "bin" field, several "npm run" calls removed. the old guard's match on the
  //         "prepare" command's own text for "bin/" never fired on the real repo, so the build was skipped on
  //         every apply and every resume alike, and two failed resumes left the move log exactly as the live run
  //         showed it: "begin up carry conversations install resume up carry conversations", and the next apply
  //         read "links" as the step to resume at
  given(
    '[case67] the real package.json shape: two failed resumes leave the log at "...install resume up carry conversations"',
    () => {
      const scene = useBeforeAll(async () => genScene({ selfBuilt: true }));
      const oldPrepareTell = genCutCopy({
        slug: 'crew-move-teeth-prepare-tell',
        from: '  grep -qE \'"prepare"[[:space:]]*:[[:space:]]*"[^"]+"\' "$d/package.json" || return 1\n  grep -qE \'"bin"[[:space:]]*:[[:space:]]*\\{\' "$d/package.json"',
        into: '  grep -qE \'"prepare"[[:space:]]*:.*bin/\' "$d/package.json"',
      });

      when(
        '[t0] the first apply runs against the old prepare-text guard, on the real package.json shape',
        () => {
          const first = useBeforeAll(async () =>
            scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
              pathOperations: oldPrepareTell,
              live: ['mechanic', 'foreman'],
              buildCmd: BUILD_MAKES_DIST,
              installCmd: INSTALL_PREPARE_NEEDS_DIST,
              linkNeedsDist: true,
            }),
          );

          then(
            'the guard never fires: no build, the install runs for real, and the links fail',
            () => {
              expect(first.code).toEqual(1);
              expect(first.out).not.toContain('built first');
              expect(first.out).toContain(
                'the role link(s) did not stand at the destination',
              );
              expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
            },
          );

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(first.out)).toMatchSnapshot();
          });
        },
      );

      when(
        '[t1] the same old guard resumes the same apply a second time',
        () => {
          const second = useBeforeAll(async () =>
            scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
              pathOperations: oldPrepareTell,
              live: ['mechanic', 'foreman'],
              buildCmd: BUILD_MAKES_DIST,
              installCmd: INSTALL_PREPARE_NEEDS_DIST,
              linkNeedsDist: true,
            }),
          );

          then(
            'RED: the log now reads the exact state the live apply showed, and the links fail the same way again',
            () => {
              expect(second.code).toEqual(1);
              expect(second.out).not.toContain('built first');
              expect(second.out).toContain('installed by the prior apply');
              expect(second.out).toContain(
                'the role link(s) did not stand at the destination',
              );
              expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
            },
          );

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(second.out)).toMatchSnapshot();
          });
        },
      );

      when('[t2] plan runs over that exact log state', () => {
        const plan = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local'], {
            pathOperations: oldPrepareTell,
            live: ['mechanic', 'foreman'],
          }),
        );

        then('it names the log exactly as the live apply printed it', () => {
          expect(plan.out).toContain(
            'the move log holds: begin up carry conversations install resume up carry conversations; apply resumes at: links',
          );
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(plan.out)).toMatchSnapshot();
        });
      });

      when(
        '[t3] the real operations (the fixed guard) resumes the same log',
        () => {
          const third = useBeforeAll(async () =>
            scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
              live: ['mechanic', 'foreman'],
              buildCmd: BUILD_MAKES_DIST,
              installCmd: INSTALL_PREPARE_NEEDS_DIST,
              linkNeedsDist: true,
            }),
          );

          then(
            'GREEN: the bin-field tell fires, the build runs, the install runs again, the links stand, and the ledger flips',
            () => {
              expect(third.code).toEqual(0);
              expect(third.out).toContain(
                'built first, so the install and the role links find it',
              );
              expect(
                existsSync(join(scene.treeOf('local'), 'dist', '.build.stamp')),
              ).toEqual(true);
              assertRoleLinksCarried(scene);
              expect(scene.getLedgerGrove()).toEqual('local');
            },
          );

          then('the render matches the snapshot', () => {
            expect(scene.getMasked(third.out)).toMatchSnapshot();
          });
        },
      );
    },
  );

  /**
   * .what = a plan whose source or destination does not answer judges naught
   * .why  = vision case=5 [t1], [t1b]: a move that cannot read both ends must
   *         not guess. the fix it names must be the grove cure, never a laptop verb
   */
  given('[case70] a plan with one end off the tailnet', () => {
    const scene = useBeforeAll(async () => genScene({ unpushed: true }));

    when('[t0] the destination does not answer', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'cloud://grove-b'], {
          sshDown: 'grove-b',
        }),
      );

      then('it exits 1 and says naught was judged, by the destination', () => {
        expect(result.code).toEqual(1);
        expect(result.out).toContain(
          '💥 MalfunctionError: the destination cloud://grove-b did not answer',
        );
        expect(result.out).toContain('so naught was judged');
      });

      then('it names the grove cure, then a re-run', () => {
        expect(result.out).toMatch(/fix: .+; then run this again/);
      });

      then(
        '🔴 it quotes the transport own last words, so the cause is named',
        () => {
          expect(result.out).toContain(
            'did not answer (exit 255 — said: ssh: connect to host grove-b port 22: No route to host)',
          );
        },
      );

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t1] the source does not answer', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'cloud://grove-b'], {
          sshDown: 'grove-a',
        }),
      );

      then('it exits 1 and says naught was judged, by the source', () => {
        expect(result.code).toEqual(1);
        expect(result.out).toContain(
          '💥 MalfunctionError: the source cloud://grove-a did not answer',
        );
        expect(result.out).toContain('so naught was judged');
      });

      then('it names the grove cure, then a re-run', () => {
        expect(result.out).toMatch(/fix: .+; then run this again/);
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    /**
     * .what = the destination is dialed by the REAL ssh client, with the argv the move builds
     * .why  = every other cell runs the transport through the fake; this one proves the real client's own
     *         failure reaches the operator as the same verdict. a `.invalid` name (rfc 6761) never names a
     *         box, so ssh fails at once, with no fleet in reach (rule.require.hermetic-tests)
     */
    when(
      '[t1r] the destination is dialed by the real ssh, and names no box',
      () => {
        const GROVE_NONE = 'grove-sandpine-v20261023.invalid';
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', `cloud://${GROVE_NONE}`], {
            sshReal: GROVE_NONE,
          }),
        );

        then(
          'it exits 1 and says naught was judged, by the destination',
          () => {
            expect(result.code).toEqual(1);
            expect(result.out).toContain(
              `💥 MalfunctionError: the destination cloud://${GROVE_NONE} did not answer`,
            );
            expect(result.out).toContain('so naught was judged');
          },
        );

        then('the cause is the real client own words', () => {
          expect(result.out).toMatch(
            /ssh: Could not \S+ hostname grove-sandpine-v20261023\.invalid/,
          );
        });

        then(
          'the render matches the snapshot, the resolver words masked',
          () => {
            // .why = the resolver's tail ("Name or service not known", "Temporary failure ...") is the host's, not ours
            expect(
              scene
                .getMasked(result.out)
                .replace(
                  /(ssh: Could not \S+ hostname \S+?):[^)\n]*/g,
                  '$1: $RESOLVER',
                ),
            ).toMatchSnapshot();
          },
        );
      },
    );

    when('[t2] both ends answer again', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'cloud://grove-b']),
      );

      then(
        'the same plan judges and exits 0: naught was written by the misses',
        () => {
          expect(result.code).toEqual(0);
        },
      );

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given('[case71] a source seat whose read gets no answer', () => {
    const scene = useBeforeAll(async () => genScene({}));

    when('[t0] plan runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local'], { readFails: 'mechanic' }),
      );

      then('it refuses: an unread seat is never judged idle', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain(
          'seat mechanic could not be read at the source, so it cannot be judged idle',
        );
        expect(result.out).toContain(
          `rhx git.crew.read --tree ${TREE} --who mechanic`,
        );
      });

      then('the unread refusal render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t1] the seat duct is truly absent', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local']),
      );

      then('it reads the seat as down, and plans the move', () => {
        expect(result.code).toEqual(0);
        expect(result.out).not.toContain('could not be read at the source');
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given(
    '[case72] an apply whose resumed seat does not answer after its boot',
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when('[t0] apply runs', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
            live: ['foreman'],
            unread: ['mechanic'],
          }),
        );

        then('it exits 1 and names the seat unread, never a bare shell', () => {
          expect(result.code).toEqual(1);
          expect(result.out).toContain(
            'mechanic: local did not answer, so the seat is unread',
          );
          expect(result.out).not.toContain('left as a bare shell');
        });

        then('it names verify as the cure, once the grove answers', () => {
          expect(result.out).toContain(
            `1 seat(s) unread at local. the tree and the ledger moved; read them once it answers: rhx git.crew.move --tree ${TREE} --to local --from cloud://grove-a --mode verify`,
          );
          expect(scene.getLedgerGrove()).toEqual('local');
        });

        then('the unread apply render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case73] another apply of the same tree holds the move lock', () => {
    const scene = useBeforeAll(async () => genScene({}));

    when('[t0] apply runs', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local', '--mode', 'apply'], {
          live: ['mechanic', 'foreman'],
          lockHeld: true,
        }),
      );

      then('it refuses at once, judges naught, and moves naught', () => {
        expect(result.code).toEqual(2);
        expect(result.out).toContain(
          `✋ ConstraintError: another apply of ${TREE} holds the move lock, so this one judges naught`,
        );
        expect(result.out).toContain('fix: wait for it to finish');
        expect(result.calls).toEqual([]);
        expect(scene.getLedgerGrove()).toEqual('cloud://grove-a');
      });

      then('the lock refusal render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });

    when('[t1] the plan runs while the lock is held', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', TREE, '--to', 'local'], { lockHeld: true }),
      );

      then('a plan takes no lock, so it still reads and judges', () => {
        expect(result.code).toEqual(0);
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(result.out)).toMatchSnapshot();
      });
    });
  });

  given('[case74] --tree names no bare slug', () => {
    const scene = useBeforeAll(async () => genScene({}));

    when('[t0] the slug holds a path', () => {
      const result = useBeforeAll(async () =>
        scene.run(['--tree', 'sandpine/svc-lessons', '--to', 'local']),
      );

      then(
        'it names the value, the allowed shape, and where slugs are listed',
        () => {
          expect(result.code).toEqual(2);
          expect(scene.getMasked(result.out)).toMatchSnapshot();
          expect(result.out).toContain(
            "--tree 'sandpine/svc-lessons' is no bare tree slug",
          );
          expect(result.out).toContain('fix: rhx git.crew.list');
        },
      );
    });
  });

  given(
    '[case75] the source grove named by --from, past the ledger row',
    () => {
      const scene = useBeforeAll(async () => genScene({}));

      when('[t0] plan runs with --from as a bare grove name', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--from', 'grove-a']),
        );

        then(
          'it exits 0 and names the flag as the source of the source',
          () => {
            expect(result.code).toEqual(0);
            expect(result.out).toContain(
              'from: cloud://grove-a — from the --from flag',
            );
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when('[t1] --from holds no grove name', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--from', 'grove a/b']),
        );

        then('it exits 2, names the value, and the shapes it takes', () => {
          expect(result.code).toEqual(2);
          expect(result.out).toContain(
            "✋ ConstraintError: --from 'grove a/b' is neither local nor a grove name",
          );
          expect(result.out).toContain(
            'fix: --from local | cloud://<grove> | <grove>',
          );
          expect(result.calls).toEqual([]);
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });

      when('[t2] --from names the same grove as --to', () => {
        const result = useBeforeAll(async () =>
          scene.run(['--tree', TREE, '--to', 'local', '--from', 'local']),
        );

        then('it exits 2: the tree is there already, said by the flag', () => {
          expect(result.code).toEqual(2);
          expect(result.out).toContain(
            `${TREE} is on local already (--from and --to both name local)`,
          );
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(result.out)).toMatchSnapshot();
        });
      });
    },
  );
});
