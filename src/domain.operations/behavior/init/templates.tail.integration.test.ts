import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { ConstraintError, MalfunctionError } from 'helpful-errors';
import path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { getAllFilesRecursive } from '../../../.test/utils/getAllFilesRecursive';
import { asFlagsParsedFromCliText } from './.test/asFlagsParsedFromCliText';
import { asFlagsParsedFromShellText } from './.test/asFlagsParsedFromShellText';
import { asRhxCallsFromTemplateText } from './.test/asRhxCallsFromTemplateText';

/**
 * .what = the clamp on the text of the ship tail: 6.preship and 7.reflect, and the one push point
 * .why  = the tail's rules live only as prose a driver reads. no other test sees them, so a
 *         template edit that drops "never --apply", restores a halt, or bakes in a clock would
 *         ship silent. each assertion names the cell or fulcrum it holds.
 *
 * .note = reads the source templates directly (init copies them verbatim, save for
 *         $BEHAVIOR_DIR_REL), so this needs no route and no driver
 */
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..');

const TAIL_NAMES = [
  '6.preship.stone',
  '6.preship.guard',
  '7.reflect.stone',
  '7.reflect.guard',
] as const;

const BRAIN_BUILD = 'claude-sonnet-5-5[1m]';
const BRAIN_DESIGN = 'claude-opus-5-5[1m]';

/**
 * .what = a clock value or a time zone, as a template might bake one in
 * .why  = the director ruled the open-hours clock out of every template (F3)
 */
const PATTERN_CLOCK =
  /\b\d{1,2}:\d{2}\b|\b\d{1,2}\s?(am|pm)\b|\b\d{1,2}h\b|\b(CT|ET|PT|UTC|EOD)\b|\bend of day\b/i;

/**
 * .what = a template line that asks the driver to commit or push
 * .why  = the one push point of a route is 6.preship; any other is an early push (case3)
 */
const PATTERN_SHIP_CALL =
  /git\.commit\.set|git\.commit\.push|git\.stage\.add|--push\b|git push|git commit\b/;

/**
 * .what = the non-rhx shell calls a tail file may name, each pre-approved in a consumer's repo
 * .why  = an unpaved call (e.g. `git rev-parse HEAD`) stalls a driver on a permission prompt
 *         (case4). `git commit` and `git push` appear only as forbidden routes around a refusal
 */
const SHELL_CALLS_ALLOWED = [
  'gh pr view --json state,headRefOid',
  'gh api --method GET user --jq .login',
  'git log -1 --format=%H',
  'git status --porcelain',
  'git status --porcelain <dir>',
  'git diff --name-status origin/main...HEAD',
  'git check-ignore',
  'git rm',
  'git commit',
  'git push',
];

/**
 * .what = this factory's own role names, never a consumer's
 * .why  = a shipped template speaks of "the human"; the director and commander are ours (case4)
 */
const PATTERN_FACTORY_TERM = /\b(director|commander)\b/i;

/**
 * .what = the stones that may commit before 6.preship: the two approval waits
 * .why  = each commits its yield so a human reviews it off the box (case3); only a repo a human
 *         opted in pushes it, so a repo with private data never pushes before the finish
 */
const CHECKPOINT_NAMES = ['1.vision.stone', '3.3.1.blueprint.product.stone'];

/**
 * .what = the opt-in marker a checkpoint reads, and the one content that lets it push
 * .why  = fail-safe: absent, unreadable, or any other content means commit local (F1)
 */
const CHECKPOINT_MARKER = '.behavior/.checkpoint.jsonc';
const CHECKPOINT_OPT_IN = '`{ "push": "allow" }`';

/**
 * .what = the skill dirs of the roles the tail calls, plus the bhrain driver it runs under
 * .why  = case5 proves each `rhx <skill>` call names a skill that ships, with flags it parses
 */
const SKILL_DIRS = [
  path.join(
    REPO_ROOT,
    'node_modules/rhachet-roles-ehmpathy/dist/domain.roles/mechanic/skills',
  ),
  path.join(
    REPO_ROOT,
    'node_modules/rhachet-roles-bhrain/dist/domain.roles/driver/skills',
  ),
  path.join(REPO_ROOT, 'src/domain.roles/dispatcher/skills'),
  path.join(REPO_ROOT, 'src/domain.roles/dreamer/skills'),
];

/**
 * .what = reads one template that must be present
 * .why  = an absent file throws inside the `then` that reads it, never a vacuous pass
 *         (rule.forbid.failhide)
 */
const getOneTemplateContentRequired = (input: { name: string }): string => {
  const templatePath = path.join(TEMPLATES_DIR, input.name);
  if (!existsSync(templatePath))
    throw new MalfunctionError('tail template absent', {
      name: input.name,
      templatePath,
      hint: 'the four tail templates ship in templates/; was one renamed or removed?',
    });
  return readFileSync(templatePath, 'utf-8');
};

/**
 * .what = the stdout + stderr of one skill run in plan mode, in a given dir
 * .why  = case5 [t1] grades the suite calls the stone names; a spawn error or a hang must fail
 *         loud, never read as "no refusal printed"
 */
