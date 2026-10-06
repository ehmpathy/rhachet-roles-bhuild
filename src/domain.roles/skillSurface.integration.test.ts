/**
 * .what = the collapsed dimensional walk of every skill entrypoint the two
 *         lifted roles ship — `supervisor` (45) and `prioritizer` (2)
 *
 * .why  = 🔴 this lift moves 47 entrypoints into a PUBLISHED package, and not
 *         one of them has ever been graded on its invocation contract. the
 *         origin repo ran ZERO github workflows, so the whole surface arrives
 *         ungated into a repo with nine.
 *
 *         a peer lane named this exact gap from outside: *"no dedicated
 *         ergonomic-friction pass has happened on the 46 skill entrypoints /
 *         49 shell files this lift ships."*
 *
 *         ⚠️ and the per-skill suites cannot close it. each grades ONE skill's
 *         behavior; none asks whether the SURFACE is uniform. a contract defect
 *         that repeats across a family is invisible to every one of them —
 *         **a guard is blind to the axis it does not ask about.**
 *
 * .how  = a dimensional decomposition, walked as a product and collapsed.
 *
 * ## the axes
 *
 * | axis       | values                                       |
 * |------------|----------------------------------------------|
 * | `reach`    | `source` · `package`                         |
 * | `boundary` | `pure` · `local` · `remote`                  |
 * | `input`    | `help` · `unknown` · `passthrough` · `valid` |
 * | `mode`     | `plan` · `apply`                             |
 *
 * ⇒ full product = 2 × 3 × 4 × 2 = **48 cells**
 *
 * ## the collapse — three moves, each earned rather than assumed
 *
 * 1. **`mode` is a member only where `input=valid`.** a reported or refused
 *    invocation never reaches the mode dial. ⇒ 18 cells are `impossible`.
 *
 * 2. 🔴 **`boundary` is a member only where `input=valid`.** every entrypoint
 *    parses its args at the TOP and refuses before one byte of work —
 *    verified at `git.checkout.sh:53`, `git.tree.supervise.sh:51`,
 *    `git.grove.wake.sh:113`. ⇒ a remote skill's `--help` is exactly as
 *    hermetic as a pure one's, so `boundary` has no effect for the three
 *    non-valid shapes and 18 cells collapse to 6.
 *
 *    **this is the collapse that makes the walk possible at all.** without it,
 *    30 of 47 entrypoints would be unreachable here — no grove, no ssm tunnel,
 *    no aws badge in ci.
 *
 * 3. `reach=package` does NOT collapse into `source`: it asks one further
 *    question a source walk cannot — *did the file ship?* — which is
 *    `case=8`'s axis. it needs no per-entrypoint walk though, so it lives at
 *    the acceptance grain (`blackbox/role=supervisor/`).
 *
 * ## the verdicts — all 48 cells accounted
 *
 * | cell group                                    | n | verdict                                  |
 * |-----------------------------------------------|---|------------------------------------------|
 * | `source × {help,unknown,passthrough}`         | 3 | **demoed** — `[case2]`–`[case4]`, here   |
 * | `package × {help,unknown,passthrough}`        | 3 | **demoed** — blackbox                    |
 * | `source × valid × local × {plan,apply}`       | 4 | **demoed** — the 7 lifted suites         |
 * | `* × {help,unknown,passthrough} × mode=apply` |18 | **impossible** — mode not a member       |
 * | `* × {help,unknown,passthrough} × boundary`   |12 | **collapsed** into rows 1+2 (move 2)     |
 * | `* × valid × pure × *`                        | 4 | **impossible** — a pure skill mutates naught |
 * | `* × valid × remote × *`                      | 4 | 🔴 **impossible in ci** — declared below |
 *
 * ⇒ 3 + 3 + 4 + 18 + 12 + 4 + 4 = **48** ✓
 *
 * ## ⚠️ the declared-impossible cell, stated rather than hidden
 *
 * `valid × remote` cannot run here and no amount of test design changes that:
 * it needs a live ec2 grove, an ssm tunnel, and an aws badge. to mock it would
 * verify the mock (`rule.forbid.integration.mocks`). ⇒ it is declared open, and
 * the `boundary` collapse above is what keeps that gap from swallowing the
 * other three input shapes for those same 30 skills.
 *
 * .note = the SUBJECT SET is derived from disk, never hardcoded — so a skill
 *         added tomorrow is walked tomorrow, with no edit here. that is the
 *         whole point of a matrix walk over a per-skill list.
 */
