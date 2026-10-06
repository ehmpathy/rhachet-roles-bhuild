/**
 * .what = clamps that every entrypoint ARMS the shell before it sources a work
 *         primitive — `-u` and `-o pipefail`, above the `source` line
 *
 * .why  = 🔴 `crewwork.sh`, `ductwork.sh`, `termwork.sh`, and `syncwork.sh` are
 *         **sourced libraries**. not one of the four declares its own `set -uo
 *         pipefail`, and that is correct — a sourced file that sets shell
 *         options mutates its caller's shell, which is a side effect a library
 *         has no business having.
 *
 *         ⇒ so the ~150 functions they define run under whatever options the
 *         ENTRYPOINT armed. the contract is real, load-bearing, and kept
 *         entirely by hand: 32 entrypoints, each of which independently
 *         remembers to arm the shell first.
 *
 *         a 33rd that forgets runs every one of those functions with `-u` off.
 *         an unset variable then expands to the empty string instead of a
 *         fatal error — so `rm -rf "$dir/"` becomes `rm -rf "/"`, `ssh
 *         "$host"` reaches the wrong box, and a duct writes into a tree that
 *         is not the one it named. the failure is not a crash; it is a
 *         CORRECT-LOOKING run against the wrong target.
 *
 *         and `-o pipefail` off is quieter still: a pipeline reports the exit
 *         code of its LAST stage, so `capture | parse` reads clean when the
 *         capture failed and the parse tidily produced an empty result from an
 *         empty input. that is `rule.forbid.failhide`, at the shell level.
 *
 * .the gap this closes = the only related check today
 *         (`work.surface.scope.integration.test.ts`) spot-verifies the prelude in
 *         exactly ONE file, for a narrower claim. one instance, graded; the
 *         class, ungraded. `rule.require.clamp-edge-cases` names that shape
 *         directly — *"treat the defect as an edge-case class, not a point
 *         event"*.
 *
 * .how  = for each `.sh` that sources a work lib, find the first `set -…` that
 *         arms BOTH, and assert its line precedes every `source` of a lib.
 *
 *         ⚠️ the ORDER is the claim, never the presence. a `set -uo pipefail`
 *         below the source line arms the shell after ~150 functions were
 *         already defined under the old options — which is legal bash, reads
 *         correct at a glance, and is exactly the defect. so a presence-only
 *         check would pass the one case worth catching.
 *
 * .note = zero violations today. this is a clamp on a contract that HOLDS, so
 *         it buys no repair — it buys the guarantee that the 33rd entrypoint
 *         cannot quietly break it.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getAllFilesRecursive } from './.test/getAllFilesRecursive';

const DIR_ROLES = __dirname;

/**
 * .what = the sourced libraries that assume, and never set, the options
 *
 * 🔴 .why `ecowork` is DELIBERATELY not a member, though it is a 5th sourced
 *         `work/` lib and it DOES self-arm (`ecowork.sh:140`) — which reads at
 *         first glance as the exact violation this file polices, invisible
 *         because the scope stops at four.
 *
 *         it is not, and the discriminator is who sources it:
 *
 *         | the 4 here | `ecowork` |
 *         |---|---|
 *         | sourced only by entrypoints that arm first | sourced BARE, 21 times |
 *
 *         ⇒ measured 2026-09-25: one production caller (`eco.priority.sh:550`,
 *         armed at `:548`) and 21 `bash -c "source ecowork.sh; <verb>"` sites in
 *         the `ecowork.*.integration.test.ts` parts. `bash -c` arms no options, so the
 *         self-arm is what gives those 21 their `-u` and `pipefail`. remove it
 *         to satisfy this contract and 21 invocations silently lose fail-fast.
 *
 *         ⇒ so `ecowork` is a HYBRID — a lib its own harness drives as a
 *         surface — and this contract is written for the pure-lib shape. the
 *         scope of four is the correct scope, and the reason now rides here
 *         rather than in a reviewer's head.
 *
 * ⚠️ .and this is the SECOND read of that divergence. peer
 *         `arch-opport-decomposition`'s lens at i004 named it a violation and
 *         proposed the removal, on the premise that both callers arm first. the
 *         premise missed the 21 bare sites, so the proposal would have caused
 *         the harm it meant to prevent. ⇒ a scope that looks too narrow is worth
 *         a caller census before it is widened.
 */
const LIBS_WORK = ['crewwork', 'ductwork', 'termwork', 'syncwork'];

/** .what = the measured size of the callsite set, as a RATCHET floor */
const QUANT_CALLSITES = 32;

/**
 * .what = does this line arm BOTH `-u` and `-o pipefail`?
 * .why  = two spellings are in use — `set -uo pipefail` and `set -euo
 *         pipefail`. both arm the pair, and `-e` is an orthogonal choice the
 *         entrypoints make for their own reasons. so the grade is on the two
 *         options that the LIBS depend on, never on the exact string
 */
