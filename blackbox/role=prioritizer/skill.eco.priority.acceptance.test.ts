/**
 * .what = clamps that the PACKAGE ships every runtime asset the skill shells out to
 *
 * .why  = 🔴 `ecowork.sh:170` runs `node "$__ECO_LIB_DIR/ecowork.db.mjs"`. that
 *         `.mjs` is the store — every `set`, `get`, and `del` goes through it.
 *
 *         and `build:complete:dist` copies non-ts assets with an rsync allowlist
 *         that ends `--exclude='*'`. it carried rules for `*.sh`, `*.yml`,
 *         `*.md`, `*.jsonc` — and **none for `*.mjs`**. so the skill shipped,
 *         resolved, ran, and died on its first store call with `Cannot find
 *         module`, for every consumer.
 *
 *         ⚠️ this hazard is NOT in the handoff. its §6 is titled *"the port
 *         hazards"* — a closed-set title over an open set.
 *
 *         it is invisible to every other grain: the unit and integration suites
 *         read `src/`, where the file has always been. **only a run through
 *         `dist/`, from a repo that holds no source, can see it**
 *         (rule.require.test-coverage-by-grain).
 *
 * .how  = a consumer repo that links the published role and invokes the skill as
 *         a human would. no mock, because the whole subject is whether the built
 *         artifact is complete (rule.forbid.acceptance.mocks), and the action
 *         goes through the skill contract rather than any internal
 *         (rule.require.acceptance.blackbox).
 *
 * ⚠️ .the mirror half is guarded elsewhere, because this test cannot see it.
 *         the same audit found `work.harness.ts` compiled INTO `dist/` as a
 *         dev-only asset. a package with an extra file still runs — so this test
 *         is blind to it by construction. `buildBoundary.integration.test.ts`
 *         holds that half: it asserts every `.ts` inside a skills dir wears a
 *         dev-only marker, and that the build config excludes each marker.
 */
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { genConsumerRepo, stripAnsi } from '../.test/infra';

/**
 * .what = mask the per-run values in a captured cli output
 *
 * .why  = a snapshot must diff on the CONTRACT and never on the run. three
 *         things vary per run and none is contract:
 *           - the ansi color bytes a captured stderr carries, which are terminal
 *             control rather than content (rule.forbid.snapshot-visual-blemishes)
 *           - the consumer repo dir, which `mkdtempSync` suffixes at random
 *           - 🔴 the `seen_at` / `set_at` stamps the store writes from the wall
 *             clock. these are the sharp one: the csv snapshot below went red on
 *             its own second run without this mask, and a snapshot that fails
 *             for a reason no human changed teaches everyone to re-snap blind
 *
 * .note = it masks exactly those three and no more. every further difference is
 *         a change to the contract, which is the whole point of the snapshot
 */
const asSnapshotStable = (output: string): string =>
  stripAnsi(output)
    // /tmp/eco-priority-dist-Ab3xK9 -> /tmp/{REPO}
    .replace(/\/tmp\/eco-priority-dist-[A-Za-z0-9]+/g, '/tmp/{REPO}')
    // 2026-09-28T11:11:22.644Z -> {TIME}
    .replace(/\d{4}-\d{2}-\d{2}T[\d:]+\.\d+Z/g, '{TIME}');

/**
 * .what = invokes the skill the way a HUMAN does — `rhx <skill> <verb>`
 *
 * .why  = the shared `runRhachetSkill` helper prefixes its args with a literal
 *         `--` separator, which `eco.priority` then reads as its VERB. every
 *         peer acceptance suite passes flags, so the separator lands harmlessly
 *         there and only a verb-first surface trips on it.
 *
 *         ⇒ and the `rhx` form is the truer subject anyway: it resolves the
 *         skill by NAME across every linked role, which is the reach this whole
 *         graduation exists to buy
 */
