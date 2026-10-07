import * as fs from 'fs';
import * as path from 'path';

import { given, then, when } from 'test-fns';

import {
  asGuardWithSelfReviewsStubbed,
  getSlugsFromGuardFile,
  SLUG_REVIEW_SELF_STUB,
} from './.test/skill.init.behavior.guards.journey';

/**
 * .what = the guard-template contract, read from every selectable variant
 * .why = the live stone journeys (skill.init.behavior.guards.journey.*) drive
 *        the heavy variant only; this suite reads the SOURCE templates so every
 *        variant a caller could select is verified
 *        (rule.require.contract-snapshot-exhaustiveness — the variant you skip
 *        is the one that breaks in prod)
 *
 * 🔴 .grain = INTEGRATION, never acceptance, and the suffix says so.
 *        an acceptance test invokes the subject through its published surface
 *        and grades what that surface emits (rule.require.acceptance.blackbox:
 *        "the action must go through the contract"). this suite invokes NO
 *        contract at all — it reads `src/…/templates/*.guard` off disk and
 *        asserts on their text.
 *
 *        it crosses a filesystem boundary, so it is not a unit test either
 *        (rule.forbid.unit.remote-boundaries). that leaves integration, which
 *        is what it has always actually been.
 *
 * ⚠️ .it stays under `blackbox/` deliberately — it grades the same guard-template
 *        contract its journey peers drive live, and `role=dispatcher` already
 *        precedents an integration suite here. the tiers glob on the filename
 *        suffix alone, so the dir costs naught and the collocation is worth it.
 */
