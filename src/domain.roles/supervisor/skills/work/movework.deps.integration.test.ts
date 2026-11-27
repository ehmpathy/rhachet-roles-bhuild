/**
 * .what = clamp: every function movework calls is defined once its libs are sourced
 *
 * .why  = movework was promoted from a pioneer whose libs held more than bhuild's.
 *         bash binds a name at call time, so a call to a function no lib defines
 *         passes every parse and every source, and fails only on the code path that
 *         reaches it — mid-move, at a box, after bytes are carried. this reads the
 *         set the source defines and holds every called name to it
 */
import { spawnSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

const PATH_MOVEWORK = join(__dirname, 'movework.sh');
const PATH_VERB = join(__dirname, '../git.crew.move.sh');
const DIR_ROLES = join(__dirname, '../../..');

/**
 * .what = verbs a move hint may name that a peer package ships, each with its home
 * .why  = a peer verb is real to the caller (an enrolled role), but no file here proves it
 */
const VERBS_OF_PEERS = new Set([
  'git.commit.uses', // ehmpathy/mechanic: the commit quota a human grants
]);

/**
 * .what = the names a shell text calls that look like this repo's functions:
 *         `__<name>` and the verb families `crew.*` / `duct.*` / `term.*` / `grove.*`
 * .note = comment lines and `rhx <verb>` names are skipped; any other name inside a string still counts, since a
 *         string that names a function is how the box half ships its procedures
 */
const getAllCalledNames = (input: { text: string }): string[] => {
  const pattern =
    /(?:^|[\s;|&($`"'])(__[A-Za-z0-9_]+|(?:crew|duct|term|grove)\.[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*)\b/g;
  const names = input.text
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    // a name behind `rhx` is a verb a caller runs, never a function; case2 holds those
    .map((line) => line.replace(/\brhx [a-z][a-z0-9]*(?:\.[a-z0-9]+)+/g, ''))
    .flatMap((line) => [...line.matchAll(pattern)].map((m) => m[1] ?? ''));
  // a name that ends in `_` is a prefix the runner globs on (`__mvbox_`), never a call
  return [...new Set(names)]
    .filter((name) => name !== '' && !name.endsWith('_'))
    .sort();
};

/** .what = the names a text assigns as variables, so a `__mv_from=` is no call */
const getAllVarNames = (input: { text: string }): Set<string> =>
  new Set(
    [
      ...input.text.matchAll(
        /(?:^|[\s;])(?:local\s+|declare\s+-?\w*\s+)?(__[A-Za-z0-9_]+)(?:=|\[)/g,
      ),
      ...input.text.matchAll(/local\s+(?:-\w+\s+)?([^=\n;]+)/g),
    ].flatMap((m) => (m[1] ?? '').split(/\s+/)),
  );

describe('movework.deps', () => {
  given('[case1] the verb and its operations, as the verb sources them', () => {
    const scene = useBeforeAll(async () => {
      const run = spawnSync(
        'bash',
        [
          '-c',
          `source '${PATH_VERB.replace(/git\.crew\.move\.sh$/, 'work/crewwork.sh')}' >/dev/null 2>&1 || exit 9
__crew_move_lib_ready=1
source '${PATH_MOVEWORK}' >/dev/null 2>&1 || exit 8
declare -F`,
        ],
        { encoding: 'utf8' },
      );
      const defined = new Set(
        run.stdout
          .split('\n')
          .map((line) => line.replace(/^declare -f\s+/, '').trim()),
      );
      const text = [PATH_MOVEWORK, PATH_VERB]
        .map((path) => readFileSync(path, 'utf8'))
        .join('\n');
      const vars = getAllVarNames({ text });
      const called = getAllCalledNames({ text }).filter(
        (name) => !vars.has(name),
      );
      return { run, defined, called };
    });

    when('[t0] the libs are sourced', () => {
      then('they source clean', () => {
        expect(scene.run.status).toEqual(0);
      });

      then('every function movework calls is defined', () => {
        const absent = scene.called.filter((name) => !scene.defined.has(name));
        expect(absent).toEqual([]);
      });
    });
  });

  /**
   * .what = every `rhx <verb>` a move hint names is a verb a caller can run
   * .why  = the pioneer's hints named two laptop-only verbs. a fix line a caller
   *         cannot run is worse than none, and no parse or source sees it
   */
  given('[case2] the verbs the move names in its hints', () => {
    const scene = useBeforeAll(async () => {
      const text = [PATH_MOVEWORK, PATH_VERB]
        .map((path) => readFileSync(path, 'utf8'))
        .join('\n');
      const named = [
        ...new Set(
          [...text.matchAll(/\brhx ([a-z][a-z0-9]*(?:\.[a-z0-9]+)+)/g)].map(
            (m) => m[1] ?? '',
          ),
        ),
      ].sort();
      const shipped = new Set(
        readdirSync(DIR_ROLES).flatMap((role) => {
          const dir = join(DIR_ROLES, role, 'skills');
          return existsSync(dir)
            ? readdirSync(dir)
                .filter((f) => f.endsWith('.sh'))
                .map((f) => f.replace(/\.sh$/, ''))
            : [];
        }),
      );
      return { named, shipped };
    });

    when('[t0] each named verb is looked up', () => {
      then('the subject is not empty', () => {
        expect(scene.named).toContain('git.crew.move'); // ANTI-VACUITY
      });

      then('each is a verb this package ships, or a named peer verb', () => {
        const dead = scene.named.filter(
          (name) => !scene.shipped.has(name) && !VERBS_OF_PEERS.has(name),
        );
        expect(dead).toEqual([]);
      });
    });
  });

  /**
   * .what = a box hint is the bare command at home, and git.grove.send on a grove
   * .why  = the fix line a refusal prints must run where the caller stands
   */
  given('[case3] the box hints', () => {
    const scene = useBeforeAll(async () => {
      const run = spawnSync(
        'bash',
        [
          '-c',
          `source '${PATH_VERB.replace(/git\.crew\.move\.sh$/, 'work/crewwork.sh')}' >/dev/null 2>&1 || exit 9
source '${PATH_MOVEWORK}' >/dev/null 2>&1 || exit 8
echo "LOCAL=$(__crew_move_tree_hint local svc-lessons.beav.feat-x)"
echo "CLOUD=$(__crew_move_tree_hint cloud://grove-b svc-lessons.beav.feat-x)"`,
        ],
        { encoding: 'utf8' },
      );
      return { run };
    });

    when('[t0] each end is hinted', () => {
      then('the local hint is the bare command', () => {
        expect(scene.run.stdout).toContain(
          'LOCAL=cd ~/git/*/_worktrees/svc-lessons.beav.feat-x && git status --short --branch',
        );
      });

      then('the grove hint rides git.grove.send', () => {
        expect(scene.run.stdout).toContain(
          "CLOUD=rhx git.grove.send grove-b --what 'cd ~/git/*/_worktrees/svc-lessons.beav.feat-x && git status --short --branch'",
        );
      });

      then('the hints match the snapshot', () => {
        expect(scene.run.stdout).toMatchSnapshot();
      });
    });
  });
});