const runAsHuman = (input: {
  command: string;
  repoDir: string;
}): { output: string; exitCode: number } => {
  try {
    const stdout = execSync(`npx ${input.command}`, {
      cwd: input.repoDir,
      encoding: 'utf-8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
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

describe('prioritizer.eco.priority acceptance (as consumer)', () => {
  given('[case1] a consumer repo that holds the package and no source', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'eco-priority-dist-' });
      // the prioritizer is not among the roles `genConsumerRepo` links by
      // default, and it is linked HERE rather than added there so no peer
      // acceptance suite pays for a role it never invokes
      execSync('npx rhachet roles link --repo bhuild --role prioritizer', {
        cwd: consumer.repoDir,
        stdio: 'pipe',
      });
      return consumer;
    });

    when('[t0] the skill is invoked through the built package', () => {
      const result = useBeforeAll(async () =>
        runAsHuman({ command: 'rhx eco.priority get', repoDir: scene.repoDir }),
      );

      // ANTI-VACUITY: a skill that never resolved would satisfy the claim below
      // for the wrong reason — its store is never reached, so no absent asset is
      // ever named. and `no skill found` is the lift's OWN symptom, so a pass
      // here is the reach this whole graduation exists to buy
      then('the skill resolves from the package', () => {
        expect(result.output).not.toMatch(/no skill .*found/);
      });

      // 🔴 THE teeth. a `.mjs` dropped by the rsync allowlist surfaces here and
      //    nowhere else — every suite that reads `src/` stays green
      then('🔴 every runtime asset it shells out to shipped with it', () => {
        expect(result.output).not.toContain('Cannot find module');
      });

      // and the whole invocation must SUCCEED, not merely avoid one string — a
      // future asset dropped by the same allowlist may fail with other words
      then('and the invocation succeeds end to end', () => {
        expect({ exitCode: result.exitCode }).toEqual({ exitCode: 0 });
      });

      // the role ships; the store does not. a repo that never hosted the
      // prioritizer holds no `.eco/`, and that is an empty rank, never an error
      // (vision case=2 [t1])
      then('and a fresh repo reads as an EMPTY rank', () => {
        expect(result.output).toContain('the rank is empty');
      });

      // the assertion above pins ONE phrase; the snapshot pins the whole
      // surface a human meets on their first ever run — the nudge, its example
      // command, the glyphs, the alignment. a `.toContain` stays green while
      // every line around it rots (rule.require.contract-snapshot-exhaustiveness)
      //
      // ⚠️ and the empty-rank nudge is the one screen that teaches the flags, so
      //    a silent change to it teaches the wrong thing
      //    (rule.forbid.fabricated-opines: it must never suggest a sev or urg)
      then('and the whole empty-rank surface holds its shape', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });

    // [t1] reached the store only far enough to find it empty. a WRITE is the
    // path the dropped `.mjs` broke hardest: it is where every consumer's first
    // real use lands (vision case=2 [t2], case=8)
    when('[t1] a priority is recorded, then read back', () => {
      const result = useBeforeAll(async () => {
        const written = runAsHuman({
          command:
            "rhx eco.priority set --slug 'bigrock://sandpine' --sev p2 --urg 1m --what 'fix the nullability defect'",
          repoDir: scene.repoDir,
        });
        const read = runAsHuman({
          command: 'rhx eco.priority get',
          repoDir: scene.repoDir,
        });
        return { written, read };
      });

      then('the write succeeds through the built package', () => {
        expect({ exitCode: result.written.exitCode }).toEqual({ exitCode: 0 });
      });

      // 🔴 the csv is the TRUTH and the db a derived CACHE — both must land,
      //    and the csv must hold the row, or the repo's git holds naught
      //    (define.invariant.eco.the-csv-is-truth-the-db-is-a-cache)
      //
      // .note = read ONCE via useThen, shared by the two assertions below
      //   (rule.require.useThen-useWhen-for-shared-results). it is a `useThen`
      //   rather than a hoist into the `useBeforeAll` above on purpose: a write
      //   that fails must still let `then('the write succeeds')` report its exit
      //   code, and an ENOENT thrown from the scene would take that diagnosis
      //   down with it
      const read = useThen('🔴 the csv is written as truth', () => {
        const path = join(scene.repoDir, '.eco', 'priority.csv');
        expect(existsSync(path)).toEqual(true);
        return { csv: readFileSync(path, 'utf8') };
      });

      then('and it holds the row', () => {
        expect(read.csv).toContain('bigrock://sandpine');
      });

      // 🔴 the csv is the one artifact that lands in a consumer's GIT, so its
      //    column order and header ARE a published contract — a reordered column
      //    silently rewrites every row a prior version wrote, and no
      //    `.toContain` can see it
      then('🔴 and the csv it writes holds its exact shape', () => {
        expect(asSnapshotStable(read.csv)).toMatchSnapshot();
      });

      then('and the db is derived beside it as the cache', () => {
        expect(existsSync(join(scene.repoDir, '.eco', 'priority.db'))).toEqual(
          true,
        );
      });

      // (vision case=2 [t3], rule.always.render-priorities-as-treestruct)
      then('and the read renders the row as a treestruct', () => {
        expect({ exitCode: result.read.exitCode }).toEqual({ exitCode: 0 });
        expect(result.read.output).toContain('bigrock://sandpine');
        expect(result.read.output).toContain('└─');
      });

      // 🔴 a `└─` proves ONE glyph reached the output; it cannot prove the tree
      //    is a tree. a rank that lost its indent, dropped its sev column, or
      //    misplaced a glyph still holds a `└─` somewhere and stays green
      //    (rule.always.render-priorities-as-treestruct)
      then('🔴 and the treestruct it renders holds its exact shape', () => {
        expect(asSnapshotStable(result.read.output)).toMatchSnapshot();
      });
    });

    // 🔴 a ONE-row rank can only ever render the LAST row, so it exercises
    //    exactly one of the two lead glyphs — and the other stays unproven.
    //
    //    that gap shipped a real blemish: every child line hardcoded a `│`
    //    rail regardless of its row's lead, so the terminal row's children
    //    hung off a pipe with naught below it. the one-row snapshot held
    //    that stray pipe as though it were the contract, and a peer
    //    reviewer — not this suite — is what caught it on 2026-09-28.
    //
    //    ⇒ two rows is the FLOOR that can tell `├─` from `└─`
    //      (rule.forbid.snapshot-visual-blemishes,
    //       rule.always.render-priorities-as-treestruct)
    when('[t2] a second priority joins the rank', () => {
      const result = useBeforeAll(async () => {
        runAsHuman({
          command:
            "rhx eco.priority set --slug 'altrock://sandpine/tidy-the-docs' --sev p3 --urg 1w --what 'tidy the readme'",
          repoDir: scene.repoDir,
        });
        return runAsHuman({
          command: 'rhx eco.priority get',
          repoDir: scene.repoDir,
        });
      });

      then('the read still succeeds', () => {
        expect({ exitCode: result.exitCode }).toEqual({ exitCode: 0 });
      });

      then('both rows render', () => {
        expect(result.output).toContain('bigrock://sandpine');
        expect(result.output).toContain('altrock://sandpine/tidy-the-docs');
      });

      // 🔴 the assertion the one-row case cannot make: a NON-terminal row
      //    hangs its children off a live `│`, and a terminal row hangs its
      //    children off blanks. one rank, both glyphs, proven together
      then('🔴 the non-terminal row keeps a live rail under it', () => {
        expect(result.output).toContain('   ├─ p2 · 1m · bigrock://sandpine');
        expect(result.output).toContain('   │     ├─ what: fix the nullability');
      });

      then('🔴 and the terminal row hangs its children off blanks', () => {
        expect(result.output).toContain(
          '   └─ p3 · 1w · altrock://sandpine/tidy-the-docs',
        );
        expect(result.output).toContain('         ├─ what: tidy the readme');
      });

      then('🔴 and the two-row treestruct holds its exact shape', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });
  });
});
