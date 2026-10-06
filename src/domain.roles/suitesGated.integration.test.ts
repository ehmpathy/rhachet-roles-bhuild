import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = the RATCHET that holds every suite inside its required gate
 *
 * .why  = a jest config could carry a negation per suite that does not run. a
 *        negation is cheap to add and invisible once added — exactly the shape
 *        `rule.forbid.failhide` names: *"skips — hidden lies that pass ci"*.
 *        no suite is held out, and this file keeps it that way.
 *
 * .the bound = this grades the CONFIGS, never the suites. a red suite goes red
 *        on its own; this guarantees no suite is quietly excluded from a run.
 *
 * .note = all THREE tier configs are graded. an earlier draft graded the
 *        integration config alone, while the same `.temp`/`.agent` narrowed
 *        globs had been applied to unit and acceptance too — so two of the
 *        three narrowed configs carried no ratchet at all. found 2026-09-28 by
 *        the verification stone's own test-intent audit.
 */
describe('suitesGated', () => {
  const DIR_REPO = join(__dirname, '..', '..');

  /**
   * .what = negations that name no suite, so they hold no suite out
   * .why = `.yalc` and `node_modules` are install artifacts, `.temp` is
   *        gitignored scratch, and `.agent` is rhachet's cache (rmsafe's trash
   *        among it). not one of the four is a suite of this repo's.
   */
  const NEGATIONS_INFRA = [
    '!**/.yalc/**',
    '!**/node_modules/**',
    '!**/.temp/**',
    '!**/.agent/**',
  ];

  /**
   * .what = negations that draw a TIER boundary, rather than hold a suite out
   * .why = the unit config must exclude the integration + acceptance tiers, or
   *        `**\/*.test.ts` would swallow both. those suites still run — in
   *        their own tier — so the negation hides no suite at all.
   */
  const NEGATIONS_TIER = [
    '!**/*.acceptance.test.ts',
    '!**/*.integration.test.ts',
  ];

  const CONFIGS = [
    { tier: 'unit', path: 'jest.unit.config.ts', glob: '**/*.test.ts' },
    {
      tier: 'integration',
      path: 'jest.integration.config.ts',
      glob: '**/*.integration.test.ts',
    },
    {
      tier: 'acceptance',
      path: 'jest.acceptance.config.ts',
      glob: '**/*.acceptance.test.ts',
    },
  ] as const;

  // .note = a HOLDER object, never a bare array. `useBeforeAll` hands back a
  //   deferred proxy: a property get resolves to the real value, but `.length`
  //   and `.map` called on the proxy ROOT do not reach the array. measured
  //   2026-09-28 — `scene.length` read `undefined` and `scene.map` threw.
  const scene = useBeforeAll(async () => ({
    reads: CONFIGS.map((declared) => {
      const pathAbs = join(DIR_REPO, declared.path);
      const config = readFileSync(pathAbs, 'utf-8');

      const negationsHeldOut = [...config.matchAll(/'(![^']+)'/g)]
        .map((m) => m[1]!)
        .filter(
          (n) => !NEGATIONS_INFRA.includes(n) && !NEGATIONS_TIER.includes(n),
        );

      return { ...declared, pathAbs, config, negationsHeldOut };
    }),
  }));

  given('[case1] every tier config', () => {
    when('[t0] each is read for the negations it declares', () => {
      then('the read is not vacuous — each config was found and parsed', () => {
        // ANTI-VACUITY: an unreadable config yields an empty set, and an
        // empty set satisfies the assert below over naught
        expect(scene.reads.length).toEqual(3);
        for (const read of scene.reads) {
          expect(existsSync(read.pathAbs)).toEqual(true);
          expect(read.config).toContain('testMatch');
          expect(read.config).toContain(read.glob);
        }
      });

      then('🔴 not one holds a suite out of its required gate', () => {
        // .teeth = any suite negation added to ANY tier config goes red here
        expect(
          scene.reads.map((read) => ({
            tier: read.tier,
            heldOut: read.negationsHeldOut,
          })),
        ).toEqual([
          { tier: 'unit', heldOut: [] },
          { tier: 'integration', heldOut: [] },
          { tier: 'acceptance', heldOut: [] },
        ]);
      });
    });
  });

  given('[case2] a suite held out of one config', () => {
    when('[t0] it is held against the SAME assertion [case1] uses', () => {
      then('🔴 it goes RED — the bite proof', () => {
        // .teeth = the drift is injected into the REAL read, and compared by
        //   the REAL shape. a broken scene throws here rather than passes —
        //   which is what keeps this proof from going vacuous (measured: an
        //   earlier draft asserted on a detached literal and stayed green
        //   while [case1] was broken).
        const tallyDrifted = scene.reads.map((read) => ({
          tier: read.tier,
          heldOut:
            read.tier === 'unit'
              ? [...read.negationsHeldOut, '!**/someOther.test.ts']
              : read.negationsHeldOut,
        }));

        expect(tallyDrifted).not.toEqual([
          { tier: 'unit', heldOut: [] },
          { tier: 'integration', heldOut: [] },
          { tier: 'acceptance', heldOut: [] },
        ]);
        expect(tallyDrifted[0]!.heldOut).toEqual(['!**/someOther.test.ts']);
      });
    });
  });
});