const isArmed = (input: { line: string }): boolean => {
  const [, flags = ''] = /^set -([a-z]+)/.exec(input.line.trim()) ?? [];
  return flags.includes('u') && input.line.includes('pipefail');
};

/**
 * .what = does this line DISARM `-u` or `-o pipefail`?
 * .why  = an arm above the source proves naught if a `set +u` or `set +o
 *         pipefail` sits between them — the libs would then load unarmed while
 *         the order check stays green. peer i014 found that gap. `-e` stays out
 *         of scope: its `set +e` toggles are an extant, deliberate pattern
 */
const isDisarmed = (input: { line: string }): boolean => {
  const trimmed = input.line.trim();
  const [, flags = ''] = /^set \+([a-z]+)/.exec(trimmed) ?? [];
  return flags.includes('u') || /^set \+o pipefail\b/.test(trimmed);
};

describe('workPrelude', () => {
  const scene = useBeforeAll(async () => {
    const shells = ['supervisor', 'prioritizer']
      .flatMap((role) =>
        getAllFilesRecursive({ dir: join(DIR_ROLES, role, 'skills') }),
      )
      .filter((path) => path.endsWith('.sh'));

    const callsites = shells.flatMap((path) => {
      const lines = readFileSync(path, 'utf8').split('\n');

      const sourcedAt = lines.flatMap((line, index) =>
        /^\s*source\s/.test(line) &&
        LIBS_WORK.some((lib) => line.includes(`/work/${lib}.sh`))
          ? [index + 1]
          : [],
      );
      if (!sourcedAt.length) return [];

      const armedAt = lines.findIndex((line) => isArmed({ line })) + 1;
      const sourcedFirstAt = Math.min(...sourcedAt);
      const disarmedAt = lines.flatMap((line, index) =>
        index + 1 > armedAt &&
        index + 1 < sourcedFirstAt &&
        isDisarmed({ line })
          ? [index + 1]
          : [],
      );
      return [
        {
          from: path.slice(DIR_ROLES.length + 1),
          armedAt,
          sourcedFirstAt,
          disarmedAt,
        },
      ];
    });

    // `armedAt` is 0 when no line arms the pair at all, and 0 < any source
    // line — so an absent prelude must be caught EXPLICITLY, never left to the
    // order comparison, which would read it as "armed at the very top"
    const unarmed = callsites.filter(({ armedAt }) => armedAt === 0);
    const armedLate = callsites.filter(
      ({ armedAt, sourcedFirstAt }) =>
        armedAt !== 0 && armedAt > sourcedFirstAt,
    );

    // an arm undone before the source line reaches it
    const disarmedBeforeSource = callsites.filter(
      ({ armedAt, disarmedAt }) => armedAt !== 0 && disarmedAt.length > 0,
    );

    return { shells, callsites, unarmed, armedLate, disarmedBeforeSource };
  });

  given('[case1] every entrypoint that sources a work primitive', () => {
    when('[t0] its prelude is read against its source line', () => {
      // ANTI-VACUITY: a walk that found no callsite would satisfy both teeth
      // below over an empty set — and a regex typo is the likeliest way to get
      // there, so the floor is measured rather than round
      then('the subject exists — the walk found the callsites', () => {
        expect(scene.callsites.length).toBeGreaterThanOrEqual(QUANT_CALLSITES);
      });

      // and every one of the four libs must be represented, since a regex that
      // matched only `crewwork` would clear the floor above on its own
      then('and every work primitive has a callsite among them', () => {
        const reached = LIBS_WORK.map((lib) => ({
          lib,
          reached: scene.shells.some((path) =>
            readFileSync(path, 'utf8').includes(`/work/${lib}.sh`),
          ),
        }));
        expect(reached).toEqual(
          LIBS_WORK.map((lib) => ({ lib, reached: true })),
        );
      });

      // 🔴 THE teeth, half one — the prelude is present at all
      then('🔴 every callsite arms `-u` and `-o pipefail`', () => {
        expect(scene.unarmed).toEqual([]);
      });

      // 🔴 THE teeth, half two — and it is ABOVE the source, which is the half
      //    a presence-only check cannot see. the failure names both line
      //    numbers, so the fix is a move of one line
      then('🔴 and it arms them BEFORE the source line', () => {
        expect(scene.armedLate).toEqual([]);
      });

      // 🔴 THE teeth, half three — and no `set +u` / `set +o pipefail` undoes
      //    the arm before the source line reads it. the failure names the
      //    disarm's line, so the fix is a move or a re-arm
      then('🔴 and no disarm sits between the arm and the source', () => {
        expect(scene.disarmedBeforeSource).toEqual([]);
      });
    });
  });
});