const getOneSkillOutputInPlan = (input: {
  skillPath: string;
  cwd: string;
  args: string[];
}): string => {
  const result = spawnSync('bash', [input.skillPath, ...input.args], {
    cwd: input.cwd,
    encoding: 'utf-8',
    timeout: 120_000,
  });
  if (result.error)
    throw new MalfunctionError('skill plan run could not complete', {
      skillPath: input.skillPath,
      args: input.args,
      error: result.error.message,
      hint: 'a timeout means the skill waited on input; check its plan mode',
    });
  return `${result.stdout}\n${result.stderr}`;
};

/**
 * .what = the .sh files a skill text names, by basename, that sit in its own dir
 * .why  = a skill reaches its flag parser through `source "$DIR/x.sh"` or `exec "$DIR/x.sh"`;
 *         only the files it names are its parser, never every neighbor in a shared dir
 */
const asSkillFilesNamed = (input: {
  text: string;
  skillDir: string;
}): string[] =>
  [...new Set(input.text.match(/[\w.=-]+\.sh\b/g) ?? [])]
    .map((name) => path.join(input.skillDir, name))
    .filter((filePath) => existsSync(filePath));

/**
 * .what = the source text of a skill: its own .sh plus every .sh it names, transitively
 * .why  = a dispatcher parses flags in a file it sources (git.release._.get_all_flags…); a
 *         skill may live in a nested dir (git.commit/, claude.tools/), hence the walk to find it
 */
const getOneSkillSource = (input: { skill: string }): string | null => {
  const skillPaths = SKILL_DIRS.filter((dir) => existsSync(dir))
    .flatMap((dir) => getAllFilesRecursive({ dir }))
    .filter((filePath) => path.basename(filePath) === `${input.skill}.sh`);
  if (skillPaths.length > 1)
    throw new MalfunctionError('skill name ships from more than one role', {
      skill: input.skill,
      skillPaths,
      hint: 'grade the call against one role: name the role dir the tail calls',
    });
  const skillPath = skillPaths[0];
  if (!skillPath) return null;
  const skillDir = path.dirname(skillPath);
  const getAllFilesReached = (reached: string[]): string[] => {
    const named = reached.flatMap((filePath) =>
      asSkillFilesNamed({ text: readFileSync(filePath, 'utf-8'), skillDir }),
    );
    const reachedNext = [...new Set([...reached, ...named])];
    return reachedNext.length === reached.length
      ? reached
      : getAllFilesReached(reachedNext);
  };
  return getAllFilesReached([skillPath])
    .map((filePath) => readFileSync(filePath, 'utf-8'))
    .join('\n');
};

/**
 * .what = the source of the node cli a launcher skill dispatches to, via the cli index
 * .why  = a launcher (`exec node -e "… m.cli.x()"`) parses no flag itself. the index maps `x` to
 *         a loader (`x: asLazyCli(() => loadX().cliX)`) and the loader to its file
 *         (`const loadX = (): typeof import('./file') =>`); follow that chain, never guess a name
 */
const getOneCliSourceDispatched = (input: { name: string }): string => {
  const cliDir = path.join(REPO_ROOT, 'src/contract/cli');
  const index = readFileSync(path.join(cliDir, 'index.ts'), 'utf-8');
  const loader = index.match(
    new RegExp(
      `\\b${input.name}: asLazyCli\\(\\(\\) => (\\w+)\\(\\)\\.\\w+\\)`,
    ),
  )?.[1];
  const file = loader
    ? index.match(
        new RegExp(
          `const ${loader} = \\(\\): typeof import\\('\\./([^']+)'\\)`,
        ),
      )?.[1]
    : undefined;
  if (!file)
    throw new MalfunctionError('launcher cli not found in the cli index', {
      name: input.name,
      loader: loader ?? null,
      hint: 'src/contract/cli/index.ts must map m.cli.<name> to a loader that imports its file',
    });
  return readFileSync(path.join(cliDir, `${file}.ts`), 'utf-8');
};

/**
 * .what = the flags a skill parses: its shell case arms, plus the cli schema of any launcher
 * .why  = case5 grades each call flag against a real parser. a flag named only in a header
 *         comment or an echo line is no parse, so the old raw-text match greened a typo
 */
const getAllFlagsParsedBySkill = (input: {
  skill: string;
}): string[] | null => {
  const source = getOneSkillSource({ skill: input.skill });
  if (source === null) return null;
  const cliNames = [...source.matchAll(/m\.cli\.(\w+)\(\)/g)].map(
    (match) => match[1]!,
  );
  return [
    ...asFlagsParsedFromShellText({ text: source }),
    ...cliNames.flatMap((name) =>
      asFlagsParsedFromCliText({ text: getOneCliSourceDispatched({ name }) }),
    ),
  ];
};

/**
 * .what = a text with every run of whitespace collapsed to one space
 * .why  = a pin on stone prose must survive a reflow; `--resnap` cannot repair a `toContain`
 */
const asProseFlat = (input: { text: string }): string =>
  input.text.replace(/\s+/g, ' ');

/**
 * .what = the non-rhx shell calls a text names, as backtick spans that open with gh or git
 * .why  = case4 holds each one to the pre-approved list, so no tail call stalls on a prompt
 */
