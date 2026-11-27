/**
 * .what = the `reach=package` half of the skill-surface matrix — does the
 *         PUBLISHED supervisor carry every verb it declares, and is each verb
 *         found by a consumer who holds no source?
 *
 * .why  = 🔴 this is the first acceptance coverage the supervisor has ever
 *         had. it shipped for two years out of one repo-local registry on one
 *         laptop, where `dist/` was never in the path at all.
 *
 *         ⚠️ and the gap is not theoretical. the peer prioritizer suite exists
 *         because `build:complete:dist` copies non-ts assets with an rsync
 *         allowlist that ends `--exclude='*'` — it carried rules for `*.sh`,
 *         `*.yml`, `*.md`, `*.jsonc` and **none for `*.mjs`**, so `eco.priority`
 *         shipped, was found, ran, and died on its first store call. that one
 *         allowlist governs 45 more entrypoints and 4 libs.
 *
 * .how  = the matrix's `reach=package` column, which `skillSurface.integration`
 *         declares it cannot reach:
 *
 *         | cell              | the question only THIS grain can ask     | where      |
 *         |-------------------|------------------------------------------|------------|
 *         | `package × link`  | does the role link into a consumer?      | case1      |
 *         | `package × ship`  | did every entrypoint survive the build?  | case1      |
 *         | `package × help`  | is a verb found BY NAME through rhx?     | case2 [t0] |
 *         | `package × asset` | did the libs it sources ship too?        | case2 [t1] |
 *
 *         🔴 `help` and `asset` need SEPARATE invocations, and that split is
 *         what this file got wrong on its first draft. see [t1] for the why.
 *
 *         no mock, because the whole subject is whether the built artifact is
 *         complete (`rule.forbid.acceptance.mocks`), and the action goes
 *         through the skill contract rather than any internal
 *         (`rule.require.acceptance.blackbox`).
 *
 * ⚠️ .the mirror half has NO guard, and that is honest rather than an omission.
 *         a package with an EXTRA file still runs, so no assert here can see a
 *         dev-only asset that leaked into `dist/`. the `tsconfig.build.json`
 *         exclude is that defect's whole defense.
 */
