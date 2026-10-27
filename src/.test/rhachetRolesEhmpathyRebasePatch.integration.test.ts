/**
 * .what = clamps on `git.branch.rebase --unstaged ignore`, which this repo adds to
 *         rhachet-roles-ehmpathy via patches/rhachet-roles-ehmpathy@1.39.7.patch
 *         until ehmpathy/rhachet-roles-ehmpathy#1189 ships it
 *
 * .why  = a clone tree always holds two unstaged ambient settings files (a symlink
 *         and a file) that must stay out of every commit. the rebase skill refused
 *         any unstaged path, and the seat deny list forbids `git checkout`, `ln`,
 *         and `git stash`, so a clone could not rebase a conflicted pr at all
 *
 * .note = each case drives the installed skill against a temp repo with a bare
 *         origin, so the rebase, the fetch, and the hold are all real
 */
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

const SKILL_DIR = join(
  dirname(require.resolve('rhachet-roles-ehmpathy/package.json')),
  'dist/domain.roles/mechanic/skills/git.branch.rebase',
);

const ENV_GIT = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Test Human',
  GIT_AUTHOR_EMAIL: 'human@test.com',
  GIT_COMMITTER_NAME: 'Test Human',
  GIT_COMMITTER_EMAIL: 'human@test.com',
};

const LINK_HEAD = '/tmp/surf-forecast.head.json';
const LINK_LOCAL = '/tmp/surf-forecast.local.json';
const FILE_HEAD = '{ "spot": "trestles" }\n';
const FILE_LOCAL = '{ "spot": "pipeline" }\n';

/**
 * .what = run git in a dir; return its trimmed stdout
 */
const git = (input: { cwd: string; args: string[] }): string =>
  execFileSync('git', input.args, { cwd: input.cwd, env: ENV_GIT })
    .toString()
    .trim();

/**
 * .what = run one git.branch.rebase subskill in a dir; return its exit and streams
 */