const getAllShellCallsFromText = (input: { text: string }): string[] =>
  [...input.text.matchAll(/`((?:gh|git) [^`]+)`/g)].map((match) => match[1]!);

describe('templates.tail', () => {
  given('[case1] the 6.preship templates', () => {
    when('[t0] the stone is read', () => {
      const scene = useBeforeAll(async () => ({
        stone: getOneTemplateContentRequired({ name: '6.preship.stone' }),
      }));

      then(
        'a red suite never commits, and a fix round never skips (c4)',
        () => {
          const flat = asProseFlat({ text: scene.stone });
          expect(flat).toContain('no commit on red');
          expect(flat).toContain(
            'a fix round never turns red green with a skip, an `.only`, a loosened assertion, or a deleted test',
          );
        },
      );

      then(
        'it runs the full suite one kind per call, types and format included (c4)',
        () => {
          [
            'rhx git.repo.test --what types,format --mode apply',
            'rhx git.repo.test --what lint --mode apply',
            'rhx git.repo.test --what unit --mode apply',
            'rhx git.repo.test --what integration --mode apply',
            'rhx git.repo.test --what acceptance --against local --env test --mode apply',
          ].forEach((call) => expect(scene.stone).toContain(call));
          // one serial call of every kind can outlast the tool cap; it must not come back
          expect(scene.stone).not.toContain('--what all');
        },
      );

      then('it re-enters on the commit, never on the tree (step 0)', () => {
        expect(scene.stone).toContain('gh pr view --json state,headRefOid');
        expect(scene.stone).toContain('`MERGED` or `CLOSED`');
      });

      then(
        'a landed commit whose push failed is pushed only, never re-committed (c31)',
        () => {
          const flat = asProseFlat({ text: scene.stone });
          expect(flat).toContain(
            'no pr yet: no work change → an earlier run committed but its push did not land; push only, via `rhx git.commit.push --mode apply`',
          );
          expect(flat).toContain(
            'a pr, no work change, local head not equal to `headRefOid` → push only',
          );
          expect(flat).toContain(
            'never commit again — push only, as step 0 does',
          );
        },
      );

      then(
        'an input refusal is fixed in the same bound, never held (c33)',
        () => {
          expect(asProseFlat({ text: scene.stone })).toContain(
            '**an input refusal** — a file left unstaged, a message of the wrong shape → fix it and run step 2 again, inside the 3-round bound',
          );
        },
      );

      then('a red that main shares is a halt, not a fix round (c37)', () => {
        expect(asProseFlat({ text: scene.stone })).toContain(
          "the same test fails on `main` too → not this change's red: halt with both runs verbatim",
        );
      });

      then('it stages the allowlist, then --unstaged ignore (F11)', () => {
        expect(scene.stone).toContain('rhx git.stage.add');
        expect(scene.stone).toContain('--unstaged ignore');
        expect(asProseFlat({ text: scene.stone })).toContain(
          'never `--unstaged include`',
        );
        expect(scene.stone).toContain('`.log/`');
        expect(scene.stone).toContain('`.temp/`');
      });

      then('it preflights the commit in --mode plan', () => {
        expect(scene.stone).toContain('--mode plan');
      });

      then('it opens the pr as-human only under the bot login (F19)', () => {
        expect(scene.stone).toContain('gh api --method GET user --jq .login');
        expect(scene.stone).toContain('--auth as-human');
      });

      then('it watches the pr with git.release --watch (c3)', () => {
        expect(scene.stone).toContain('rhx git.release --watch');
      });

      then(
        'it adds no head re-proof of its own; the watch owns it (F18)',
        () => {
          // step 0 reads headRefOid for re-entry; step 3, the watch, must name neither token
          const stepWatch = scene.stone.slice(
            scene.stone.indexOf('### 3. watch the pr'),
            scene.stone.indexOf('### 4.'),
          );
          expect(stepWatch).toContain('rhx git.release --watch');
          expect(stepWatch).not.toContain('headRefOid');
          expect(stepWatch).not.toContain('statusCheckRollup');
          expect(scene.stone).not.toContain('statusCheckRollup');
        },
      );

      then(
        'it bounds every loop at 3; only the watch re-runs a cut-off free (F17)',
        () => {
          const flat = asProseFlat({ text: scene.stone });
          expect(scene.stone).toContain('at most 3 fix rounds');
          expect(scene.stone).toContain('at most 3 watches');
          // the watch resumes remote state, so its cut-off is free; a suite restarts from zero
          expect(scene.stone.match(/at most 3 cut-offs/g)?.length).toEqual(1);
          expect(flat).toContain(
            'the watch resumes remote state, so re-run it free',
          );
          expect(flat).toContain(
            'the tool kills the call → a suite restarts from zero, so the kill counts as a try',
          );
          expect(flat).toContain(
            'the tool moves the call to the background → it still runs. await its end',
          );
          expect(scene.stone).toContain('### rounds');
          expect(scene.stone).toContain('### before');
        },
      );

      then('it forbids --apply and merge (c9)', () => {
        expect(scene.stone).toContain('never `--apply`, never merge');
      });

      then('a grant refusal is held, never a halt (F4)', () => {
        expect(scene.stone).toContain('held, never a halt');
      });

      then('a hold goes off the box, to the task queue (c28)', () => {
        expect(scene.stone).toContain(
          'rhx radio.task.push --via gh.issues --into @this',
        );
      });

      then(
        'an absent skill is a halt, with the roles the tail needs (c27)',
        () => {
          expect(scene.stone).toContain('an absent skill');
          expect(scene.stone).toContain('ehmpathy `mechanic`');
          expect(scene.stone).toContain('bhuild `dispatcher`');
          expect(scene.stone).toContain('bhuild `dreamer`');
        },
      );

      then('a non-fast-forward push is held, never forced (c25)', () => {
        expect(scene.stone).toContain('non-fast-forward');
        expect(scene.stone).toContain('never a force push');
      });

      then('it forbids every route around a refusal (c5, c6)', () => {
        expect(scene.stone).toContain('--no-verify');
        expect(scene.stone).toContain('no raw `git commit`');
      });

      then('a fix round never loosens a test (c7)', () => {
        expect(scene.stone).toContain('a loosened assertion');
        expect(scene.stone).toContain('rhx cicd.deflake init');
      });

      then('it carries no clock (F3)', () => {
        expect(scene.stone).not.toMatch(PATTERN_CLOCK);
      });

      then(
        'the clock detector sees each clock shape (positive control)',
        () => {
          [
            'lands after 20:00 CT',
            'commit before 6pm',
            'after the 18h cutoff',
            'by EOD',
            'by end of day',
            'at 9 UTC',
          ].forEach((sentence) => expect(sentence).toMatch(PATTERN_CLOCK));
        },
      );

      then('the stone text is snapped', () => {
        expect(scene.stone).toMatchSnapshot();
      });
    });

    when('[t1] the guard is read', () => {
      const scene = useBeforeAll(async () => ({
        guard: getOneTemplateContentRequired({ name: '6.preship.guard' }),
      }));

      then('it drives on sonnet (F2)', () => {
        expect(scene.guard).toContain(`brain: ${BRAIN_BUILD}`);
      });

      then(
        'it gates on self-reviews alone: no peer lane, no judge (F5)',
        () => {
          expect(scene.guard).toContain('  peer: []');
          expect(scene.guard).not.toMatch(/^judges:/m);
        },
      );

      then(
        'the watch review pastes the watch output, no gh re-proof (F18)',
        () => {
          expect(scene.guard).not.toContain('headRefOid');
          expect(scene.guard).not.toContain('statusCheckRollup');
          expect(scene.guard).toContain('### pr');
        },
      );

      then('the watch review has a held arm', () => {
        expect(scene.guard).toContain('### held');
      });

      then('the held review sorts grant refusals from halts (F4, F19)', () => {
        expect(scene.guard).toContain(
          'a **grant** refusal is held, never a halt',
        );
        expect(scene.guard).toContain('--auth as-human');
      });

      then('the merge review names the human (case4)', () => {
        expect(scene.guard).toContain('has-left-the-merge-to-the-human');
      });

      then('the guard text is snapped', () => {
        expect(scene.guard).toMatchSnapshot();
      });
    });
  });

  given('[case2] the 7.reflect templates', () => {
    when('[t0] the stone is read', () => {
      const scene = useBeforeAll(async () => ({
        stone: getOneTemplateContentRequired({ name: '7.reflect.stone' }),
      }));

      then('it goes three whys deep (c14)', () => {
        expect(scene.stone).toContain('the why of why of why');
      });

      then('it reads the record, not memory (c21)', () => {
        expect(scene.stone).toContain('read the record, not memory');
      });

      then('it extends an extant brief before it writes a new one', () => {
        expect(scene.stone).toContain('never duplicated');
      });

      then(
        'an in-repo cure rides the same pr and is re-watched (F6, c24)',
        () => {
          expect(scene.stone).toContain('onto the same pr');
          expect(scene.stone).toContain('re-watch to green');
          expect(asProseFlat({ text: scene.stone })).toContain(
            "6.preship's steps `### 0. re-entry`, `### 1. the full suite`, `### 2. commit at the done gate`, and `### 3. watch the pr`",
          );
          expect(scene.stone).toContain('### ship');
        },
      );

      then(
        'a cure owned elsewhere is dispatched with the whole call (c15)',
        () => {
          expect(scene.stone).toContain(
            'rhx radio.task.push --via gh.issues --into <owner/repo> --title "<route slug>: <item slug>, layer <n>" --description @stdin',
          );
          expect(scene.stone).toContain('`repository`');
        },
      );

      then('a cross-repo item quotes no record content (c34)', () => {
        expect(scene.stone).toContain('quotes no record content');
      });

      then('a dream is caught and linked in the route', () => {
        expect(scene.stone).toContain('rhx catch.dream --name');
        expect(scene.stone).toContain('rhx symlink --at');
      });

      then('the yield shape names a lesson, cure, and owner per layer', () => {
        const emit = scene.stone.slice(scene.stone.indexOf('## .emit'));
        expect(emit.match(/- lesson:/g)?.length).toEqual(3);
        expect(emit.match(/- cure:/g)?.length).toEqual(3);
        expect(emit.match(/- owner:/g)?.length).toEqual(3);
      });

      then('it ends with the record commit onto the pr (F15)', () => {
        expect(scene.stone).toContain('the record commit');
        expect(scene.stone).toContain('$BEHAVIOR_DIR_REL/.route/');
      });

      then(
        'it mirrors the ship rules of 6.preship: no merge, held refusals (c9, F4)',
        () => {
          expect(scene.stone).toContain('never `--apply`, never merge');
          expect(scene.stone).toContain(
            'a refused commit or push is held, as in 6.preship',
          );
        },
      );

      then(
        'a held cure or record commit goes off the box with a land recipe (c29)',
        () => {
          const hold = scene.stone.slice(
            scene.stone.indexOf('## .a hold'),
            scene.stone.indexOf('## .an absent skill'),
          );
          expect(hold).toContain(
            'rhx radio.task.push --via gh.issues --into @this --title "<route slug>: held reflect <cure|record> commit, round <n>"',
          );
          expect(hold).toContain('allowlist: {each path to stage}');
          expect(hold).toContain(
            'message: {the commit message the grant will land}',
          );
          expect(hold).toContain(
            "land via: 6.preship's steps `### 2. commit at the done gate` and `### 3. watch the pr`",
          );
          // one anchor: the yield skeleton holds a ### held section, as the guard names it
          const emit = scene.stone.slice(scene.stone.indexOf('## .emit'));
          expect(emit).toContain('### held');
        },
      );

      then('it glosses its terms inline', () => {
        expect(scene.stone).toContain('**enbrief** =');
        expect(scene.stone).toContain('**entool** =');
        expect(scene.stone).toContain('**fulcrum** =');
      });

      then('it carries no clock (F3)', () => {
        expect(scene.stone).not.toMatch(PATTERN_CLOCK);
      });

      then('the stone text is snapped', () => {
        expect(scene.stone).toMatchSnapshot();
      });
    });

    when('[t1] the guard is read', () => {
      const scene = useBeforeAll(async () => ({
        guard: getOneTemplateContentRequired({ name: '7.reflect.guard' }),
      }));

      then('it drives on opus (F2)', () => {
        expect(scene.guard).toContain(`brain: ${BRAIN_DESIGN}`);
      });

      then(
        'it gates on self-reviews alone: no peer lane, no judge (F5)',
        () => {
          expect(scene.guard).toContain('  peer: []');
          expect(scene.guard).not.toMatch(/^judges:/m);
        },
      );

      then(
        'the re-watch review pastes the watch output, no gh re-proof (F18)',
        () => {
          expect(scene.guard).not.toContain('headRefOid');
          expect(scene.guard).not.toContain('statusCheckRollup');
          expect(scene.guard).toContain('### ship');
        },
      );

      then('the guard text is snapped', () => {
        expect(scene.guard).toMatchSnapshot();
      });
    });
  });

  given(
    '[case3] the push points, and the opt-in that gates the early ones',
    () => {
      // .why = a repo with private data must never push before 6.preship. the two approval stones
      //        commit their yields early, so a human reviews them off the box; each pushes only
      //        where a human opted the repo in, and commits local otherwise (F1, fail-safe).
      //        7.reflect commits only through 6.preship's steps, cited by name
      const scene = useBeforeAll(async () => ({
        // walk every depth, refs/ included: a ship call in a ref would ship from every stone that cites it
        namesWithShipCall: getAllFilesRecursive({ dir: TEMPLATES_DIR })
          .filter((filePath) =>
            PATTERN_SHIP_CALL.test(readFileSync(filePath, 'utf-8')),
          )
          .map((filePath) => path.relative(TEMPLATES_DIR, filePath))
          .sort(),
        checkpoints: CHECKPOINT_NAMES.map((name) => ({
          name,
          section:
            getOneTemplateContentRequired({ name }).split(
              '## .checkpoint',
            )[1] ?? '',
        })),
        reflect: getOneTemplateContentRequired({ name: '7.reflect.stone' }),
      }));

      when('[t0] every template is read', () => {
        then(
          'only 6.preship and the two approval stones name a commit or a push call (c18)',
          () => {
            expect(scene.namesWithShipCall).toEqual(
              [...CHECKPOINT_NAMES, '6.preship.stone'].sort(),
            );
          },
        );

        then('each approval stone carries a checkpoint section', () => {
          scene.checkpoints.forEach((checkpoint) =>
            expect({
              name: checkpoint.name,
              hasSection: checkpoint.section.length > 0,
            }).toEqual({ name: checkpoint.name, hasSection: true }),
          );
        });

        then(
          'a checkpoint fires on the approval halt, never earlier (c10, c11)',
          () => {
            scene.checkpoints.forEach((checkpoint) =>
              expect(asProseFlat({ text: checkpoint.section })).toContain(
                'each time the guard halts on its approval judge (`halted, human approval required`), never earlier',
              ),
            );
          },
        );

        then('a checkpoint stages the route dir alone (c10, c11)', () => {
          scene.checkpoints.forEach((checkpoint) => {
            expect(checkpoint.section).toContain(
              '`rhx git.stage.add $BEHAVIOR_DIR_REL`',
            );
            expect(checkpoint.section).not.toContain('--unstaged include');
          });
        });

        then(
          'only the exact opt-in pushes; every other read commits local, for 6.preship to push (c12, c22, F1)',
          () => {
            scene.checkpoints.forEach((checkpoint) => {
              const flat = asProseFlat({ text: checkpoint.section });
              expect(flat).toContain(`read \`${CHECKPOINT_MARKER}\``);
              expect(flat).toContain(
                `its content is exactly ${CHECKPOINT_OPT_IN} → a human opted this repo in: commit and push, \`rhx git.commit.set -m @stdin --mode apply --unstaged ignore --push\``,
              );
              expect(flat).toContain(
                'absent, unreadable, or any other content → commit local, with no push: `rhx git.commit.set -m @stdin --mode apply --unstaged ignore`. 6.preship pushes it with the work',
              );
              // the push call appears once, under the opt-in branch alone
              expect(flat.match(/--push\b/g)?.length).toEqual(1);
            });
          },
        );

        then(
          'a checkpoint commit never titles the pr, and carries no clock (c20, F3)',
          () => {
            scene.checkpoints.forEach((checkpoint) => {
              expect(checkpoint.section).toContain('`docs(behavior):');
              expect(checkpoint.section).not.toMatch(PATTERN_CLOCK);
            });
          },
        );

        then(
          'a refused checkpoint is held, never a halt (c13, c26, F4)',
          () => {
            scene.checkpoints.forEach((checkpoint) =>
              expect(asProseFlat({ text: checkpoint.section })).toContain(
                'a refused stage, commit, or push is held, never a halt: paste the refusal verbatim at the top of the yield',
              ),
            );
          },
        );

        then(
          '7.reflect sends a cross-repo item off the box only under the same opt-in (c34)',
          () => {
            const reflectFlat = asProseFlat({ text: scene.reflect });
            expect(reflectFlat).toContain(
              `read \`${CHECKPOINT_MARKER}\` first. only its exact content ${CHECKPOINT_OPT_IN}`,
            );
            expect(reflectFlat).toContain(
              'rhx radio.task.push --via os.fileops --into @this',
            );
          },
        );

        then(
          "7.reflect ships its cures and record through 6.preship's steps, by name",
          () => {
            const reflectFlat = asProseFlat({ text: scene.reflect });
            expect(reflectFlat).toContain(
              "6.preship's steps `### 2. commit at the done gate` and `### 3. watch the pr`",
            );
          },
        );

        then(
          'each 6.preship step title 7.reflect cites is a real step title',
          () => {
            const preship = getOneTemplateContentRequired({
              name: '6.preship.stone',
            });
            const titlesCited = [
              ...scene.reflect.matchAll(/`(### \d\. [^`]+)`/g),
            ].map((match) => match[1]!);
            expect(titlesCited.length).toBeGreaterThanOrEqual(4);
            titlesCited.forEach((title) =>
              expect(preship.split('\n')).toContain(title),
            );
          },
        );
      });
    },
  );

  given("[case4] the tail speaks paved calls, in a consumer's words", () => {
    const scene = useBeforeAll(async () => ({
      files: TAIL_NAMES.map((name) => ({
        name,
        text: getOneTemplateContentRequired({ name }),
      })),
    }));

    when('[t0] every tail file is read', () => {
      then('each non-rhx shell call is a pre-approved form', () => {
        const callsUnpaved = scene.files.flatMap((file) =>
          getAllShellCallsFromText({ text: file.text })
            .filter((call) => !SHELL_CALLS_ALLOWED.includes(call))
            .map((call) => `${file.name}: ${call}`),
        );
        expect(callsUnpaved).toEqual([]);
      });

      then('the detector sees an unpaved call (positive control)', () => {
        expect(
          getAllShellCallsFromText({ text: 'paste `git rev-parse HEAD` here' }),
        ).toEqual(['git rev-parse HEAD']);
      });

      then("no file names this factory's roles", () => {
        const filesWithTerm = scene.files
          .filter((file) => PATTERN_FACTORY_TERM.test(file.text))
          .map((file) => file.name);
        expect(filesWithTerm).toEqual([]);
      });
    });
  });

  given(
    '[case5] every rhx call in the tail parses against the skill it names',
    () => {
      const scene = useBeforeAll(async () => ({
        calls: TAIL_NAMES.flatMap((name) =>
          asRhxCallsFromTemplateText({
            text: getOneTemplateContentRequired({ name }),
          }).map((call) => ({ ...call, file: name })),
        ),
      }));

      when('[t0] the calls are extracted', () => {
        then('the extractor finds the calls the tail is known to make', () => {
          expect(scene.calls.length).toBeGreaterThanOrEqual(12);
        });

        then('each skill named ships in a role the tail lists', () => {
          const skillsAbsent = [
            ...new Set(scene.calls.map((call) => call.skill)),
          ].filter((skill) => getOneSkillSource({ skill }) === null);
          expect(skillsAbsent).toEqual([]);
        });

        then('each flag a call names is one its skill parses', () => {
          const flagsUnknown = scene.calls.flatMap((call) => {
            // an absent skill fails here too, never a vacuous pass on its flags
            const flagsParsed = getAllFlagsParsedBySkill({ skill: call.skill });
            if (flagsParsed === null)
              return [`${call.file}: rhx ${call.skill} (skill absent)`];
            return call.flags
              .filter((flag) => !flagsParsed.includes(flag))
              .map((flag) => `${call.file}: rhx ${call.skill} ${flag}`);
          });
          expect(flagsUnknown).toEqual([]);
        });

        then('a misspelt flag is caught, so the check can bite', () => {
          const flagsParsed = getAllFlagsParsedBySkill({
            skill: 'git.release',
          });
          expect(flagsParsed).toContain('--watch');
          expect(flagsParsed).not.toContain('--wacth');
        });

        then(
          'a launcher flag named only in its header comment does not count',
          () => {
            // radio.task.push.sh names --via in its header; the parse must come from the cli schema
            const shellOnly = asFlagsParsedFromShellText({
              text: readFileSync(
                path.join(
                  REPO_ROOT,
                  'src/domain.roles/dispatcher/skills/radio.task.push.sh',
                ),
                'utf-8',
              ),
            });
            expect(shellOnly).not.toContain('--via');
            expect(
              getAllFlagsParsedBySkill({ skill: 'radio.task.push' }),
            ).toContain('--via');
          },
        );
      });

      when(
        '[t1] the suite calls run in plan mode, outside any repo under test',
        () => {
          const plan = useBeforeAll(async () => {
            const cwd = genTempDir({
              slug: 'templates-tail-git-repo-test',
              git: true,
            });
            // guard the dir first, so an absent package meets the hint, never a raw ENOENT
            const skillPath = existsSync(SKILL_DIRS[0]!)
              ? getAllFilesRecursive({ dir: SKILL_DIRS[0]! }).find(
                  (filePath) => path.basename(filePath) === 'git.repo.test.sh',
                )
              : undefined;
            if (!skillPath)
              throw new ConstraintError(
                'git.repo.test.sh absent from the mechanic role',
                {
                  dir: SKILL_DIRS[0],
                  hint: 'run: pnpm install, so rhachet-roles-ehmpathy is present',
                },
              );
            const suiteCalls = scene.calls.filter(
              (call) =>
                call.skill === 'git.repo.test' &&
                call.file === '6.preship.stone',
            );
            return {
              suiteCalls,
              outputs: suiteCalls.map((call) =>
                getOneSkillOutputInPlan({
                  skillPath,
                  cwd,
                  // only the value of --mode turns to plan; every other token stays as written
                  args: call.args.map((arg, index) =>
                    call.args[index - 1] === '--mode' ? 'plan' : arg,
                  ),
                }),
              ),
              outputControl: getOneSkillOutputInPlan({
                skillPath,
                cwd,
                args: ['--what', 'all', '--mode', 'plan'],
              }),
            };
          });

          then(
            'the known-bad call prints the refusal (positive control)',
            () => {
              expect(plan.outputControl).toContain('required for --what all');
            },
          );

          then('the stone names one suite call per kind', () => {
            expect(plan.suiteCalls.length).toEqual(5);
          });

          then(
            'no suite call the stone names is refused for its arguments',
            () => {
              plan.outputs.forEach((output) => {
                // the skill reached its run: it prints the header of the first --what it runs
                expect(output).toMatch(
                  /🐚 git\.repo\.test --what (types|lint|unit|integration|acceptance)\b/,
                );
                expect(output).not.toContain('required for');
                expect(output).not.toMatch(/unknown (option|argument)/);
              });
            },
          );
        },
      );
    },
  );

  given(
    '[case6] each section the tail stages from is one a prior stone emits',
    () => {
      // pins read whitespace-flat, so a reflow of the stone never breaks one
      const scene = useBeforeAll(async () => ({
        preship: asProseFlat({
          text: getOneTemplateContentRequired({ name: '6.preship.stone' }),
        }),
        reflect: asProseFlat({
          text: getOneTemplateContentRequired({ name: '7.reflect.stone' }),
        }),
        // every size carries exactly one of these two 5.1 stones
        executions: [
          '5.1.execution.from_vision.stone',
          '5.1.execution.phase0_to_phaseN.stone',
        ].map((name) => ({
          name,
          text: asProseFlat({ text: getOneTemplateContentRequired({ name }) }),
        })),
        // every stone between 5.1 and the tail, derived from the dir so a new one cannot slip by;
        // each writes files, so each must append to the ledger
        writersLater: getAllFilesRecursive({ dir: TEMPLATES_DIR })
          .map((filePath) => path.relative(TEMPLATES_DIR, filePath))
          .filter((name) => /^5\.[2-9][\w.]*\.stone$/.test(name))
          .sort()
          .map((name) => ({
            name,
            text: asProseFlat({
              text: getOneTemplateContentRequired({ name }),
            }),
          })),
      }));

      when('[t0] the stones are read', () => {
        then('6.preship stages from the 5.1 yield filediff ledger', () => {
          expect(scene.preship).toContain(
            "`### filediff` section of the route's `5.1.execution.*.yield.md` — the route's file ledger",
          );
        });

        then('every 5.1 stone emits the ledger, one path per line', () => {
          const absent = scene.executions
            .filter(
              (stone) =>
                !stone.text.includes(
                  'keep a `### filediff` section in that yield',
                ) ||
                !stone.text.includes(
                  'one path per line, each `[+] <path>` (added), `[~] <path>` (changed), or `[-] <path>` (removed)',
                ),
            )
            .map((stone) => stone.name);
          expect(absent).toEqual([]);
        });

        then(
          'every stone after 5.1 that writes files appends to the ledger',
          () => {
            expect(scene.writersLater.map((stone) => stone.name)).toEqual([
              '5.2.evaluation.stone',
              '5.3.verification.stone',
              '5.5.playtest.stone',
            ]);
            const absent = scene.writersLater
              .filter(
                (stone) =>
                  !stone.text.includes(
                    'appends one line to the `### filediff` section of `$BEHAVIOR_DIR_REL/5.1.execution.*.yield.md`',
                  ),
              )
              .map((stone) => stone.name);
            expect(absent).toEqual([]);
          },
        );

        then(
          'a preship fix round appends to the ledger, and git status only checks it',
          () => {
            expect(scene.preship).toContain(
              'a fix round in step 1 or step 3 appends its own lines to the ledger first',
            );
            expect(scene.preship).toContain(
              'read `git status --porcelain` as a check, never as the source',
            );
          },
        );

        then(
          'the ledger reads net per path, so a write-then-delete stages naught',
          () => {
            expect(scene.preship).toContain(
              'read the ledger by path, last line wins',
            );
            expect(scene.preship).toContain(
              '`[+]` then `[-]` of a path never committed cancels (stage naught)',
            );
          },
        );

        then('a route from before the ledger builds it once, by hand', () => {
          expect(scene.preship).toContain(
            '**no ledger** (a route from before the ledger',
          );
          expect(scene.preship).toContain(
            'git diff --name-status origin/main...HEAD',
          );
        });

        then(
          'the deliverable is the non-tail yields, apart from the route record',
          () => {
            expect(scene.preship).toContain(
              '**the deliverable** = every file of the route dir outside the route record and scratch: each non-tail stone',
            );
          },
        );

        then(
          'a removal never stages a dir that would sweep in the record or scratch',
          () => {
            expect(scene.preship).toContain(
              'a staged dir takes every dirty path under it, the route record and scratch included',
            );
            expect(scene.preship).not.toContain(
              'a route record path does not count',
            );
          },
        );

        then('the hold rewind names its cascade into 7.reflect', () => {
          expect(scene.preship).toContain(
            'the rewind cascades to `7.reflect` too',
          );
          expect(scene.reflect).toContain(
            'a task an earlier run sent, now `found`, is delivered',
          );
        });

        then(
          'a held preship holds the reflect cure and record too (c40)',
          () => {
            expect(scene.reflect).toContain('## .a held preship');
            expect(scene.reflect).toContain(
              'not `none` → the feature is still on the box, so hold the cure commit and the record commit too: commit naught',
            );
          },
        );

        then(
          "the record commit's watch result lives off the yield it commits",
          () => {
            expect(scene.reflect).toContain(
              "the record commit's own watch result goes into this stone's self-review promise, never the yield",
            );
          },
        );

        then('the staged set must equal the allowlist before apply', () => {
          expect(scene.preship).toContain(
            'the plan lists the staged set: it must equal the `### before` allowlist',
          );
        });

        then('a push refused for a non-bot HEAD is held, never a grant', () => {
          expect(scene.preship).toContain(
            "refused because HEAD is not the bot's commit",
          );
        });

        then('the commit prefix defers to the preflight when unsure', () => {
          expect(scene.preship).toContain(
            'the preflight refuses a wrong prefix and prints the one it demands',
          );
        });

        then(
          'a removed path rides via its parent dir, or is held, never git rm',
          () => {
            expect(scene.preship).toContain(
              'stage the nearest parent dir that still exists',
            );
            expect(scene.preship).toContain(
              'else hold the removal (`.a hold`), the path named, for a human to stage — never raw `git rm`',
            );
          },
        );

        then(
          'a hold names the rewind that brings it back into the route',
          () => {
            expect(scene.preship).toContain(
              'land via: rhx route.stone.set --stone 6.preship --as rewound, then',
            );
          },
        );

        then('the preflight does not claim to catch a spent quota', () => {
          expect(scene.preship).not.toContain(
            'quota, push, and sponsor refusals all fire here',
          );
          expect(scene.preship).toContain('is checked only at apply');
        });

        then(
          'the record commit stages .radio/ only when it exists and is tracked',
          () => {
            expect(scene.reflect).toContain(
              '`$BEHAVIOR_DIR_REL/.radio/` (only when it exists and `git check-ignore` does not report it ignored)',
            );
          },
        );

        then(
          'a reflect cure writes its allowlist under ### ship, read at re-entry',
          () => {
            expect(scene.reflect).toContain(
              'write it under `### ship` before you stage',
            );
            expect(scene.reflect).toContain(
              '- allowlist: {each path the cure staged}',
            );
          },
        );

        then(
          'a merged or closed pr holds reflect commits, never a halt or a branch',
          () => {
            expect(scene.reflect).toContain(
              '## .a pr already merged or closed',
            );
            expect(scene.reflect).toContain(
              'rhx radio.task.push --via gh.issues --into @this --title "<route slug>: held reflect commit, pr <state>" --description @stdin',
            );
          },
        );
      });
    },
  );
});