import { execSync } from 'child_process';
import { existsSync, mkdtempSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { given, then, useBeforeAll, when } from 'test-fns';

import { genConsumerRepo, stripAnsi } from '../.test/infra';

/**
 * .what = mask the per-run values in a captured cli output
 *
 * .why  = a snapshot must diff on the CONTRACT and never on the run. two things
 *         vary per run and neither is contract:
 *           - the ansi color bytes a captured stderr carries, which are terminal
 *             control rather than content (rule.forbid.snapshot-visual-blemishes)
 *           - the consumer repo dir, which `mkdtempSync` suffixes at random
 *
 * .note = it masks exactly those two and no more. every further difference is a
 *         change to the contract, which is the whole point of the snapshot
 */
const asSnapshotStable = (output: string): string =>
  stripAnsi(output)
    // each state dir is named for what it holds, so a mask never mislabels a tmux socket dir as a repo
    .replace(/\/tmp\/supervisor-tmux-[A-Za-z0-9]+/g, '{TMUX_TMPDIR}')
    .replace(/\/tmp\/supervisor-ledger-[A-Za-z0-9]+/g, '{CREWWORK_DIR}')
    .replace(/\/tmp\/supervisor-forest-[A-Za-z0-9]+/g, '{GIT_FOREST_DIR}')
    // /tmp/supervisor-invoke-Ab3xK9 -> /tmp/{REPO}
    .replace(/\/tmp\/supervisor-[a-z]+-[A-Za-z0-9]+/g, '/tmp/{REPO}');

/**
 * .what = where the supervisor declares its verbs, in SOURCE
 * .why  = the source tree is the claim; the linked dir is the delivery. a
 *         guard that reads only the delivery can never see a dropped file
 */
const DIR_SRC_SKILLS = join(
  __dirname,
  '..',
  '..',
  'src',
  'domain.roles',
  'supervisor',
  'skills',
);

/**
 * .what = finds the delivered dir, whatever depth the linker chose to put it at
 *
 * .why  = 🔴 measured 2026-09-25: `rhachet roles link` writes the skills link
 *         one level DEEPER than its own name — `role=supervisor/skills/skills
 *         -> …/dist/…/supervisor/skills`. `briefs` nests the same way, `inits`
 *         and `boot.yml` do not, and EVERY role nests alike (behaver included),
 *         so it is the linker's shape rather than a defect the lift caused.
 *
 *         ⚠️ this repo's OWN `.agent/` links flat, which is exactly the trap:
 *         a guard written against the host layout reads the consumer layout as
 *         an empty delivery and blames the package for it.
 *
 *         ⇒ so it descends rather than pins the nest. the subject here is
 *         whether the PACKAGE shipped the files — a literal `skills/skills`
 *         would go red the day the linker is repaired, and a guard that grades
 *         the shape its environment happens to write inverts when that
 *         environment changes.
 */
const getDirDelivered = (input: { dirLinked: string }): string => {
  const nested = join(input.dirLinked, 'skills');
  return existsSync(nested) ? nested : input.dirLinked;
};

/**
 * .what = invokes a verb the way a HUMAN does — `rhx <skill> <args>`
 * .why  = `rhx` looks the skill up BY NAME across every linked role, which is
 *         the precise reach this whole graduation exists to buy. a direct path
 *         invocation would prove the file exists and never prove it is found
 */
const runAsHuman = (input: {
  command: string;
  repoDir: string;
  env?: Record<string, string>;
}): { output: string; exitCode: number } => {
  try {
    const stdout = execSync(`npx ${input.command}`, {
      cwd: input.repoDir,
      encoding: 'utf-8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...input.env },
    });
    return { output: stdout.trim(), exitCode: 0 };
  } catch (error: unknown) {
    const said = error as {
      stdout?: Buffer | string;
      stderr?: Buffer | string;
      status?: number;
    };
    return {
      output: [said.stdout ?? '', said.stderr ?? '']
        .map((part) => part.toString().trim())
        .filter(Boolean)
        .join('\n'),
      exitCode: said.status ?? 1,
    };
  }
};

describe('supervisor.surface acceptance (as consumer)', () => {
  given('[case1] a consumer repo that links the published supervisor', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'supervisor-surface-' });
      // the supervisor is not among the roles `genConsumerRepo` links by
      // default, and it is linked HERE rather than added there so no peer
      // acceptance suite pays for a role it never invokes
      execSync('npx rhachet roles link --repo bhuild --role supervisor', {
        cwd: consumer.repoDir,
        stdio: 'pipe',
      });
      const dirDelivered = getDirDelivered({
        dirLinked: join(
          consumer.repoDir,
          '.agent',
          'repo=bhuild',
          'role=supervisor',
          'skills',
        ),
      });
      return {
        ...consumer,
        dirDelivered,
        // read BOTH sides by the same rule, so the comparison is honest
        namesAtSource: readdirSync(DIR_SRC_SKILLS).filter((f) =>
          f.endsWith('.sh'),
        ),
        namesDelivered: existsSync(dirDelivered)
          ? readdirSync(dirDelivered).filter((f) => f.endsWith('.sh'))
          : [],
      };
    });

    // ANTI-VACUITY, and it is load-bearing here: every claim below is a set
    // difference, and two empty sets differ by naught. a link that silently
    // produced no dir would satisfy the parity claim perfectly
    then('the role links, and it delivers a real set of verbs', () => {
      expect({
        dirExists: existsSync(scene.dirDelivered),
        delivered: scene.namesDelivered.length,
      }).toEqual({
        dirExists: true,
        // the SOURCE count, never a floor — a parity claim reads plainer than
        // a threshold, and jest prints both sides when it parts
        delivered: scene.namesAtSource.length,
      });
    });

    // 🔴 THE build-manifest guard. a `.sh` dropped by the rsync allowlist is
    //    invisible to every suite that reads `src/` — which is all of them,
    //    save this one
    then('🔴 every entrypoint the source declares was delivered', () => {
      const dropped = scene.namesAtSource.filter(
        (name) => !scene.namesDelivered.includes(name),
      );
      expect(dropped).toEqual([]);
    });

    /**
     * 🔴 .the gap the parity claim above CANNOT see, by construction
     *
     * it is a set difference between source and delivery, so it goes red only
     * when the two DISAGREE. a verb deleted from source and from the package
     * together agrees perfectly — and the published surface just lost a verb
     * with no guard that fires.
     *
     * ⇒ the delivered list is the role's published manifest, so it is pinned
     * here as itself. a reviewer then sees the verb leave in the diff
     * (rule.require.snapshots: snapshots make the change visible in the pr).
     *
     * .note = sorted, because `readdirSync` order is filesystem-bound and a
     *         snapshot that diffs on inode order grades the disk, not the build
     */
    then('🔴 and the delivered manifest is the one on record', () => {
      expect([...scene.namesDelivered].sort()).toMatchSnapshot();
    });

    // and the libs the entrypoints `source` at runtime. these live one dir
    // deeper, so a manifest rule that matches `skills/*.sh` and not
    // `skills/**/*.sh` would deliver every verb and no lib — and each verb
    // would then die on its first line
    then('🔴 and the work libs they source were delivered too', () => {
      const libsAtSource = readdirSync(join(DIR_SRC_SKILLS, 'work')).filter(
        (f) => f.endsWith('.sh'),
      );
      const dirLibs = join(scene.dirDelivered, 'work');
      const libsDelivered = existsSync(dirLibs)
        ? readdirSync(dirLibs).filter((f) => f.endsWith('.sh'))
        : [];
      expect({
        libsAtSource: libsAtSource.length >= 4,
        dropped: libsAtSource.filter((n) => !libsDelivered.includes(n)),
      }).toEqual({ libsAtSource: true, dropped: [] });
    });
  });

  given('[case2] a verb invoked by name, from a repo with no source', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'supervisor-invoke-' });
      execSync('npx rhachet roles link --repo bhuild --role supervisor', {
        cwd: consumer.repoDir,
        stdio: 'pipe',
      });
      return consumer;
    });

    // `git.crew.list` is the subject deliberately: it `source`s crewwork.sh,
    // which in turn sources ductwork.sh and termwork.sh — so one bare run
    // loads the whole lib chain, and a drop anywhere in it surfaces
    when('[t0] `rhx git.crew.list --help` is run', () => {
      const result = useBeforeAll(async () =>
        runAsHuman({
          command: 'rhx git.crew.list --help',
          repoDir: scene.repoDir,
        }),
      );

      // ANTI-VACUITY for [t1]: a verb never found names no absent file at all,
      // so [t1] would pass for the wrong reason. and `no skill found` is the
      // lift's OWN symptom, so a pass here IS the reach this graduation buys
      then('the verb is found in the package', () => {
        expect(result.output).not.toMatch(/no skill .*found/);
      });

      then('and it answers, whole, through the built package', () => {
        expect({ exitCode: result.exitCode }).toEqual({ exitCode: 0 });
      });

      // the help must be the REAL help, never an empty success. a `--help`
      // that runs and prints naught reads as answered
      then('and the help it prints is the real help', () => {
        expect(result.output).toContain('git.crew.list');
      });

      // 🔴 `--help` IS the contract a human reads before every other verb, and
      //    the assertion above pins one word of it. the usage line, the flag
      //    list, their defaults, the examples — all of it can rot while
      //    `.toContain('git.crew.list')` stays green, because the skill prints
      //    its own name in the header
      //    (rule.require.contract-snapshot-exhaustiveness, rule.require.help-on-demand)
      then('🔴 and the whole help surface holds its shape', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });

    /**
     * 🔴 .why a BARE run, and why [t0] could never stand in for it
     *
     * measured 2026-09-25: with all four libs dropped from the package, a
     * `--help` run stayed GREEN. every entrypoint answers `--help` at its arg
     * parser, which sits ABOVE the `source` line — so help never reaches the
     * lib chain and can never prove it shipped.
     *
     * ⇒ that is the same fact the `skillSurface.integration` matrix rests its
     * second collapse move on ("every entrypoint refuses at the parser, before
     * any boundary"). this test had assumed the opposite, and the two guards
     * contradicted each other until a dropped-manifest dogfood said so.
     *
     * ⚠️ so the bare run grades the LOAD and never the outcome. its exit code
     * is environment-bound — no tree, no tmux, no grove in ci — and a guard
     * that grades the symptom its environment happens to produce inverts the
     * moment that environment changes (rule.require.exit-code-semantics).
     */
    when('[t1] the same verb is run bare, so its libs must load', () => {
      const result = useBeforeAll(async () =>
        runAsHuman({ command: 'rhx git.crew.list', repoDir: scene.repoDir }),
      );

      // 🔴 THE teeth for the lib chain — crewwork → ductwork + termwork. a
      //    manifest that matches `skills/*.sh` and not `skills/**/*.sh` ships
      //    every verb and no lib, and each verb dies on its first line
      then('🔴 every lib it sources shipped with it', () => {
        expect(result.output).not.toMatch(
          /No such file or directory|Cannot find module/,
        );
      });
    });
  });

  /**
   * .what = the journeys this repo adds — git.crew.move, git.crew.ledger, duct.bar.probe, duct.refresh --home — run by NAME
   *         from a consumer, each through its help and through a refusal a human meets
   *
   * .why  = the integration suites prove each verb from source. only this grain proves a consumer who
   *         holds no source reaches the same contract through `rhx`
   *
   * .note = no bare run of these three: a bare ledger read or bar probe reads the box's own `~/.crewwork`
   *         and tmux sockets, and a bare move needs a grove. a guard graded on the host's state inverts
   *         when the host changes; each refusal below loads the verb's lib chain all the same, since it
   *         sits past the `source` line
   */
  given('[case3] the journeys this repo adds, run by name from a consumer', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'supervisor-journey-' });
      execSync('npx rhachet roles link --repo bhuild --role supervisor', {
        cwd: consumer.repoDir,
        stdio: 'pipe',
      });
      return consumer;
    });

    const JOURNEYS: {
      slug: string;
      command: string;
      exitCode: number;
      says: string[];
    }[] = [
      {
        slug: 'git.crew.move --help',
        command: 'rhx git.crew.move --help',
        exitCode: 0,
        says: ['git.crew.move', '--tree', '--to', '--mode'],
      },
      {
        slug: 'git.crew.move with a mistyped flag',
        command: 'rhx git.crew.move --tre x --to local',
        exitCode: 2,
        says: ["unknown arg '--tre'", 'fix: rhx git.crew.move --tree <tree> --to <grove>'],
      },
      {
        slug: 'git.crew.ledger --help',
        command: 'rhx git.crew.ledger --help',
        exitCode: 0,
        says: ['git.crew.ledger', '--backfill', '--tree <tree> --grove'],
      },
      {
        slug: 'git.crew.ledger with an unknown flag',
        command: 'rhx git.crew.ledger --bogus',
        exitCode: 2,
        says: ["unknown arg '--bogus'", '--del <tree> · --backfill'],
      },
      {
        slug: 'duct.bar.probe --help',
        command: 'rhx duct.bar.probe --help',
        exitCode: 0,
        says: ['.what', '--session'],
      },
      {
        slug: 'duct.bar.probe with a mistyped flag',
        command: 'rhx duct.bar.probe --sesion x',
        exitCode: 2,
        says: ["unknown arg '--sesion'", '--session <tree>/<role>'],
      },
      {
        slug: 'duct.refresh with --all and --home at once',
        command: 'rhx duct.refresh --all --home /tmp',
        exitCode: 2,
        says: [
          '✋ ConstraintError: duct.refresh --home names one duct',
          'fix: rhx duct.refresh --on <tree>/<role> --home <tree dir>',
        ],
      },
      {
        slug: 'duct.refresh with --home handed no value',
        command: 'rhx duct.refresh --on x/mechanic --home',
        exitCode: 2,
        says: ['duct.refresh --home takes a value, got none'],
      },
      {
        slug: 'duct.refresh --help',
        command: 'rhx duct.refresh --help',
        exitCode: 0,
        says: ['--on', '--home', '--all'],
      },
      {
        slug: 'duct.bar.probe with --session handed no value',
        command: 'rhx duct.bar.probe --session',
        exitCode: 2,
        says: ['--session takes a value, got none'],
      },
    ];

    JOURNEYS.map((journey, index) =>
      when(`[t${index}] ${journey.slug}`, () => {
        const result = useBeforeAll(async () =>
          runAsHuman({ command: journey.command, repoDir: scene.repoDir }),
        );

        then('the verb is found, and its libs load', () => {
          expect(result.output).not.toMatch(/no skill .*found/);
          expect(result.output).not.toMatch(
            /No such file or directory|Cannot find module/,
          );
        });

        then(`it exits ${journey.exitCode} and says what a human needs`, () => {
          expect(result.exitCode).toEqual(journey.exitCode);
          for (const word of journey.says) expect(result.output).toContain(word);
        });

        then('the render matches the snapshot', () => {
          expect(asSnapshotStable(result.output)).toMatchSnapshot();
        });
      }),
    );
  });

  /**
   * .what = the positive paths a consumer walks, each against a state dir of its own
   *
   * .why  = case3 proves the help and the refusals through `rhx`; this proves the success renders
   *         through the same linked package. each verb reads its state from an env the caller may set
   *         (`CREWWORK_DIR` for the ledger, `TMUX_TMPDIR` for the bar probe), so a fresh temp dir
   *         holds the run apart from the box's own fleet, with no mock (rule.require.hermetic-tests)
   *
   * .note = a move's refusals at plan need no grove, so [t2] and [t3] walk them here. a move's
   *         own success needs two reachable ends; that walk is the integration suite's,
   *         over a real git and bash per end, and the live seat walk is owed by
   *         `.dream/v2026_11_27.test.real-seat-boundaries-for-crew-move.md`
   */
  given('[case4] the positive paths, each against its own state dir', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'supervisor-happy-' });
      execSync('npx rhachet roles link --repo bhuild --role supervisor', {
        cwd: consumer.repoDir,
        stdio: 'pipe',
      });
      return {
        repoDir: consumer.repoDir,
        dirCrewwork: mkdtempSync(join(tmpdir(), 'supervisor-ledger-')),
        dirTmux: mkdtempSync(join(tmpdir(), 'supervisor-tmux-')),
        dirForest: mkdtempSync(join(tmpdir(), 'supervisor-forest-')),
      };
    });

    when('[t0] a ledger row is placed, then the ledger is read', () => {
      const result = useBeforeAll(async () => {
        const env = { CREWWORK_DIR: scene.dirCrewwork };
        const placed = runAsHuman({
          command:
            'rhx git.crew.ledger --tree svc-lessons.feat.book-a-lesson --grove cloud://grove-sandpine-v20260901 --roles mechanic,foreman',
          repoDir: scene.repoDir,
          env,
        });
        const read = runAsHuman({
          command: 'rhx git.crew.ledger',
          repoDir: scene.repoDir,
          env,
        });
        return { placed, read };
      });

      then('the row is placed, exit 0, and said', () => {
        expect(result.placed.exitCode).toEqual(0);
        expect(result.placed.output).toContain(
          'row added: svc-lessons.feat.book-a-lesson is on cloud://grove-sandpine-v20260901 (roles: mechanic,foreman)',
        );
      });

      then('the read names the row it placed', () => {
        expect(result.read.exitCode).toEqual(0);
        expect(result.read.output).toContain('svc-lessons.feat.book-a-lesson');
        expect(result.read.output).toContain('grove-sandpine-v20260901');
      });

      then('both renders match the snapshot', () => {
        expect(asSnapshotStable(result.placed.output)).toMatchSnapshot();
        expect(asSnapshotStable(result.read.output)).toMatchSnapshot();
      });
    });

    when('[t1] the bar probe runs bare over a box with no tmux server', () => {
      const result = useBeforeAll(async () =>
        runAsHuman({
          command: 'rhx duct.bar.probe',
          repoDir: scene.repoDir,
          env: { TMUX_TMPDIR: scene.dirTmux },
        }),
      );

      then('it probes, exit 0, and counts no session', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('servers: 0');
        expect(result.output).toContain('done: 0 sessions');
      });

      then('the render matches the snapshot, the uid masked', () => {
        expect(
          asSnapshotStable(result.output).replace(/tmux-\d+/g, 'tmux-{UID}'),
        ).toMatchSnapshot();
      });
    });

    when('[t2] a move is asked to land where the crew already is', () => {
      const result = useBeforeAll(async () =>
        runAsHuman({
          command:
            'rhx git.crew.move --tree svc-lessons.feat.book-a-lesson --from local --to local',
          repoDir: scene.repoDir,
          env: { CREWWORK_DIR: scene.dirCrewwork },
        }),
      );

      then('it refuses, exit 2, and names the verify a finished move owes', () => {
        expect(result.exitCode).toEqual(2);
        expect(result.output).toContain(
          'svc-lessons.feat.book-a-lesson is on local already (--from and --to both name local)',
        );
        expect(result.output).toContain('--mode verify');
        expect(result.output).toContain('🌊 naught was moved — 1 refusal');
      });

      then('the render matches the snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });

    when('[t3] a move names a destination grove this box does not know', () => {
      const result = useBeforeAll(async () =>
        runAsHuman({
          command:
            'rhx git.crew.move --tree svc-lessons.feat.book-a-lesson --from local --to cloud://grove-sandpine-unregistered',
          repoDir: scene.repoDir,
          // an empty forest of its own, so no grove this box registers can turn the refusal
          env: {
            CREWWORK_DIR: scene.dirCrewwork,
            GIT_FOREST_DIR: scene.dirForest,
          },
        }),
      );

      then('it refuses, exit 2, names the grove, and moves naught', () => {
        expect(result.exitCode).toEqual(2);
        expect(result.output).toContain(
          "the destination grove 'grove-sandpine-unregistered' is not registered",
        );
        expect(result.output).toContain('fix: rhx git.grove.list');
        expect(result.output).toContain('naught was moved');
      });

      then('the render matches the snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });

    when('[t4] a local-only tree is asked onto a cloud grove', () => {
      const result = useBeforeAll(async () =>
        runAsHuman({
          command:
            'rhx git.crew.move --tree notebook.sandpine --from local --to cloud://grove-sandpine-v20260901',
          repoDir: scene.repoDir,
          env: {
            CREWWORK_DIR: scene.dirCrewwork,
            GIT_CREW_MOVE_LOCAL_ONLY_TREES: 'notebook.* !notebook.direction.*',
          },
        }),
      );

      then('it refuses, exit 2, names the glob, and points to --to local', () => {
        expect(result.exitCode).toEqual(2);
        expect(result.output).toContain(
          "'notebook.sandpine' is a local-only tree (it matches 'notebook.*')",
        );
        expect(result.output).toContain(
          '└─ fix: rhx git.crew.move --tree notebook.sandpine --to local',
        );
        expect(result.output).toContain(
          "bound by: GIT_CREW_MOVE_LOCAL_ONLY_TREES='notebook.* !notebook.direction.*'",
        );
        expect(result.output).toContain('🌊 naught was moved — 1 refusal');
      });

      then('the render matches the snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });
  });
});