describe('skill.init.behavior.guards', () => {
  given('[case1] the source guard templates', () => {
    const templatesDir = path.join(
      __dirname,
      '../../src/domain.operations/behavior/init/templates',
    );

    /**
     * .what = every line of every guard template, tagged with its template
     */
    const getGuardTemplateLines = (): { template: string; line: string }[] =>
      fs
        .readdirSync(templatesDir)
        .filter((f) => f.includes('.guard'))
        .flatMap((template) =>
          fs
            .readFileSync(path.join(templatesDir, template), 'utf-8')
            .split('\n')
            .map((line) => ({ template, line })),
        );

    // ═══════════════════════════════════════════════════════════════
    // ENROLLED REVIEWER CONTRACT
    // ═══════════════════════════════════════════════════════════════
    when('[t0] every guard-template variant embeds the enrolled-reviewer fix', () => {
      const getEnrollLinesFromTemplates = (): {
        template: string;
        model: string | null;
        roles: string | null;
      }[] =>
        getGuardTemplateLines()
          .filter(({ line }) => line.includes('enroll claude'))
          .map(({ template, line }) => ({
            template,
            model: line.match(/--model '([^']+)'/)?.[1] ?? null,
            roles: line.match(/--roles (\S+)/)?.[1] ?? null,
          }));

      then('every enrolled reviewer across all variants uses the sonnet-5-5 model', () => {
        const enrollLines = getEnrollLinesFromTemplates();

        // guard against a false pass if the extraction matched no lines
        expect(enrollLines.length).toBeGreaterThan(0);

        // every enroll line must carry the sonnet-5-5 model; name each one that does not
        const offSonnet = enrollLines
          .filter((enroll) => enroll.model !== 'claude-sonnet-5-5[1m]')
          .map((enroll) => `${enroll.template} → ${enroll.model}`);
        expect(offSonnet).toEqual([]);
      });

      then('every enrolled reviewer across all variants lists the reviewer role first', () => {
        const enrollLines = getEnrollLinesFromTemplates();

        expect(enrollLines.length).toBeGreaterThan(0);

        // reviewer must lead the --roles list so its output contract
        // is never buried (else the judge cannot parse blocker counts)
        for (const enroll of enrollLines) {
          expect(enroll.roles).not.toBeNull();
          expect(enroll.roles!.startsWith('reviewer,')).toBe(true);
        }
      });

      then('every selectable guard variant is covered by the roster', () => {
        const enrollLines = getEnrollLinesFromTemplates();

        // explicit lock-in that BOTH blueprint variants (light is the default),
        // BOTH execution paths (from_vision is --size nano), and verification
        // each carry enroll lines the two assertions above verified. an
        // assertion (not a snapshot) so the literal model id
        // `claude-sonnet-5-5[1m]` is never misread as ANSI residue.
        const templatesWithEnroll = [
          ...new Set(enrollLines.map((e) => e.template)),
        ].sort();
        expect(templatesWithEnroll).toEqual([
          '3.3.1.blueprint.product.guard.heavy',
          '3.3.1.blueprint.product.guard.light',
          '5.1.execution.from_vision.guard',
          '5.1.execution.phase0_to_phaseN.guard',
          '5.3.verification.guard',
        ]);
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // REPO-RULES OPTIONAL-SKIP CONTRACT
    // ═══════════════════════════════════════════════════════════════
    when('[t1] every guard-template variant makes its repo-rules reviewer optional', () => {
      // .why = the repo-local ruleset (.agent/repo=.this/**/rule.*.md) is
      //        legitimately empty in a fresh repo. absent --optional rules the
      //        reviewer exits 2 and false-blocks the stone, which demands a
      //        human overrule of an empty-by-design ruleset
      const getRepoRulesLinesFromTemplates = (): {
        template: string;
        run: string;
      }[] =>
        getGuardTemplateLines()
          // the repo-rules reviewer points --rules at the repo-local ruleset
          .filter(({ line }) => line.includes("--rules '.agent/repo=.this/"))
          .map(({ template, line }) => ({ template, run: line }));

      then('every repo-rules reviewer across all variants passes --optional rules', () => {
        const runLines = getRepoRulesLinesFromTemplates();

        // guard against a false pass if the extraction matched no lines
        expect(runLines.length).toBeGreaterThan(0);

        // every repo-local ruleset reviewer must opt into the empty-rules skip
        for (const line of runLines)
          expect(line.run).toContain('--optional rules');
      });

      then('every selectable guard variant is covered by the roster', () => {
        const runLines = getRepoRulesLinesFromTemplates();

        // explicit lock-in that BOTH blueprint variants (light is the default),
        // BOTH execution paths (from_vision is --size nano), and verification
        // each carry a repo-rules reviewer the assertion above verified.
        const templatesWithRepoRules = [
          ...new Set(runLines.map((l) => l.template)),
        ].sort();
        expect(templatesWithRepoRules).toEqual([
          '3.3.1.blueprint.product.guard.heavy',
          '3.3.1.blueprint.product.guard.light',
          '5.1.execution.from_vision.guard',
          '5.1.execution.phase0_to_phaseN.guard',
          '5.3.verification.guard',
        ]);
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // SELF-REVIEW ROSTER CONTRACT (read in isolation, never walked live)
    // ═══════════════════════════════════════════════════════════════
    when('[t2] every guard-template variant declares a well-formed self-review roster', () => {
      // .why = the live journeys stub each roster to one reviewer
      //        (rule.forbid.live-review-rosters-in-acceptance-journeys), so the
      //        full roster of every variant is verified here instead
      const getRostersFromTemplates = (): {
        template: string;
        slugs: string[];
        says: number;
      }[] =>
        fs
          .readdirSync(templatesDir)
          .filter((f) => f.includes('.guard'))
          .map((template) => {
            const guardPath = path.join(templatesDir, template);
            const selfBlock = fs
              .readFileSync(guardPath, 'utf-8')
              .split('\n  peer:')[0]!
              .split('\n  self:\n')[1];
            return {
              template,
              slugs: getSlugsFromGuardFile({ guardPath }),
              says: (selfBlock?.match(/^ {6}say: \|/gm) ?? []).length,
            };
          })
          .filter((roster) => roster.slugs.length > 0);

      then('the heavy and light variants each carry a roster', () => {
        const templates = getRostersFromTemplates().map((r) => r.template);
        expect(templates).toEqual(
          expect.arrayContaining([
            '1.vision.guard.heavy',
            '1.vision.guard.light',
            '3.3.1.blueprint.product.guard.heavy',
            '3.3.1.blueprint.product.guard.light',
          ]),
        );
      });

      then('every slug reads as dash-case, since bhrain drops dotted slugs', () => {
        for (const roster of getRostersFromTemplates())
          for (const slug of roster.slugs)
            expect({ template: roster.template, slug }).toEqual({
              template: roster.template,
              slug: expect.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/),
            });
      });

      then('no roster repeats a slug', () => {
        for (const roster of getRostersFromTemplates())
          expect({
            template: roster.template,
            slugs: [...new Set(roster.slugs)],
          }).toEqual({ template: roster.template, slugs: roster.slugs });
      });

      then('every reviewer carries a say prompt', () => {
        for (const roster of getRostersFromTemplates())
          expect({ template: roster.template, says: roster.says }).toEqual({
            template: roster.template,
            says: roster.slugs.length,
          });
      });
    });

    when('[t3] the journey stub replaces the self roster alone', () => {
      then('peer and judges survive verbatim; self holds the one stub', () => {
        const content = fs.readFileSync(
          path.join(templatesDir, '3.3.1.blueprint.product.guard.heavy'),
          'utf-8',
        );
        const stubbed = asGuardWithSelfReviewsStubbed({ content });

        // the text after the self roster is untouched
        expect(stubbed.split('\n  peer:')[1]).toEqual(
          content.split('\n  peer:')[1],
        );

        // the text before it (judges included) is untouched
        expect(stubbed.split('\n  self:\n')[0]).toEqual(
          content.split('\n  self:\n')[0],
        );

        // the self roster is exactly the stub
        const selfBlock = stubbed.split('\n  self:\n')[1]!.split('\n  peer:')[0]!;
        expect(selfBlock.match(/- slug: \S+/g)).toEqual([
          `- slug: ${SLUG_REVIEW_SELF_STUB}`,
        ]);
      });
    });
  });
});