import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { basename, join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getAllFilesRecursive } from './.test/getAllFilesRecursive';
import { tempDirs } from './.test/tempDirs';

const DIR_ROLES = join(__dirname);

/**
 * .what = the two roles this lift graduates, and the only two in scope
 * .why  = the peer roles were gated in their origin repo; these two never were
 */
const ROLES_LIFTED = ['supervisor', 'prioritizer'] as const;

/**
 * .what = a flag no entrypoint declares, used to probe the unknown-input cell
 * .why  = it must be implausible enough that a future skill will not adopt it,
 *         or this guard would quietly stop to grade what it claims to grade
 */
const FLAG_UNDECLARED = '--zzz-no-entrypoint-declares-this';

/**
 * .what = an `awk`/`sed` that slices the file's OWN header to render help
 * .why  = `"$0"` (an entrypoint) and `"${BASH_SOURCE[0]}"` (a lib's sub-command)
 *         are the two ways a shell file names itself, and every help emit under
 *         `skills/` uses one of them. to match on the SELF-reference, rather
 *         than on the word `--help`, is what lets this reach a lib's inner arms
 */
const RE_EMIT_OF_SELF_HEADER = /(awk|sed)\b[^\n]*(\$0|BASH_SOURCE\[0\])/;

/**
 * .what = a slice bounded by a LINE NUMBER rather than by the header's fence
 * .why  = 🔴 a found bound (`/^####/ { exit }`) tracks a header that grows; a
 *         pinned one does not, and it rots in SILENCE — the help still prints,
 *         just short. three live shapes, all measured on this branch:
 *           `sed -n '3,49p'`       stops at 49 whatever the header now says
 *           `NR>=2 && NR<=76`      landed on the fence by luck
 *           `sed -n '2,/^####/p'`  a sed range includes its end line
 *
 * .note = `\d{2,}` on the `NR` arm is deliberate and load-central: the PAVED
 *         form opens `NR<=2 { next }` to skip the shebang and the top fence.
 *         that is a one-digit bound on the SKIP, never on the content, so it
 *         must pass. `[case6]` asserts exactly that discriminator
 */