const runRebaseSkill = (input: {
  cwd: string;
  skill: 'begin' | 'continue' | 'abort';
  args: string[];
}) => {
  const result = spawnSync(
    'bash',
    [join(SKILL_DIR, `git.branch.rebase.${input.skill}.sh`), ...input.args],
    { cwd: input.cwd, env: ENV_GIT, timeout: 60_000 },
  );
  return {
    status: result.status,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
};

/**
 * .what = a feature branch one commit behind origin/main, with an unstaged
 *         file and an unstaged symlink, as a clone tree holds them
 * .why  = conflict=true makes main and the branch edit one line both ways
 */
const genScene = (input: { slug: string; conflict: boolean }) => {
  const base = genTempDir({ slug: input.slug });
  const origin = join(base, 'origin.git');
  const work = join(base, 'work');
  const peer = join(base, 'peer');

  // an origin with one base commit on main
  git({ cwd: base, args: ['init', '--bare', '-b', 'main', origin] });
  git({ cwd: base, args: ['clone', origin, work] });
  writeFileSync(join(work, 'settings.json'), FILE_HEAD);
  symlinkSync(LINK_HEAD, join(work, 'grove.json'));
  writeFileSync(join(work, 'lesson.txt'), 'book a lesson at dawn\n');
  git({ cwd: work, args: ['add', '.'] });
  git({ cwd: work, args: ['commit', '-m', 'base'] });
  git({ cwd: work, args: ['push', 'origin', 'main'] });

  // the feature branch, one commit ahead
  git({ cwd: work, args: ['checkout', '-b', 'feat'] });
  writeFileSync(join(work, 'feat.txt'), 'book a board too\n');
  if (input.conflict)
    writeFileSync(join(work, 'lesson.txt'), 'book a lesson at noon\n');
  git({ cwd: work, args: ['add', '.'] });
  git({ cwd: work, args: ['commit', '-m', 'feat'] });

  // main moves on, from a peer clone
  git({ cwd: base, args: ['clone', origin, peer] });
  writeFileSync(join(peer, 'main.txt'), 'wetsuit sizes\n');
  if (input.conflict)
    writeFileSync(join(peer, 'lesson.txt'), 'book a lesson at dusk\n');
  git({ cwd: peer, args: ['add', '.'] });
  git({ cwd: peer, args: ['commit', '-m', 'main'] });
  git({ cwd: peer, args: ['push', 'origin', 'main'] });

  // the meter the skill reads (untracked, so never an unstaged path)
  mkdirSync(join(work, '.meter'));
  writeFileSync(
    join(work, '.meter/git.commit.uses.jsonc'),
    JSON.stringify({ uses: 3, push: 'allow' }),
  );

  // the two unstaged ambient paths
  writeFileSync(join(work, 'settings.json'), FILE_LOCAL);
  rmSync(join(work, 'grove.json'));
  symlinkSync(LINK_LOCAL, join(work, 'grove.json'));

  return { work };
};

/**
 * .what = read back what a clone holds at the two ambient paths
 */
const getAmbient = (input: { work: string }) => ({
  file: readFileSync(join(input.work, 'settings.json'), 'utf8'),
  link: readlinkSync(join(input.work, 'grove.json')),
  unstaged: git({ cwd: input.work, args: ['diff', '--name-only'] }),
});

describe('rhachet-roles-ehmpathy patch: git.branch.rebase --unstaged ignore', () => {
  given('[case1] a branch behind main, with an unstaged file and symlink', () => {
    when('[t0] begin --mode apply runs with no --unstaged flag', () => {
      const result = useThen('the skill exits', async () => {
        const scene = genScene({ slug: 'rebase-unstaged-refuse', conflict: false });
        const run = runRebaseSkill({
          cwd: scene.work,
          skill: 'begin',
          args: ['--mode', 'apply'],
        });
        return { run, ambient: getAmbient(scene), work: scene.work };
      });

      then('🔴 it refuses as a constraint', () => {
        expect(result.run.status).toEqual(2);
        expect(result.run.stdout).toContain('error: unstaged changes found');
      });

      then('🔴 the refusal names each path and the flag that cures it', () => {
        expect(result.run.stdout).toContain('settings.json');
        expect(result.run.stdout).toContain('grove.json');
        expect(result.run.stdout).toContain(
          'rhx git.branch.rebase begin --mode apply --unstaged ignore',
        );
      });

      then('the tree is untouched: no rebase, both paths as they were', () => {
        expect(existsSync(join(result.work, 'main.txt'))).toEqual(false);
        expect(result.ambient.file).toEqual(FILE_LOCAL);
        expect(result.ambient.link).toEqual(LINK_LOCAL);
      });
    });
  });

  given('[case2] a branch behind main, with an unstaged file and symlink', () => {
    when('[t0] begin --mode apply --unstaged ignore runs', () => {
      const result = useThen('the skill exits', async () => {
        const scene = genScene({ slug: 'rebase-unstaged-ignore', conflict: false });
        const run = runRebaseSkill({
          cwd: scene.work,
          skill: 'begin',
          args: ['--mode', 'apply', '--unstaged', 'ignore'],
        });
        return { run, ambient: getAmbient(scene), work: scene.work };
      });

      then('🔴 the rebase lands on origin/main', () => {
        expect(result.run.status).toEqual(0);
        expect(result.run.stdout).toContain('status: clean');
        expect(existsSync(join(result.work, 'main.txt'))).toEqual(true);
        expect(existsSync(join(result.work, 'feat.txt'))).toEqual(true);
      });

      then('🔴 each held path is put back: byte for byte, link for link', () => {
        expect(result.ambient.file).toEqual(FILE_LOCAL);
        expect(result.ambient.link).toEqual(LINK_LOCAL);
        expect(result.ambient.unstaged).toEqual(
          ['grove.json', 'settings.json'].join('\n'),
        );
      });

      then('the output names what it put back', () => {
        expect(result.run.stdout).toContain('unstaged: put back as they were');
      });
    });
  });

  given('[case3] a branch whose commit conflicts with main, with unstaged paths held', () => {
    when('[t0] begin halts on the conflict, then abort runs', () => {
      const result = useThen('both skills exit', async () => {
        const scene = genScene({ slug: 'rebase-unstaged-abort', conflict: true });
        const begin = runRebaseSkill({
          cwd: scene.work,
          skill: 'begin',
          args: ['--mode', 'apply', '--unstaged', 'ignore'],
        });
        const ambientHalted = {
          file: readFileSync(join(scene.work, 'settings.json'), 'utf8'),
          link: readlinkSync(join(scene.work, 'grove.json')),
        };
        const abort = runRebaseSkill({ cwd: scene.work, skill: 'abort', args: [] });
        return { begin, ambientHalted, abort, ambient: getAmbient(scene) };
      });

      then('begin halts on the conflict and says the paths are held', () => {
        expect(result.begin.status).toEqual(1);
        expect(result.begin.stdout).toContain('status: conflict');
        expect(result.begin.stdout).toContain(
          'unstaged: held aside; put back at continue or abort',
        );
      });

      then('while halted, both paths read as HEAD holds them', () => {
        expect(result.ambientHalted.file).toEqual(FILE_HEAD);
        expect(result.ambientHalted.link).toEqual(LINK_HEAD);
      });

      then('🔴 abort puts each held path back as it was', () => {
        expect(result.abort.status).toEqual(0);
        expect(result.ambient.file).toEqual(FILE_LOCAL);
        expect(result.ambient.link).toEqual(LINK_LOCAL);
      });
    });
  });

  given('[case4] a branch whose commit conflicts with main, with unstaged paths held', () => {
    when('[t0] begin halts, the conflict is settled, then continue runs', () => {
      const result = useThen('both skills exit', async () => {
        const scene = genScene({ slug: 'rebase-unstaged-continue', conflict: true });
        runRebaseSkill({
          cwd: scene.work,
          skill: 'begin',
          args: ['--mode', 'apply', '--unstaged', 'ignore'],
        });

        // settle the conflict as a driver would
        writeFileSync(join(scene.work, 'lesson.txt'), 'book a lesson at noon\n');
        git({ cwd: scene.work, args: ['add', 'lesson.txt'] });

        const resume = runRebaseSkill({ cwd: scene.work, skill: 'continue', args: [] });
        return { resume, ambient: getAmbient(scene), work: scene.work };
      });

      then('the rebase completes onto origin/main', () => {
        expect(result.resume.status).toEqual(0);
        expect(result.resume.stdout).toContain('status: complete');
        expect(existsSync(join(result.work, 'main.txt'))).toEqual(true);
      });

      then('🔴 continue puts each held path back as it was', () => {
        expect(result.ambient.file).toEqual(FILE_LOCAL);
        expect(result.ambient.link).toEqual(LINK_LOCAL);
        expect(result.ambient.unstaged).toEqual(
          ['grove.json', 'settings.json'].join('\n'),
        );
      });
    });
  });
});
