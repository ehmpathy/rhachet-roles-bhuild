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
import { existsSync, readdirSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

import { given, then, useBeforeAll, when } from 'test-fns';

import { asKeyShape } from '../../src/domain.roles/.test/asKeyShape';
import { tempDirs } from '../../src/domain.roles/.test/tempDirs';
import {
  genCall,
  genFixtureHome,
} from '../../src/domain.roles/supervisor/skills/git.crew.tokens.harness';
import { genConsumerRepo, stripAnsi } from '../.test/infra';

afterAll(() => tempDirs.delAll());

// the one crew the fixture home holds, a sandpine behavior tree
const TREE_FIXTURE = 'svc-lessons.beav.feat-book-a-lesson';

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
      env: { ...process.env, ...(input.env ?? {}) },
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
   * .what = the two concurrency verbs, as a consumer meets them: the help that
   *         names their inputs, the refusal a slip meets, and a real read, a
   *         gate grant, and the levers, each on a hermetic fixture home
   *
   * .why  = this journey proves the PUBLISHED verb is found by name, explains
   *         itself, refuses a slip loud with exit 2, and runs whole through the
   *         built package (rule.require.help-on-demand,
   *         rule.require.errors-name-the-fix). the fixture home holds the crews;
   *         the gate's box is a fixture probe record, so its free slot is known
   */
  given('[case3] the concurrency verbs, invoked by name from a consumer', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'supervisor-concur-' });
      execSync('npx rhachet roles link --repo bhuild --role supervisor', {
        cwd: consumer.repoDir,
        stdio: 'pipe',
      });
      const fixture = genFixtureHome({
        slug: 'supervisor-concur-home',
        crews: [
          {
            tree: TREE_FIXTURE,
            branch: 'beav/feat-book-a-lesson',
            bound: true,
            account: 'bert@example.com',
            calls: [genCall({ id: 'msg-a', minsAgo: 30 })],
          },
        ],
      });
      const record = join(fixture.home, 'capacity.record.json');
      writeFileSync(
        record,
        JSON.stringify({
          host: 'sandpine-box',
          cpus: 4,
          mem_total_kb: 16_777_216,
          mem_avail_kb: 12_582_912,
          psi_cpu_some_avg60: '0.00',
          psi_mem_full_avg60: '0.00',
          // the since-boot rows a live probe reads beside the minute ones
          psi_cpu_some_life: '0.400',
          psi_mem_some_life: '0.100',
          sample_sec: 1,
          busy_cores: 3,
          forks_per_sec: 40,
          crews: [
            {
              crew: join(fixture.home, 'git', 'sandpine', '_worktrees', TREE_FIXTURE),
              kind: 'behavior',
              seats: 1,
              procs: 3,
              rss_kb: 1_048_576,
              cores: 1,
            },
          ],
        }),
      );
      return {
        ...consumer,
        fixture,
        env: {
          HOME: fixture.home,
          GIT_FOREST_DIR: fixture.forest,
          // npx keeps its cache under the real home; the fixture home holds none
          npm_config_cache: join(homedir(), '.npm'),
          GIT_GROVE_CAPACITY_FIXTURE_RECORD: record,
        },
      };
    });

    (['git.crew.tokens', 'git.grove.capacity'] as const).forEach(
      (verb, index) => {
        when(`[t${index * 2}] \`rhx ${verb} --help\` is run`, () => {
          const result = useBeforeAll(async () =>
            runAsHuman({ command: `rhx ${verb} --help`, repoDir: scene.repoDir }),
          );

          then('the verb is found and answers with exit 0', () => {
            expect(result.output).not.toMatch(/no skill .*found/);
            expect({ exitCode: result.exitCode }).toEqual({ exitCode: 0 });
          });

          then('the help names usage, inputs, and an example', () => {
            expect(result.output).toContain(verb);
            expect(result.output).toMatch(/usage:/);
            expect(result.output).toMatch(/inputs:/);
            expect(result.output).toMatch(/example:/);
          });

          then('🔴 and the whole help surface holds its shape', () => {
            expect(asSnapshotStable(result.output)).toMatchSnapshot();
          });
        });

        when(`[t${index * 2 + 1}] \`rhx ${verb}\` meets an unknown flag`, () => {
          const result = useBeforeAll(async () =>
            runAsHuman({
              command: `rhx ${verb} --bogus`,
              repoDir: scene.repoDir,
            }),
          );

          then('it refuses as a constraint, exit 2', () => {
            expect({ exitCode: result.exitCode }).toEqual({ exitCode: 2 });
          });

          then('the refusal names the class and the flag at fault', () => {
            expect(result.output).toContain(
              "✋ ConstraintError: unknown flag '--bogus'",
            );
          });

          then('🔴 and the refusal holds its shape', () => {
            expect(asSnapshotStable(result.output)).toMatchSnapshot();
          });
        });
      },
    );

    /**
     * .what = the json record of one rhx run, read off the output
     * .why  = rhx prints its runner banner ahead of the verb's stdout, so the record
     *         is the text from the first `{` on
     */
    const asRecord = (input: { output: string }): ReturnType<typeof JSON.parse> => {
      const plain = stripAnsi(input.output);
      return JSON.parse(plain.slice(plain.indexOf('{')));
    };

    when('[t4] `rhx git.crew.tokens local --json` reads the fixture home', () => {
      const result = useBeforeAll(async () =>
        runAsHuman({
          command: 'rhx git.crew.tokens local --json',
          repoDir: scene.repoDir,
          env: scene.env,
        }),
      );

      then('it exits 0, and the local grove is read', () => {
        expect({ exitCode: result.exitCode }).toEqual({ exitCode: 0 });
        const record = asRecord(result);
        expect(record.groves[0].state).toEqual('read');
      });

      then('the fixture crew is filed as a behavior crew, with a weight', () => {
        const crew = asRecord(result).groves[0].record.crews.find(
          (c: { crew: string }) => c.crew.endsWith(TREE_FIXTURE),
        );
        expect(crew.kind).toEqual('behavior');
        expect(crew.weighted).toBeGreaterThan(0);
      });

      then('🔴 and the record holds its shape', () => {
        expect(asKeyShape(asRecord(result))).toMatchSnapshot();
      });
    });

    when('[t5] `rhx git.grove.capacity --grove local --for behavior` asks the gate', () => {
      const result = useBeforeAll(async () =>
        runAsHuman({
          command:
            'rhx git.grove.capacity --grove local --for behavior --key beav/feat-surf-forecast --sample 1 --json',
          repoDir: scene.repoDir,
          env: scene.env,
        }),
      );

      then('it grants the one free slot, exit 0, under a hold named for the key', () => {
        expect({ exitCode: result.exitCode }).toEqual({ exitCode: 0 });
        const answer = asRecord(result);
        expect(answer.granted).toEqual(true);
        expect(answer.hold).toEqual('local.behavior.beav+feat-surf-forecast');
      });

      then('🔴 and the decision holds its shape', () => {
        expect(asKeyShape(asRecord(result))).toMatchSnapshot();
      });
    });

    // `--levers` is the only path that reads git.grove.capacity.levers.jsonc, so a run
    // proves the table shipped beside the verb
    when('[t6] `rhx git.grove.capacity local --levers` ranks the levers', () => {
      const result = useBeforeAll(async () =>
        runAsHuman({
          command: 'rhx git.grove.capacity local --sample 1 --levers --json',
          repoDir: scene.repoDir,
          env: scene.env,
        }),
      );

      then('it exits 0, the levers table read from the package', () => {
        expect({ exitCode: result.exitCode }).toEqual({ exitCode: 0 });
        expect(result.output).not.toContain('the levers table is unreadable');
      });

      then('the shipped levers are priced on the local grove', () => {
        const slugs = asRecord(result).groves[0].levers.map(
          (lever: { slug: string }) => lever.slug,
        );
        expect(slugs).toContain('slimmer-boot-briefs');
        expect(slugs).toContain('small-context-forks');
      });

      then('🔴 and the levers record holds its shape', () => {
        expect(asKeyShape(asRecord(result))).toMatchSnapshot();
      });
    });

    /**
     * .what = a human tree as a consumer reads it, only its clock-driven figures masked
     * .why  = a key shape pins types, so a grant and a refusal share one; the tree is the
     *         render a human reads, runner banner and all (5.3 i005 r10.nitpick.1, r11.4).
     *         the fixture record fixes the box, so its slot counts, its stall marks and the
     *         stall lines stay visible: a regression to `0 left` or a 99% line goes red
     *         (5.3 i006 r10.nitpick.4, r11.1). only the token figures, which the burn
     *         window reads off the clock, and a hold's lapse, which counts down, are masked
     */
    const TOKEN_FIGURE = String.raw`\d+(?:\.\d+)?[KMG]?`;
    const asMaskedTree = (input: { output: string }): string =>
      asSnapshotStable(input.output)
        .split(scene.fixture.home)
        .join('<home>')
        .replace(new RegExp(`${TOKEN_FIGURE}/h\\b`, 'g'), 'N/h')
        .replace(new RegExp(`(fleet: |forks |per crew-hour: behavior |· directive )${TOKEN_FIGURE}`, 'g'), '$1N')
        .replace(new RegExp(`(: |\\]: )${TOKEN_FIGURE}( over | \\()`, 'g'), '$1N$2')
        .replace(/(tokens_(?:5h|7d)) \d+/g, '$1 N')
        .replace(/lapses in \d+ min/g, 'lapses in N min');

    when('[t7] `rhx git.grove.capacity local` renders the read', () => {
      const result = useBeforeAll(async () =>
        runAsHuman({
          command: 'rhx git.grove.capacity local --sample 1',
          repoDir: scene.repoDir,
          env: scene.env,
        }),
      );

      then('it exits 0 and names each kind on the local grove', () => {
        expect({ exitCode: result.exitCode }).toEqual({ exitCode: 0 });
        expect(result.output).toContain('grove local:');
        expect(result.output).toMatch(/behavior: affordable/);
      });

      then('🔴 and the read tree holds its shape', () => {
        expect(asMaskedTree(result)).toMatchSnapshot();
      });
    });

    // the hold of [t5] takes the box's one free slot: drop it, then ask as a human does
    when('[t8] `rhx git.grove.capacity --for behavior` grants a slot, as a tree', () => {
      const result = useBeforeAll(async () => {
        const release = runAsHuman({
          command: 'rhx git.grove.capacity --release local.behavior.beav+feat-surf-forecast',
          repoDir: scene.repoDir,
          env: scene.env,
        });
        expect(release.exitCode).toEqual(0);
        return runAsHuman({
          command:
            'rhx git.grove.capacity --grove local --for behavior --key beav/feat-coachbook --sample 1',
          repoDir: scene.repoDir,
          env: scene.env,
        });
      });

      then('it grants the slot, exit 0, the hold named for the key', () => {
        expect({ exitCode: result.exitCode }).toEqual({ exitCode: 0 });
        expect(result.output).toContain('✅ a behavior slot on local');
        expect(result.output).toContain(
          'rhx git.grove.capacity --release local.behavior.beav+feat-coachbook',
        );
      });

      then('🔴 and the grant tree holds its shape', () => {
        expect(asMaskedTree(result)).toMatchSnapshot();
      });
    });

    // the grant of [t8] now holds the one slot: a second key meets a full box
    when('[t9] a second key asks the full box, as a tree', () => {
      const result = useBeforeAll(async () =>
        runAsHuman({
          command:
            'rhx git.grove.capacity --grove local --for behavior --key beav/feat-cert-ingest --sample 1',
          repoDir: scene.repoDir,
          env: scene.env,
        }),
      );

      then('the refusal passes through rhx as exit 2, the held slot named', () => {
        expect({ exitCode: result.exitCode }).toEqual({ exitCode: 2 });
        expect(result.output).toContain('✋ ConstraintError: no behavior slot on local');
        expect(result.output).toContain('held by sprouts in flight: 1');
      });

      // the box has room, and the hold of [t8] alone fills it: the way out is that hold
      then('it names the hold that fills the box, its lapse, and --release', () => {
        expect(result.output).toMatch(
          /└─ local\.behavior\.beav\+feat-coachbook · behavior · lapses in \d+ min/,
        );
        expect(result.output).toContain('rhx git.grove.capacity --release <hold>');
        expect(result.output).not.toContain('idle crews');
      });

      then('🔴 and the full-box refusal tree holds its shape', () => {
        expect(asMaskedTree(result)).toMatchSnapshot();
      });
    });

    // a box whose cpu stall sits past the 🔴 line takes no sprout, whatever its free slots
    when('[t10] a key asks a box stalled on cpu, as a tree', () => {
      const result = useBeforeAll(async () => {
        const stalled = join(scene.fixture.home, 'capacity.record.stalled.json');
        writeFileSync(
          stalled,
          JSON.stringify({
            host: 'sandpine-box',
            cpus: 4,
            mem_total_kb: 16_777_216,
            mem_avail_kb: 12_582_912,
            psi_cpu_some_avg60: '12.50',
            psi_mem_full_avg60: '0.00',
            psi_cpu_some_life: '0.400',
            psi_mem_some_life: '0.100',
            sample_sec: 1,
            busy_cores: 1,
            forks_per_sec: 40,
            crews: [
              {
                crew: join(scene.fixture.home, 'git', 'sandpine', '_worktrees', TREE_FIXTURE),
                kind: 'behavior',
                seats: 1,
                procs: 3,
                rss_kb: 1_048_576,
                cores: 1,
              },
            ],
          }),
        );
        return runAsHuman({
          command:
            'rhx git.grove.capacity --grove local --for behavior --key beav/feat-spot-forecast-widget --sample 1',
          repoDir: scene.repoDir,
          env: { ...scene.env, GIT_GROVE_CAPACITY_FIXTURE_RECORD: stalled },
        });
      });

      then('the stall refusal passes through rhx as exit 2, the stall and the seed named', () => {
        expect({ exitCode: result.exitCode }).toEqual({ exitCode: 2 });
        expect(result.output).toContain('cpu stall 🔴 12.50%');
        expect(result.output).toContain('rhx radio.task.push');
      });

      then('🔴 and the stall refusal tree holds its shape', () => {
        expect(asMaskedTree(result)).toMatchSnapshot();
      });
    });

    // the human renders of the token verb, and of the levers table, through rhx (5.3 i006
    // r10.nitpick.2, r11.6): [t4] and [t6] pin only their json key shapes
    when('[t11] `rhx git.crew.tokens local` renders the read', () => {
      const result = useBeforeAll(async () =>
        runAsHuman({
          command: 'rhx git.crew.tokens local',
          repoDir: scene.repoDir,
          env: scene.env,
        }),
      );

      then('it exits 0 and files the fixture crew as a behavior crew', () => {
        expect({ exitCode: result.exitCode }).toEqual({ exitCode: 0 });
        expect(result.output).toContain('🌲 crew tokens over 180 min');
        expect(result.output).toContain(`${TREE_FIXTURE} [behavior]`);
      });

      then('🔴 and the read tree holds its shape', () => {
        expect(asMaskedTree(result)).toMatchSnapshot();
      });
    });

    when('[t12] `rhx git.crew.tokens calibrate` renders the calibration', () => {
      const result = useBeforeAll(async () =>
        runAsHuman({
          command: 'rhx git.crew.tokens calibrate',
          repoDir: scene.repoDir,
          env: scene.env,
        }),
      );

      // the fixture home holds no cap ledger, so both windows read ⚪ and name the wire-up
      then('it exits 0 and names the cap ledger to wire, per window', () => {
        expect({ exitCode: result.exitCode }).toEqual({ exitCode: 0 });
        expect(result.output).toContain('🌲 crew tokens · calibrate');
        expect(result.output).toMatch(
          /five_hour: ⚪ uncalibrated — the cap ledger holds no rows/,
        );
        expect(result.output).toMatch(
          /seven_day: ⚪ uncalibrated — the cap ledger holds no rows/,
        );
      });

      then('🔴 and the calibrate tree holds its shape', () => {
        expect(asMaskedTree(result)).toMatchSnapshot();
      });
    });

    when('[t13] `rhx git.grove.capacity local --levers` renders the levers', () => {
      const result = useBeforeAll(async () =>
        runAsHuman({
          command: 'rhx git.grove.capacity local --sample 1 --levers',
          repoDir: scene.repoDir,
          env: scene.env,
        }),
      );

      then('it exits 0 and ranks the shipped levers against the axis that binds', () => {
        expect({ exitCode: result.exitCode }).toEqual({ exitCode: 0 });
        expect(result.output).toContain('levers, by gain in behavior slots against cpu');
        expect(result.output).toContain('slimmer-boot-briefs:');
      });

      then('🔴 and the levers tree holds its shape', () => {
        expect(asMaskedTree(result)).toMatchSnapshot();
      });
    });
  });
});