const RE_BOUND_PINNED =
  /NR\s*[<>]=?\s*\d{2,}|sed\s+-n\s+["']?\s*\d+\s*,\s*(\d+\s*p|\/)/;

/**
 * .what = the three args rhachet injects into EVERY skill it dispatches
 * .why  = a skill that refuses them is unreachable through `rhx`, which is the
 *         one path a consumer actually uses
 */
const ARGS_PASSTHROUGH = [
  '--skill',
  'probe',
  '--repo',
  'bhuild',
  '--role',
  'supervisor',
];

/**
 * .what = every entrypoint the two lifted roles ship, read from disk
 *
 * .why  = a skill is an entrypoint when it sits at the TOP of `skills/`.
 *         `skills/work/*.sh` are libs, and they declare it themselves —
 *         `syncwork.sh:101` reads ".why sourced, never executed: this is the
 *         lib". `[case1]` asserts that declaration rather than trusts it.
 *
 * .note = derived, never hardcoded, so a new skill needs no edit here
 */
const getAllEntrypoints = (): {
  role: string;
  path: string;
  name: string;
}[] =>
  ROLES_LIFTED.flatMap((role) =>
    getAllFilesRecursive({ dir: join(DIR_ROLES, role, 'skills') })
      .filter((path) => path.endsWith('.sh'))
      .filter((path) => !path.includes(join('skills', 'work')))
      .map((path) => ({ role, path, name: basename(path, '.sh') })),
  );

/**
 * .what = runs one entrypoint and captures its full contract — code + output
 * .why  = every cell below grades the SAME observables, so they are gathered
 *         once per (entrypoint, input) pair rather than once per assert
 *         (rule.forbid.redundant-expensive-operations)
 */
const runEntrypoint = (input: {
  path: string;
  args: string[];
  cwd: string;
}): { exitCode: number; output: string } => {
  try {
    const stdout = execFileSync('bash', [input.path, ...input.args], {
      cwd: input.cwd,
      encoding: 'utf-8',
      timeout: 20000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1' },
    });
    return { exitCode: 0, output: stdout };
  } catch (thrown: unknown) {
    const said = thrown as {
      stdout?: Buffer | string;
      stderr?: Buffer | string;
      status?: number | null;
      signal?: string | null;
    };
    return {
      // a timeout kills by signal and leaves status null — surface it as a
      // distinct code rather than let it read as a clean refusal
      exitCode: said.signal ? 124 : (said.status ?? 1),
      output: [said.stdout ?? '', said.stderr ?? '']
        .map((part) => part.toString())
        .join('\n'),
    };
  }
};

describe('the lifted skill surface', () => {
  given('[case1] every entrypoint the two lifted roles ship', () => {
    const scene = useBeforeAll(async () => ({
      entrypoints: getAllEntrypoints(),
      libs: ROLES_LIFTED.flatMap((role) =>
        getAllFilesRecursive({
          dir: join(DIR_ROLES, role, 'skills', 'work'),
        }).filter((path) => path.endsWith('.sh')),
      ),
    }));

    // ANTI-VACUITY. every case below is a `.filter().map()` over this set, and
    // an empty set satisfies each of them for the wrong reason. a floor rather
    // than an exact count, so a NEW skill does not break a guard about OLD ones
    then('both roles are represented, and the set is real', () => {
      expect({
        supervisor:
          scene.entrypoints.filter((e) => e.role === 'supervisor').length >= 40,
        prioritizer:
          scene.entrypoints.filter((e) => e.role === 'prioritizer').length >= 2,
      }).toEqual({ supervisor: true, prioritizer: true });
    });

    // the entrypoint/lib split is the matrix's SUBJECT boundary, so it is
    // asserted rather than assumed — and asserted from the libs' own words,
    // which is the only evidence that cannot drift from them
    then('🔴 every excluded lib declares itself sourced-never-executed', () => {
      const undeclared = scene.libs.filter(
        (path) =>
          !readFileSync(path, 'utf8').includes('sourced, never executed'),
      );
      expect(undeclared).toEqual([]);
    });
  });

  given('[case2] input=help — the discoverability cell', () => {
    const scene = useBeforeAll(async () => {
      const cwd = tempDirs.genOne({ slug: 'skill-surface-help' });
      return {
        results: getAllEntrypoints().map((entry) => ({
          ...entry,
          ...runEntrypoint({ path: entry.path, args: ['--help'], cwd }),
        })),
      };
    });

    when('[t0] each is asked to explain itself', () => {
      // `rule.require.help-on-demand` — "a command with no `--help` (or `-h`)
      // = blocker". the moment a role is PUBLISHED, its help text is the only
      // documentation a consumer has: there is no source tree to read
      then('🔴 every entrypoint answers --help', () => {
        const refusers = scene.results
          .filter((r) => r.exitCode !== 0)
          .map((r) => `${r.role}/${r.name} → exit ${r.exitCode}`);
        expect(refusers).toEqual([]);
      });

      // a help that exits 0 and prints naught is worse than absent — it reads
      // as answered. this is the vacuity guard ON the guard above
      then('and the answer carries a usage', () => {
        const empty = scene.results
          .filter((r) => r.exitCode === 0)
          .filter((r) => !/usage/i.test(r.output))
          .map((r) => `${r.role}/${r.name}`);
        expect(empty).toEqual([]);
      });

      // `rule.require.errors-name-the-fix` applied to help: a consumer who runs
      // `rhx <name> --help` must see WHICH skill answered, or a help printed by
      // a delegated peer reads as the caller's own
      then('and the answer names the skill it speaks for', () => {
        const anonymous = scene.results
          .filter((r) => r.exitCode === 0)
          .filter((r) => !r.output.includes(r.name))
          .map((r) => `${r.role}/${r.name}`);
        expect(anonymous).toEqual([]);
      });
    });
  });

  given('[case3] input=unknown — the fail-loud cell', () => {
    const scene = useBeforeAll(async () => {
      const cwd = tempDirs.genOne({ slug: 'skill-surface-unknown' });
      return {
        results: getAllEntrypoints().map((entry) => ({
          ...entry,
          ...runEntrypoint({ path: entry.path, args: [FLAG_UNDECLARED], cwd }),
        })),
      };
    });

    when('[t0] each is handed a flag it never declared', () => {
      // 🔴 THE sharpest cell, and it is not hypothetical — this exact class bit
      //    this very route. a misspelled `--paths-with` on a review bind was
      //    dropped in silence, so the lane read as narrowed and ran unbounded
      //    for three rounds. `rule.forbid.failhide`: a silent shift is the
      //    canonical shape.
      //
      // 🔴 THE DISCRIMINATOR IS THE EXIT CODE, never `exitCode === 0`, and the
      //    difference carries the whole weight. per exit-code-semantics:
      //
      //      exit 2 = constraint — "you handed me bad input". the ONLY correct
      //               answer to a flag the parser never declared
      //      exit 0 = swallowed outright, then ran to success
      //      exit 1 = 🔴 swallowed, ran, and hit a malfunction downstream
      //
      //    a first draft of this guard tested `exitCode === 0` and PASSED
      //    `duct.audit` and `git.crew.poll` — both of which ignored the flag,
      //    ran, and died on an unrelated environmental gap (no tmux, no store
      //    in ci). their nonzero code read as a refusal. on a developer's real
      //    machine they would have exited 0 with the typo silently dropped.
      //
      //    ⇒ a guard that grades the symptom an environment happens to produce
      //      is a guard that inverts the moment the environment changes
      then('🔴 no entrypoint runs on with a flag it never declared', () => {
        const ranOn = scene.results
          .filter((r) => r.exitCode !== 2)
          .map((r) => ({
            skill: `${r.role}/${r.name}`,
            exitCode: r.exitCode,
            said: r.output.trim().split('\n').slice(0, 2).join(' ⏎ '),
          }));
        expect(ranOn).toEqual([]);
      });

      // a refusal that does not name the flag makes the human diff their own
      // command against the usage to find the typo.
      //
      // ⚠️ a legitimate exception lives here: a skill may fail-fast on an
      //    EARLIER problem — `git.crew.open` answers "✋ --tree required"
      //    before it ever grades the stray flag. correct, so the claim is the
      //    weaker one: name the flag, OR name what was wanted. never fall mute
      then('and the refusal names the flag, or names what it wanted', () => {
        const mute = scene.results
          .filter((r) => r.exitCode === 2)
          .filter(
            (r) =>
              !r.output.includes(FLAG_UNDECLARED) &&
              !/required|unknown|usage/i.test(r.output),
          )
          .map((r) => ({
            skill: `${r.role}/${r.name}`,
            said: r.output.trim().split('\n').slice(0, 2).join(' ⏎ '),
          }));
        expect(mute).toEqual([]);
      });

      // a hang is NOT a refusal. it means the parser let the flag through and
      // the skill reached its boundary — the exact failure the `boundary`
      // collapse (move 2 above) claims cannot happen. ⇒ this assert is what
      // makes that collapse falsifiable rather than merely declared
      then('🔴 and it refuses at the parser, before any boundary', () => {
        const hung = scene.results
          .filter((r) => r.exitCode === 124)
          .map((r) => `${r.role}/${r.name}`);
        expect(hung).toEqual([]);
      });
    });
  });

  given('[case4] input=passthrough — the reachability cell', () => {
    const scene = useBeforeAll(async () => {
      const cwd = tempDirs.genOne({ slug: 'skill-surface-passthrough' });
      return {
        // 🔴 `--help` rides ALONG with the passthrough triple, deliberately.
        //    the triple alone is a VALID invocation for a `get`-shaped skill,
        //    so a bare probe would dispatch `git.grove.list` at a live aws api.
        //    with `--help` the parser consumes the triple, then reports and
        //    exits — so this cell stays in the collapsed, hermetic region
        results: getAllEntrypoints().map((entry) => ({
          ...entry,
          bare: runEntrypoint({ path: entry.path, args: ['--help'], cwd }),
          dispatched: runEntrypoint({
            path: entry.path,
            args: [...ARGS_PASSTHROUGH, '--help'],
            cwd,
          }),
        })),
      };
    });

    when('[t0] each is dispatched the way rhachet dispatches it', () => {
      // the narrow, universal claim: whatever else an entrypoint does with this
      // invocation, it must not reject the three args rhachet ALWAYS injects.
      // a skill that does is unreachable through `rhx` — which is the only path
      // a consumer has, and the precise reach this graduation exists to buy
      then('🔴 none refuses the args rhachet always injects', () => {
        const rejecters = scene.results
          .filter((r) =>
            ['--skill', '--repo', '--role'].some((arg) =>
              new RegExp(`unknown[^\\n]*${arg}`).test(r.dispatched.output),
            ),
          )
          .map((r) => `${r.role}/${r.name}`);
        expect(rejecters).toEqual([]);
      });

      // 🔴 THE cell that matters, and a first draft missed it by a mile.
      //
      //    `duct.audit` read `--help` as a POSITIONAL probe — `[[ "${1:-}" ==
      //    "--help" ]]` — so it answered a developer who typed the flag first
      //    and IGNORED it for every consumer, because rhachet injects
      //    `--skill <name> --repo <r> --role <r>` ahead of every user arg.
      //    `rhx duct.audit --help` ran the audit.
      //
      //    ⚠️ the earlier assert here only caught a HANG, so it passed that
      //      defect green. the claim has to be an EQUALITY — dispatch changes
      //      naught — because the broken shape is not a crash, it is a
      //      different-but-successful answer
      then('🔴 dispatch does not change the verdict', () => {
        const divergent = scene.results
          .filter((r) => r.bare.exitCode !== r.dispatched.exitCode)
          .map((r) => ({
            skill: `${r.role}/${r.name}`,
            bare: r.bare.exitCode,
            dispatched: r.dispatched.exitCode,
          }));
        expect(divergent).toEqual([]);
      });

      // and a skill that answers help bare must print the SAME help under
      // dispatch — an equal exit code with unequal output is the same defect
      // one layer down
      then('and the help it prints under dispatch is the same help', () => {
        const divergent = scene.results
          .filter((r) => r.bare.exitCode === 0)
          .filter((r) => r.bare.output !== r.dispatched.output)
          .map((r) => `${r.role}/${r.name}`);
        expect(divergent).toEqual([]);
      });

      // 🔴 most of these skills emit `--help` by a slice of their OWN header,
      //    a block fenced top and bottom by a `#####…` rule. two defects fall
      //    out of a slice bound by a pinned line number, and BOTH were live
      //    when this cell was written — measured across 24 sites:
      //
      //      7 sites TRUNCATED   — 77 content lines lost. three cut the
      //                            `exit 0 / 1 / 2` contract; one cut the 47
      //                            lines that explain its own security hazard
      //     12 sites OVER-READ   — past the fence, into section rules and the
      //                            raw bash beneath them
      //
      //    ⚠️ neither shape crashes, and neither is visible to a per-skill
      //      suite. a truncated help still LOOKS complete — which is why the
      //      surface-wide axis is the only place this can be asked
      //      (rule.require.help-on-demand)
      then('🔴 no help leaks the header fence, or the source past it', () => {
        const leaky = scene.results
          .filter((r) => r.bare.exitCode === 0)
          .filter((r) => /^#####/m.test(r.bare.output))
          .map((r) => `${r.role}/${r.name}`);
        expect(leaky).toEqual([]);
      });

      then('🔴 no header-sliced help stops short of its own header', () => {
        // scoped to the emit shape under test: a skill whose help is hand-rolled
        // from `echo` lines owes no claim about its file header
        const isHeaderSliced = (source: string): boolean =>
          /awk 'NR<=2|sed -n '\d/.test(source);

        // the last non-blank content line between the header's two fences
        const getHeaderTail = (source: string): string | null => {
          const lines = source.split('\n');
          const fences = lines.flatMap((line, i) =>
            /^#####/.test(line) ? [i] : [],
          );
          if (fences.length < 2) return null;
          const content = lines
            .slice(fences[0]! + 1, fences[1]!)
            .map((line) => line.replace(/^# ?/, '').trimEnd())
            .filter((line) => line.trim().length > 0);
          return content.at(-1) ?? null;
        };

        const truncated = scene.results
          .filter((r) => r.bare.exitCode === 0)
          .map((r) => ({ r, source: readFileSync(r.path, 'utf-8') }))
          .filter(({ source }) => isHeaderSliced(source))
          .map(({ r, source }) => ({ r, tail: getHeaderTail(source) }))
          .filter(({ tail }) => tail !== null)
          .filter(({ r, tail }) => !r.bare.output.includes(tail!))
          .map(({ r, tail }) => `${r.role}/${r.name}: lost "${tail}"`);
        expect(truncated).toEqual([]);
      });

      then('the two clamps above are not vacuous', () => {
        // ANTI-VACUITY: a scene that collected no answered help would pass
        // both assertions over an empty set
        const answered = scene.results.filter((r) => r.bare.exitCode === 0);
        expect(answered.length).toBeGreaterThan(20);

        // and the fence regex must actually bite on a fence
        expect(
          /^#####/m.test('.what = a skill\n#####################'),
        ).toEqual(true);
      });
    });
  });

  // 🔴 [case4] RUNS each help and grades its output, so its subject is bounded
  //    by `getAllEntrypoints` — which deliberately excludes `skills/work/*.sh`
  //    (line 134), because those are LIBS: sourced, never executed, so there is
  //    no `bash lib.sh --help` to run. that exclusion is correct and it leaves
  //    a hole: the 12 sub-command help emits inside `crewwork.*` carry the same
  //    defect class [case4] clamps, and no runtime clamp can reach them.
  //
  //    ⇒ so this case grades the SOURCE instead of the output. it cannot prove
  //      a lib's help reads well; it CAN prove no help emit anywhere under
  //      `skills/` is bounded by a PINNED LINE NUMBER — which is the mechanism
  //      behind both live failure shapes, measured at this stone:
  //        `sed -n '3,49p'`      truncated 7 helps, dropped 77 content lines
  //        `NR>=2 && NR<=76`     landed on the fence by luck, one edit from loss
  //        `sed -n '2,/^####/p'` a sed range includes its end line -> fence leak
  //      a FOUND bound (`/^####/ { exit }`) cannot rot when a header grows; a
  //      pinned one rots silently, and silence is the whole harm.
  given('[case5] the SOURCE of every shell file under skills/', () => {
    const scene = useBeforeAll(async () => {
      const files = ROLES_LIFTED.flatMap((role) =>
        getAllFilesRecursive({ dir: join(DIR_ROLES, role, 'skills') })
          .filter((path) => path.endsWith('.sh'))
          .map((path) => ({ role, path })),
      );
      const emits = files.flatMap(({ role, path }) =>
        readFileSync(path, 'utf-8')
          .split('\n')
          .map((line, i) => ({ role, path, line, no: i + 1 }))
          .filter(({ line }) => RE_EMIT_OF_SELF_HEADER.test(line)),
      );
      return { files, emits };
    });

    when('[t0] each help emit is read for a pinned bound', () => {
      then(
        'the scan is not vacuous — it found the lib emits [case4] cannot',
        () => {
          // ANTI-VACUITY, and it names the exact gap this case exists to close:
          // the walk must reach inside `skills/work/`, which [case4] filters out
          expect(scene.emits.length).toBeGreaterThan(20);
          expect(
            scene.emits.some((e) => e.path.includes(join('skills', 'work'))),
          ).toEqual(true);
        },
      );

      then('🔴 no help emit is bounded by a pinned line number', () => {
        const pinned = scene.emits
          .filter(({ line }) => RE_BOUND_PINNED.test(line))
          .map(({ role, path, no }) => `${role}/${basename(path)}:${no}`);
        expect(pinned).toEqual([]);
      });
    });
  });

  given('[case6] the three emit forms this branch repaired', () => {
    when('[t0] each is held against the same two regexes', () => {
      then('🔴 all three go RED — the bite proof', () => {
        // verbatim, as each read on this branch before the repair
        const before = [
          `      sed -n '3,49p' "$0" | sed 's/^# \\{0,1\\}//'`,
          `  awk 'NR>=2 && NR<=76' "$0" | sed 's/^# \\{0,1\\}//'`,
          `      sed -n '2,/^####/p' "$0"`,
        ];
        const caught = before.filter(
          (line) =>
            RE_EMIT_OF_SELF_HEADER.test(line) && RE_BOUND_PINNED.test(line),
        );
        expect(caught).toEqual(before);
      });

      then('the paved form they were repaired to stays GREEN', () => {
        const paved = `      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"`;
        expect(RE_EMIT_OF_SELF_HEADER.test(paved)).toEqual(true);
        // 🔴 the discriminator: `NR<=2` is a one-digit SKIP of the shebang, so
        //    \d{2,} lets it through, while `NR<=76` — a pinned UPPER bound on
        //    content — is caught. the repair must not trip its own clamp
        expect(RE_BOUND_PINNED.test(paved)).toEqual(false);
      });
    });
  });
});
