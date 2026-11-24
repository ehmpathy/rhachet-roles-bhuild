import fs from 'fs';
import os from 'os';
import path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { initBehaviorDir } from './initBehaviorDir';

describe('initBehaviorDir.integration', () => {
  let tempDir: string;
  let behaviorDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'initBehaviorDir-guard-test-'),
    );
    behaviorDir = path.join(tempDir, '.behavior', 'v2025_01_01.test-feature');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  /**
   * .what = init the behavior once, then read every stamped stone + guard into memory
   * .why = the thens of one when share one init via useThen; the read happens inside
   *        that same test, before afterEach removes the temp dir
   */
  const genStampedFiles = (input: {
    guard: 'light' | 'heavy' | null;
  }): Record<string, string> => {
    initBehaviorDir({
      behaviorDir,
      behaviorDirRel: '.behavior/v2025_01_01.test-feature',
      ...(input.guard ? { guard: input.guard } : {}),
    });
    return Object.fromEntries(
      fs
        .readdirSync(behaviorDir)
        .filter((file) => file.endsWith('.guard') || file.endsWith('.stone'))
        .map((file) => [
          file,
          fs.readFileSync(path.join(behaviorDir, file), 'utf-8'),
        ]),
    );
  };

  /**
   * .what = the stamped guards whose content holds a given lane slug, sorted
   * .why = a bearer set reads as one assertion, where a loop over files would not
   */
  const getGuardsThatCarry = (input: {
    stamped: Record<string, string>;
    slug: string;
  }): string[] =>
    Object.entries(input.stamped)
      .filter(([file]) => file.endsWith('.guard'))
      .filter(([, content]) => content.includes(`- slug: ${input.slug}\n`))
      .map(([file]) => file)
      .sort();

  given('[case1] guard level is light (default)', () => {
    when('[t0] initBehaviorDir is called without guard arg', () => {
      then('creates light guard files for vision and blueprint', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        // verify guard files created (without .light suffix)
        expect(result.created).toContain('1.vision.guard');
        expect(result.created).toContain('3.3.1.blueprint.product.guard');

        // verify files exist on disk
        expect(fs.existsSync(path.join(behaviorDir, '1.vision.guard'))).toBe(
          true,
        );
        expect(
          fs.existsSync(
            path.join(behaviorDir, '3.3.1.blueprint.product.guard'),
          ),
        ).toBe(true);

        // verify no .light or .heavy suffix files created
        expect(result.created).not.toContain('1.vision.guard.light');
        expect(result.created).not.toContain('1.vision.guard.heavy');
      });

      then('blueprint guard has light self-reviews (6 reviews)', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const blueprintGuard = fs.readFileSync(
          path.join(behaviorDir, '3.3.1.blueprint.product.guard'),
          'utf-8',
        );

        // light has: deletables, assumptions, coverage/adherance
        expect(blueprintGuard).toContain('has-questioned-deletables');
        expect(blueprintGuard).toContain('has-questioned-assumptions');
        expect(blueprintGuard).toContain('has-behavior-declaration-coverage');
        expect(blueprintGuard).toContain('has-behavior-declaration-adherance');
        expect(blueprintGuard).toContain('has-role-standards-adherance');
        expect(blueprintGuard).toContain('has-role-standards-coverage');

        // the yagni lane (#354) reads the blueprint as it reads the vision
        expect(blueprintGuard).toContain('slug: yagni-and-simplicity');

        // light does NOT have: 5whys, premortem, inverse, devils-advocate
        expect(blueprintGuard).not.toContain('has-questioned-5whys');
        expect(blueprintGuard).not.toContain('has-questioned-premortem');
        expect(blueprintGuard).not.toContain('has-questioned-inverse');
        expect(blueprintGuard).not.toContain('has-questioned-devils-advocate');
      });

      then('criteria has no guard in light mode', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        // criteria guard not created in light mode
        expect(result.created).not.toContain('2.1.criteria.blackbox.guard');
        expect(
          fs.existsSync(path.join(behaviorDir, '2.1.criteria.blackbox.guard')),
        ).toBe(false);
      });

      then('vision guard has light self-reviews (7 reviews)', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const visionGuard = fs.readFileSync(
          path.join(behaviorDir, '1.vision.guard'),
          'utf-8',
        );

        // light has 7 self-reviews: grounded-in-reality, experience-coverage,
        // requirements, assumptions, questions, and the fulcrum pair (#352 #353)
        expect(visionGuard).toContain('has-grounded-in-reality');
        expect(visionGuard).toContain('has-experience-coverage');
        expect(visionGuard).toContain('has-questioned-requirements');
        expect(visionGuard).toContain('has-questioned-assumptions');
        expect(visionGuard).toContain('has-questioned-questions');
        expect(visionGuard).toContain('slug: has-questioned-fulcrum-research');
        expect(visionGuard).toContain('slug: has-questioned-fulcrum-deletion');

        // light also carries the experience-coverage peer review + a reviewed? judge,
        // wired against the widened glob that self-anchors on the vision yield — a
        // zero-case-file vision must still match at least that one file, never zero
        expect(visionGuard).toContain('slug: experience-coverage');
        // the yagni lane (#354) grades the vision against its own rubric
        expect(visionGuard).toContain('slug: yagni-and-simplicity');
        expect(visionGuard).toContain(
          'behavior.vision/rule.require.yagni-and-simplicity.md',
        );
        // the lane loads the audience rule (#346) beside its coverage rule
        expect(visionGuard).toContain(
          'rule.require.{experience-coverage,declared-experience-audience}.md',
        );
        expect(visionGuard).toContain("--paths-with '$route/1.vision.*.md'");
        expect(visionGuard).not.toContain(
          "--paths-with '$route/1.vision.experience.case=*.md'",
        );
        expect(visionGuard).not.toContain(
          "--paths-with '$route/1.vision.yield.appendix.experience.case=*.md'",
        );
        expect(visionGuard).toContain('reviewed?');

        // light does NOT have: fundamentals, inverse, devils-advocate, premortem, 5whys
        expect(visionGuard).not.toContain('has-questioned-fundamentals');
        expect(visionGuard).not.toContain('has-questioned-inverse');
        expect(visionGuard).not.toContain('has-questioned-devils-advocate');
        expect(visionGuard).not.toContain('has-questioned-premortem');
        expect(visionGuard).not.toContain('has-questioned-5whys');
      });
    });

    when('[t1] initBehaviorDir is called with guard=light explicitly', () => {
      then('creates light guard files', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'light',
        });

        expect(result.created).toContain('1.vision.guard');

        const visionGuard = fs.readFileSync(
          path.join(behaviorDir, '1.vision.guard'),
          'utf-8',
        );

        // light version characteristics
        expect(visionGuard).toContain('has-questioned-requirements');
        expect(visionGuard).not.toContain('has-questioned-fundamentals');
      });
    });
  });

  given('[case2] guard level is heavy', () => {
    when('[t0] initBehaviorDir is called with guard=heavy', () => {
      then('creates heavy guard files for all stages', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        // verify guard files created (without .heavy suffix)
        expect(result.created).toContain('1.vision.guard');
        expect(result.created).toContain('2.1.criteria.blackbox.guard');
        expect(result.created).toContain('3.3.1.blueprint.product.guard');

        // verify no .light or .heavy suffix files created
        expect(result.created).not.toContain('1.vision.guard.light');
        expect(result.created).not.toContain('1.vision.guard.heavy');
      });

      then('vision guard has heavy self-reviews (13 reviews)', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const visionGuard = fs.readFileSync(
          path.join(behaviorDir, '1.vision.guard'),
          'utf-8',
        );

        // heavy holds 13 self-reviews: the research-based ones, the fulcrum pair
        // (#352 #353), and has-repaired-structurally
        expect(visionGuard).toContain('slug: has-questioned-fulcrum-research');
        expect(visionGuard).toContain('slug: has-questioned-fulcrum-deletion');
        expect(visionGuard).toContain('slug: has-repaired-structurally');
        expect(visionGuard).toContain('has-grounded-in-reality');
        expect(visionGuard).toContain('has-experience-coverage');
        expect(visionGuard).toContain('has-questioned-fundamentals');
        expect(visionGuard).toContain('has-questioned-requirements');
        expect(visionGuard).toContain('has-questioned-assumptions');
        expect(visionGuard).toContain('has-questioned-inverse');
        expect(visionGuard).toContain('has-questioned-devils-advocate');
        expect(visionGuard).toContain('has-questioned-premortem');
        expect(visionGuard).toContain('has-questioned-5whys');
        expect(visionGuard).toContain('has-questioned-questions');

        // heavy also carries the experience-coverage peer review + a reviewed? judge,
        // wired against the same widened glob as light (guard-variant-consistency)
        expect(visionGuard).toContain('slug: experience-coverage');
        // the yagni lane (#354) grades the vision against its own rubric
        expect(visionGuard).toContain('slug: yagni-and-simplicity');
        expect(visionGuard).toContain(
          'behavior.vision/rule.require.yagni-and-simplicity.md',
        );
        // the lane loads the audience rule (#346) beside its coverage rule
        expect(visionGuard).toContain(
          'rule.require.{experience-coverage,declared-experience-audience}.md',
        );
        expect(visionGuard).toContain("--paths-with '$route/1.vision.*.md'");
        expect(visionGuard).not.toContain(
          "--paths-with '$route/1.vision.experience.case=*.md'",
        );
        expect(visionGuard).not.toContain(
          "--paths-with '$route/1.vision.yield.appendix.experience.case=*.md'",
        );
        expect(visionGuard).toContain('reviewed?');
      });

      then('criteria guard has heavy self-reviews (4 reviews)', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const criteriaGuard = fs.readFileSync(
          path.join(behaviorDir, '2.1.criteria.blackbox.guard'),
          'utf-8',
        );

        // heavy criteria has self-reviews
        expect(criteriaGuard).toContain('reviews:');
        expect(criteriaGuard).toContain('self:');
        expect(criteriaGuard).toContain('has-questioned-requirements');
        expect(criteriaGuard).toContain('has-questioned-devils-advocate');
        expect(criteriaGuard).toContain('has-questioned-counterexamples');
        expect(criteriaGuard).toContain('has-questioned-5whys');
      });

      then('blueprint guard has heavy self-reviews (11 reviews)', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const blueprintGuard = fs.readFileSync(
          path.join(behaviorDir, '3.3.1.blueprint.product.guard'),
          'utf-8',
        );

        // heavy blueprint has research-based reviews
        expect(blueprintGuard).toContain('has-questioned-deletables');
        expect(blueprintGuard).toContain('has-questioned-assumptions');
        expect(blueprintGuard).toContain('has-questioned-5whys');
        expect(blueprintGuard).toContain('has-questioned-premortem');
        expect(blueprintGuard).toContain('has-questioned-inverse');
        expect(blueprintGuard).toContain('has-questioned-devils-advocate');

        // plus coverage/adherance checks
        expect(blueprintGuard).toContain('has-behavior-declaration-coverage');
        expect(blueprintGuard).toContain('has-behavior-declaration-adherance');
        expect(blueprintGuard).toContain('has-role-standards-adherance');
        expect(blueprintGuard).toContain('has-role-standards-coverage');
      });
    });
  });

  given('[case3] verification and playtest templates', () => {
    when('[t0] initBehaviorDir is called', () => {
      then('creates 5.3.verification.stone', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.3.verification.stone');
        expect(
          fs.existsSync(path.join(behaviorDir, '5.3.verification.stone')),
        ).toBe(true);

        const content = fs.readFileSync(
          path.join(behaviorDir, '5.3.verification.stone'),
          'utf-8',
        );
        expect(content).toContain('.what');
        expect(content).toContain('.why');
        expect(content).toContain('.how');
      });

      then('creates 5.3.verification.guard with self-reviews', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.3.verification.guard');

        const content = fs.readFileSync(
          path.join(behaviorDir, '5.3.verification.guard'),
          'utf-8',
        );
        expect(content).toContain('has-behavior-coverage');
        expect(content).toContain('has-zero-test-skips');
        expect(content).toContain('has-all-tests-passed');
        // has peer reviews and judges for strict verification
        expect(content).toContain('peer:');
        expect(content).toContain('judges:');
      });

      then('creates 5.5.playtest.stone', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.5.playtest.stone');
        expect(
          fs.existsSync(path.join(behaviorDir, '5.5.playtest.stone')),
        ).toBe(true);

        const content = fs.readFileSync(
          path.join(behaviorDir, '5.5.playtest.stone'),
          'utf-8',
        );
        expect(content).toContain('.what');
        expect(content).toContain('.why');
        expect(content).toContain('.how');
      });

      then('creates 5.5.playtest.guard with self-reviews and judge', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.5.playtest.guard');

        const content = fs.readFileSync(
          path.join(behaviorDir, '5.5.playtest.guard'),
          'utf-8',
        );
        expect(content).toContain('has-clear-instructions');
        expect(content).toContain('has-vision-coverage');
        expect(content).toContain('has-edgecase-coverage');
        // playtest guard has approved? judge
        expect(content).toContain('judges:');
        expect(content).toContain('approved?');
      });
    });
  });

  given('[case4] guard level change after init', () => {
    when(
      '[t0] behavior already has light guards, called again with heavy',
      () => {
        then('keeps the extant light guards (findsert semantics)', () => {
          // first init with light
          initBehaviorDir({
            behaviorDir,
            behaviorDirRel: '.behavior/v2025_01_01.test-feature',
            guard: 'light',
          });

          // second init with heavy
          const result = initBehaviorDir({
            behaviorDir,
            behaviorDirRel: '.behavior/v2025_01_01.test-feature',
            guard: 'heavy',
          });

          // guards should be kept, not recreated
          expect(result.kept).toContain('1.vision.guard');
          expect(result.created).not.toContain('1.vision.guard');

          // content should still be light version
          const visionGuard = fs.readFileSync(
            path.join(behaviorDir, '1.vision.guard'),
            'utf-8',
          );
          expect(visionGuard).not.toContain('has-questioned-fundamentals');
        });
      },
    );
  });

  given('[case5] repros stone and guard', () => {
    when('[t0] initBehaviorDir is called', () => {
      then('creates repros guard with 3 self-reviews', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain(
          '3.2.distill.repros.experience._.guard',
        );

        const guardContent = fs.readFileSync(
          path.join(behaviorDir, '3.2.distill.repros.experience._.guard'),
          'utf-8',
        );

        expect(guardContent).toContain('has-critical-paths-identified');
        expect(guardContent).toContain('has-ergonomics-reviewed');
        expect(guardContent).toContain('has-play-test-convention');
      });

      then('repros stone includes journey sketch guidance', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '3.2.distill.repros.experience._.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('journey test sketches');
        expect(stoneContent).toContain('given/when/then');
        expect(stoneContent).toContain('[tN]');
      });

      then('repros stone includes input/output pairs guidance', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '3.2.distill.repros.experience._.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('input/output pairs');
        expect(stoneContent).toContain('snapshot target');
      });

      then('repros stone includes critical paths section', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '3.2.distill.repros.experience._.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('## critical paths');
        expect(stoneContent).toContain('happy paths');
      });

      then('repros stone includes ergonomics section', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '3.2.distill.repros.experience._.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('## ergonomics review');
        expect(stoneContent).toContain('feel natural');
      });
    });
  });

  given('[case6] verification stone and guard enhancements', () => {
    when('[t0] initBehaviorDir is called', () => {
      const stamped = useThen('it stamps the route', async () =>
        genStampedFiles({ guard: null }),
      );

      then('verification stone references repros artifact', () => {
        const stoneContent = stamped['5.3.verification.stone']!;

        expect(stoneContent).toContain('3.2.distill.repros.experience');
        expect(stoneContent).toContain('repros artifact');
      });

      then('verification stone has enhanced behavior coverage table', () => {
        const stoneContent = stamped['5.3.verification.stone']!;

        expect(stoneContent).toContain('snapshots?');
        expect(stoneContent).toContain('critical path?');
        expect(stoneContent).toContain('ergonomics ok?');
      });

      then('verification guard has 8 total self-reviews', () => {
        const guardContent = stamped['5.3.verification.guard']!;

        // the 8 self-reviews retained after the low-yield cut (corpus-graded):
        // has-journey-tests-from-repros, has-contract-output-variants-snapped, and
        // has-play-test-convention were cut (0-4% gain + peer coverage)
        expect(guardContent).toContain('has-behavior-coverage');
        expect(guardContent).toContain('has-zero-test-skips');
        expect(guardContent).toContain('has-all-tests-passed');
        expect(guardContent).toContain('has-preserved-test-intentions');
        expect(guardContent).toContain('has-snap-changes-rationalized');
        expect(guardContent).toContain('has-critical-paths-frictionless');
        expect(guardContent).toContain('has-ergonomics-validated');
        expect(guardContent).toContain('has-fixed-all-gaps');

        // the cut slugs must NOT reappear
        expect(guardContent).not.toContain('has-journey-tests-from-repros');
        expect(guardContent).not.toContain(
          'has-contract-output-variants-snapped',
        );
        expect(guardContent).not.toContain('has-play-test-convention');
      });

      // 🔴 #355: the stone asks for the impacted suites, never a whole-tier sweep.
      //    the teeth: restore an unscoped `npm run test:unit` row, or drop the cicd line
      then(
        'verification stone asks for impacted runs and leaves the sweep to cicd',
        () => {
          const stoneContent = stamped['5.3.verification.stone']!;

          expect(stoneContent).toContain('rhx git.repo.test --what unit');
          expect(stoneContent).toContain("the full, unscoped sweep is cicd's");
          expect(stoneContent).toContain('do NOT reach for\n`--thorough`');
          expect(stoneContent).not.toContain('npm run test:unit');
          expect(stoneContent).not.toContain('npm run test:integration');
          expect(stoneContent).not.toContain('npm run test:acceptance');
        },
      );
    });
  });

  given('[case7] evaluation stone and guard', () => {
    when('[t0] initBehaviorDir is called', () => {
      then('creates 5.2.evaluation.stone', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.2.evaluation.stone');
        expect(
          fs.existsSync(path.join(behaviorDir, '5.2.evaluation.stone')),
        ).toBe(true);
      });

      then('evaluation stone mirrors blueprint structure', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '5.2.evaluation.stone'),
          'utf-8',
        );

        // mirrors blueprint sections
        expect(stoneContent).toContain('## summary (as implemented)');
        expect(stoneContent).toContain('## filediff tree (as implemented)');
        expect(stoneContent).toContain('## codepath tree (as implemented)');
        expect(stoneContent).toContain('## test coverage (as implemented)');
      });

      then('evaluation stone includes divergence analysis', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '5.2.evaluation.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('## divergence analysis');
        expect(stoneContent).toContain('### divergences found');
        expect(stoneContent).toContain('### divergence resolution');
        expect(stoneContent).toContain('repair');
        expect(stoneContent).toContain('blocker');
      });

      then('evaluation stone references blueprint artifact', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '5.2.evaluation.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('3.3.1.blueprint.product');
        expect(stoneContent).toContain('.behavior/v2025_01_01.test-feature');
      });

      then('creates 5.2.evaluation.guard with 4 self-reviews', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.2.evaluation.guard');

        const guardContent = fs.readFileSync(
          path.join(behaviorDir, '5.2.evaluation.guard'),
          'utf-8',
        );

        expect(guardContent).toContain('has-complete-implementation-record');
        expect(guardContent).toContain('has-divergence-analysis');
        expect(guardContent).toContain('has-divergence-addressed');
        expect(guardContent).toContain('has-no-silent-scope-creep');
      });

      then('evaluation guard checks divergences skeptically', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const guardContent = fs.readFileSync(
          path.join(behaviorDir, '5.2.evaluation.guard'),
          'utf-8',
        );

        // skeptical checks of backups
        expect(guardContent).toContain('skeptical');
        expect(guardContent).toContain('laziness');
        expect(guardContent).toContain('rationale');
      });
    });

    given('[case5] guards carry self-referential provenance', () => {
      const templatesUriBase =
        'node_modules/rhachet-roles-bhuild/dist/domain.operations/behavior/init/templates';

      when('[t0] inited with guard=heavy', () => {
        then('variant guard uri points at its .heavy source template', () => {
          initBehaviorDir({
            behaviorDir,
            behaviorDirRel: '.behavior/v2025_01_01.test-feature',
            guard: 'heavy',
          });

          // the route guard drops the .heavy suffix, but its provenance uri
          // must point back at the .heavy source so upgrade re-reads the same file
          const visionGuard = fs.readFileSync(
            path.join(behaviorDir, '1.vision.guard'),
            'utf-8',
          );
          expect(visionGuard).toContain('provenance:');
          expect(visionGuard).toContain(
            `uri: ${templatesUriBase}/1.vision.guard.heavy`,
          );
        });
      });

      when('[t1] inited with guard=light (default)', () => {
        then('variant guard uri points at its .light source template', () => {
          initBehaviorDir({
            behaviorDir,
            behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          });

          const blueprintGuard = fs.readFileSync(
            path.join(behaviorDir, '3.3.1.blueprint.product.guard'),
            'utf-8',
          );
          expect(blueprintGuard).toContain('provenance:');
          expect(blueprintGuard).toContain(
            `uri: ${templatesUriBase}/3.3.1.blueprint.product.guard.light`,
          );
        });

        then('non-variant guard uri points at its own source template', () => {
          initBehaviorDir({
            behaviorDir,
            behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          });

          const evaluationGuard = fs.readFileSync(
            path.join(behaviorDir, '5.2.evaluation.guard'),
            'utf-8',
          );
          expect(evaluationGuard).toContain('provenance:');
          expect(evaluationGuard).toContain(
            `uri: ${templatesUriBase}/5.2.evaluation.guard`,
          );
        });
      });

      when('[t2] every guard template is read from source', () => {
        then('each guard template uri points at its own file', () => {
          // exhaustive, not sampled: a hand-typed uri on a new guard must not drift
          const templatesDir = path.join(__dirname, 'templates');
          const guardTemplateNames = fs
            .readdirSync(templatesDir)
            .filter((name) => /\.guard(\.(light|heavy))?$/.test(name));
          expect(guardTemplateNames.length).toBeGreaterThan(0);
          const uriMismatches = guardTemplateNames.filter(
            (name) =>
              !fs
                .readFileSync(path.join(templatesDir, name), 'utf-8')
                .includes(`uri: ${templatesUriBase}/${name}\n`),
          );
          expect(uriMismatches).toEqual([]);
        });
      });
    });
  });

  // 🔴 the clamp on the experience bind. bhrain drops a route file from a review's
  //    targets unless it is a yield, a seed, or a fulcrum summary — so a bare
  //    `$route/1.vision.*.md` reaches the yield alone, and the two lanes that grade
  //    the experience catalog would grade a catalog they never read (bhuild#496).
  given(
    '[case8] the vision experience lanes read the experience appendices',
    () => {
      for (const guard of ['light', 'heavy'] as const) {
        when(`[t0] inited with guard=${guard}`, () => {
          then('both experience lanes bind the appendix glob', () => {
            initBehaviorDir({
              behaviorDir,
              behaviorDirRel: '.behavior/v2025_01_01.test-feature',
              guard,
            });
            const visionGuard = fs.readFileSync(
              path.join(behaviorDir, '1.vision.guard'),
              'utf-8',
            );
            for (const slug of [
              'dimensional-decomposition',
              'experience-coverage',
            ]) {
              // a slug absent from the guard fails here, readable, not as a TypeError
              const [, afterSlug] = visionGuard.split(`- slug: ${slug}\n`);
              expect(afterSlug).toBeDefined();
              const lane = (afterSlug ?? '').split('- slug:')[0] ?? '';
              expect(lane).toContain(
                "--paths-with '$route/1.vision.yield.appendix.experience.*.md'",
              );
            }
          });
        });
      }
    },
  );

  // 🔴 the clamp on the retirement. the prose-density and archaeology lanes were
  //    withdrawn; the test below reads each stamped guard, per variant, so a later
  //    sweep that restores one goes red here.
  //    the slug list and the skill name are the teeth — the rubric rules they
  //    bound were deleted with them, so a restored lane would bind naught.
  given('[case9] no guard carries a retired prose lane', () => {
    for (const guard of ['light', 'heavy'] as const) {
      when(`[t0] inited with guard=${guard}`, () => {
        then('no stamped guard names a retired slug or skill', () => {
          initBehaviorDir({
            behaviorDir,
            behaviorDirRel: '.behavior/v2025_01_01.test-feature',
            guard,
          });
          const guardFiles = fs
            .readdirSync(behaviorDir)
            .filter((file) => file.endsWith('.guard'));
          expect(guardFiles.length).toBeGreaterThan(0);

          const retiredMarks = [
            'slug: density-of-',
            'slug: dense-of-',
            'slug: terse-of-',
            'slug: overzoom-of-',
            'slug: archaeology-of-yields',
            'slug: has-ejected-the-archaeology',
            'review.for.yield-archaeology',
          ];
          const hits = guardFiles.flatMap((file) => {
            const content = fs.readFileSync(
              path.join(behaviorDir, file),
              'utf-8',
            );
            return retiredMarks
              .filter((mark) => content.includes(mark))
              .map((mark) => `${file} :: ${mark}`);
          });
          expect(hits).toEqual([]);
        });
      });
    }
  });

  // 🔴 the clamp on the ESCALATION council. `defer-fulcrums-to-last` governs WHEN to
  //    escalate to the human — once, at the end — so the `fulcrums-driver-owned`
  //    council rides the TERMINAL stone (5.5.playtest) alone. this pins BOTH halves:
  //    it lands on playtest bound to the inventory, AND it does NOT spread. a copy
  //    onto a second stone would escalate one council twice.
  // 🟡 the DRIVER-OWNED close check is a SEPARATE lane (`fulcrums-self-sufficient`),
  //    clamped by [case11] — it DOES run per-stage (vision + execution). the two are
  //    not the same lane: `fulcrums-driver-owned` binds on 5.5.playtest alone, and
  //    `fulcrums-self-sufficient` binds on the vision + execution guards.
  given('[case10] the fulcrum council rides the terminal stone alone', () => {
    when('[t0] inited with guard=heavy (stamps the most guards)', () => {
      const stamped = useThen('it stamps the route', async () =>
        genStampedFiles({ guard: 'heavy' }),
      );

      then(
        '5.5.playtest carries the fulcrum lane, bound to the inventory',
        () => {
          const playtestGuard = stamped['5.5.playtest.guard']!;
          expect(playtestGuard).toContain('- slug: fulcrums-driver-owned\n');
          expect(playtestGuard).toContain(
            "--paths-with '$route/.fulcrums/inventory.of=fulcrums.*'",
          );
        },
      );

      then('no OTHER guard carries the fulcrum lane', () => {
        const bearers = getGuardsThatCarry({
          stamped,
          slug: 'fulcrums-driver-owned',
        });
        expect(bearers).toEqual(['5.5.playtest.guard']);
      });
    });
  });

  // 🔴 the clamp on the per-stage DRIVER-OWNED close checks. the driver opens fulcrums
  //    and spots adjacent fixes AT vision + execution, so both lanes run THERE — where
  //    the context that closes them is fresh, in addition to the terminal council.
  //    `fulcrums-self-sufficient`  = whatever closes without the human should be closed
  //    `scouts-honor-fix-forward`  = a safe+clean+adjacent fix is done now, not dreamed
  //    the two are PAIRED, so they land on the same guards; the bearer sets must match.
  given('[case11] the driver-owned close checks run per stage', () => {
    when('[t0] inited with guard=heavy (stamps the most guards)', () => {
      const stamped = useThen('it stamps the route', async () =>
        genStampedFiles({ guard: 'heavy' }),
      );

      then('vision + execution guards carry both close lanes', () => {
        const fulcrumBearers = getGuardsThatCarry({
          stamped,
          slug: 'fulcrums-self-sufficient',
        });
        const scoutsBearers = getGuardsThatCarry({
          stamped,
          slug: 'scouts-honor-fix-forward',
        });

        // the two lanes are paired — same stages, so identical bearer sets
        expect(fulcrumBearers).toEqual(scoutsBearers);

        // and they land on vision + execution, never on the terminal stone
        expect(fulcrumBearers).toContain('1.vision.guard');
        expect(
          fulcrumBearers.some((file) => file.startsWith('5.1.execution')),
        ).toBe(true);
        expect(fulcrumBearers).not.toContain('5.5.playtest.guard');
      });

      then('each close lane binds its own subject + rules', () => {
        const visionGuard = stamped['1.vision.guard']!;

        // the fulcrum lane grades the inventory via the driver fulcrum rules
        expect(visionGuard).toContain(
          "--paths-with '$route/.fulcrums/inventory.of=fulcrums.*'",
        );
        expect(visionGuard).toContain(
          'rule.always.{defer-fulcrums-to-last,itemize-the-fulcrums-you-best-guess}.md',
        );

        // the scouts-honor lane grades the route-local dreams via the fix-forward rules
        expect(visionGuard).toContain("--paths-with '$route/dreams/*.md'");
        expect(visionGuard).toContain(
          'rule.always.{fix-forward-under-scouts-honor,catch-dreams-for-followups}.md',
        );
      });
    });

    // the light variant carries the SAME two close lanes — a drift in one variant
    // must not slip past (rule.require.guard-variant-consistency). without this the
    // heavy-only [t0] leaves the light lane un-clamped, so a dropped light slug reads
    // clean — the exact false-green a mis-aimed teeth-proof hits.
    when('[t1] inited with guard=light', () => {
      then('the vision guard carries both close lanes', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'light',
        });

        const visionGuard = fs.readFileSync(
          path.join(behaviorDir, '1.vision.guard'),
          'utf-8',
        );

        expect(visionGuard).toContain('- slug: fulcrums-self-sufficient\n');
        expect(visionGuard).toContain('- slug: scouts-honor-fix-forward\n');
      });
    });
  });

  // 🔴 the clamp on the WRITE-TIME half of scouts honor. the peer lane grades the dreams
  //    that SURVIVE a stage; this self gate grades them while the context that made each
  //    fix cheap is still held. it rides execution AND verification, because verification
  //    is the last stone with the code open — a dream that clears it leaves the behavior.
  // 🟡 the teeth: bhrain ships no overrule op for a self gate (`rule.always.bear-every-self-review`),
  //    where a peer lane can exhaust. so the self bearer set is the stronger guarantee,
  //    and a drop of verification from it is the silent regression this catches.
  given('[case12] a deferred adjacent fix is caught at write time', () => {
    when('[t0] inited with guard=heavy', () => {
      const stamped = useThen('it stamps the route', async () =>
        genStampedFiles({ guard: 'heavy' }),
      );

      then('execution + verification carry the self gate', () => {
        const bearers = getGuardsThatCarry({
          stamped,
          slug: 'has-fixed-forward-adjacent-fixes',
        });

        expect(bearers.some((file) => file.startsWith('5.1.execution'))).toBe(
          true,
        );
        expect(bearers).toContain('5.3.verification.guard');
      });

      then('the gate grades the dreams, by both SAFE and CLEAN', () => {
        const verifyGuard = stamped['5.3.verification.guard']!;

        // the subject is the route-local dreams
        expect(verifyGuard).toContain('$route/dreams/*.md');

        // both questions are asked — one alone passes a fix that ripples
        expect(verifyGuard).toContain('is it SAFE?');
        expect(verifyGuard).toContain('is it CLEAN?');

        // and scope is refused as an answer to either
        expect(verifyGuard).toContain("i wasn't asked to");
      });
    });
  });

  // 🔴 the clamp on the review-scope blocklist. a peer lane that sweeps the repo reads the
  //    ROUND'S OWN RECORD — the fulcrums, seeds, dreams, dispatches, and yield appendices
  //    the driver wrote to answer a prior round. that is archaeology by contract, so a
  //    prose gate over it is the `case=003` over-fire, delivered by our own hand.
  // 🟡 the blocklist is FLAT, brace-free, and double-star: `--paths-wout` runs through bhrain's
  //    `isPathMatchedByGlob`, where `*` stops at `/` and `**` crosses it. `.behavior/*` reaches
  //    no file under `.behavior/<route>/`, so it is INERT and reads exactly like a live one.
  //    the teeth: drop either flag, or narrow it to one star, and a sweep lane re-inherits
  //    the route tree.
  given('[case13] a sweep lane excludes the round own record', () => {
    when('[t0] inited with guard=heavy', () => {
      const stamped = useThen('it stamps the route', async () =>
        genStampedFiles({ guard: 'heavy' }),
      );

      then(
        'each repo-wide sweep found excludes the route + dream trees',
        () => {
          const sweeps = Object.entries(stamped)
            .filter(([file]) => file.endsWith('.guard'))
            .flatMap(([file, content]) =>
              content
                .split('\n')
                .filter((line) => line.includes('rhx review'))
                .filter(
                  (line) =>
                    line.includes("--paths-with '**/*.{ts,sh,md,snap}'") ||
                    line.includes("--paths-with '**/*.md'"),
                )
                .map((line) => ({ file, line })),
            );

          // the sweeps exist — an empty set would pass the loop below vacuously
          expect(sweeps.length).toBeGreaterThan(0);

          for (const { file, line } of sweeps) {
            expect(`${file} :: ${line}`).toContain(
              "--paths-wout '.behavior/**'",
            );
            expect(`${file} :: ${line}`).toContain("--paths-wout '.dream/**'");
          }
        },
      );

      then('the exclusion carries no brace, which would be inert', () => {
        const wouts = Object.entries(stamped)
          .filter(([file]) => file.endsWith('.guard'))
          .flatMap(([, content]) =>
            [...content.matchAll(/--paths-wout '([^']+)'/g)].map(
              (match) => match[1],
            ),
          );

        expect(wouts.length).toBeGreaterThan(0);
        for (const glob of wouts) expect(glob).not.toContain('{');
      });
    });
  });

  // 🔴 the clamp on the dispatch lane's scope. bhrain refuses a review whose combined scope
  //    is zero files (only `rules` may be `--optional`), and most branches add no dispatch —
  //    so a lane bound to the briefs globs alone malfunctions at each 5.1 arrival that
  //    adds no dispatch. the stone's own yield anchors the scope: the stone asks the
  //    driver to write it before arrival. the teeth: drop the anchor and both variants go red.
  given('[case14] the dispatch lane scope holds the stone yield', () => {
    for (const variant of ['from_vision', 'phase0_to_phaseN'] as const) {
      when(`[t0] the 5.1.execution.${variant} guard is read`, () => {
        then('the dispatch lane binds the stone yield as its anchor', () => {
          const lines = fs
            .readFileSync(
              path.join(
                __dirname,
                'templates',
                `5.1.execution.${variant}.guard`,
              ),
              'utf-8',
            )
            .split('\n');
          const slugAt = lines.findIndex((line) =>
            line.includes('slug: dispatch-lives-with-its-route'),
          );
          expect(slugAt).toBeGreaterThan(-1);

          const run = lines[slugAt + 1] ?? '';
          expect(run).toContain(
            "--paths-with '$route/5.1.execution.*.yield.md'",
          );
        });

        then('the anchor glob matches the yield the stone asks for', () => {
          const stone = fs.readFileSync(
            path.join(__dirname, 'templates', `5.1.execution.${variant}.stone`),
            'utf-8',
          );
          expect(stone).toContain(`5.1.execution.${variant}.yield.md`);
        });
      });
    }
  });

  // 🔴 the clamp on #366. the 5.3 lanes once bound two `--paths-with` flags, and a bhrain
  //    that keeps the last of a repeated flag dropped the first glob in silence. each lane
  //    now folds its globs into one braced bind. the teeth: split any bind back into two
  //    flags and this goes red.
  given('[case15] each 5.3 lane binds one --paths-with', () => {
    when('[t0] the 5.3.verification guard is read', () => {
      then('every review lane carries exactly one --paths-with', () => {
        const runs = fs
          .readFileSync(
            path.join(__dirname, 'templates', '5.3.verification.guard'),
            'utf-8',
          )
          .split('\n')
          .filter((line) => line.includes('rhx review'));

        // the lanes exist — an empty set would pass the loop below vacuously
        expect(runs.length).toBeGreaterThan(0);

        for (const run of runs)
          expect({ run, binds: run.split('--paths-with ').length - 1 }).toEqual(
            { run, binds: 1 },
          );
      });
    });
  });

  // 🔴 the clamp on #362. the vision stone asks for one ascii map of how the concepts relate,
  //    bound as an index over the sections. the teeth: drop the ask, or the index bind, and
  //    this goes red.
  given('[case16] the vision stone asks for a map bound as an index', () => {
    when('[t0] a behavior is inited', () => {
      then(
        'the inited 1.vision.stone asks for the map and its index bind',
        () => {
          initBehaviorDir({
            behaviorDir,
            behaviorDirRel: '.behavior/v2025_01_01.test-feature',
            guard: 'light',
          });

          const stone = fs.readFileSync(
            path.join(behaviorDir, '1.vision.stone'),
            'utf-8',
          );
          expect(stone).toContain('draw at least one ascii map');
          expect(stone).toContain('bind the map as an index');
        },
      );
    });
  });

  // 🔴 the clamp on `case=010`. a re-init is a findsert, so a guard stamped from a prior
  //    template keeps its old reviews. the skip must be named, never silent. the teeth: drop
  //    the slug diff and a stale guard reads as plain `kept`, and this goes red.
  given('[case17] a re-init over a guard stamped from a prior template', () => {
    when('[t0] the guard lacks a review the template holds', () => {
      then('the guard is kept, untouched, and named with what it lacks', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'light',
        });

        // stamp a prior guard: the same template, less the yagni lane's slug line
        const guardPath = path.join(behaviorDir, '1.vision.guard');
        const guardPrior = fs
          .readFileSync(guardPath, 'utf-8')
          .replace(/^\s*- slug: yagni-and-simplicity\s*$\n/m, '');
        fs.writeFileSync(guardPath, guardPrior);

        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'light',
        });

        expect(result.kept).toContain('1.vision.guard');
        expect(fs.readFileSync(guardPath, 'utf-8')).toEqual(guardPrior);
        expect(result.guardsStale).toEqual([
          { guard: '1.vision.guard', slugsAbsent: ['yagni-and-simplicity'] },
        ]);
      });
    });

    when('[t1] every guard is current', () => {
      then('no guard is named stale', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'light',
        });
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'light',
        });
        expect(result.guardsStale).toEqual([]);
        expect(result.stonesStale).toEqual([]);
      });
    });

    // the same hazard one extension over: a stone holds no slugs, so its drift is named whole.
    // the teeth: drop the stone compare and an altered stone reads as plain `kept`
    when('[t2] a stone differs from its template', () => {
      then('the stone is kept, untouched, and named stale', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'light',
        });

        // stamp a prior stone: the same template, less its map ask
        const stonePath = path.join(behaviorDir, '1.vision.stone');
        const stonePrior = fs
          .readFileSync(stonePath, 'utf-8')
          .replace('draw at least one ascii map', 'draw a picture');
        fs.writeFileSync(stonePath, stonePrior);

        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'light',
        });

        expect(result.kept).toContain('1.vision.stone');
        expect(fs.readFileSync(stonePath, 'utf-8')).toEqual(stonePrior);
        expect(result.stonesStale).toEqual(['1.vision.stone']);
      });
    });
  });

  // 🔴 the clamp on the close lanes' scope. bhrain refuses a review whose scope is zero files,
  //    and a route may own no fulcrum and no dream yet — so each close lane binds the stone's
  //    yield as an anchor, as the dispatch lane does (`[case14]`). the teeth: drop the anchor
  //    from any close lane and this goes red.
  given('[case18] each close lane binds a yield anchor', () => {
    when('[t0] the vision and execution guard templates are read', () => {
      then('every fulcrum or dream lane also binds the stone yield', () => {
        const closes = [
          '1.vision.guard.light',
          '1.vision.guard.heavy',
          '5.1.execution.from_vision.guard',
          '5.1.execution.phase0_to_phaseN.guard',
        ].flatMap((file) =>
          fs
            .readFileSync(path.join(__dirname, 'templates', file), 'utf-8')
            .split('\n')
            .filter((line) => line.includes('rhx review'))
            .filter(
              (line) =>
                line.includes('$route/.fulcrums/') ||
                line.includes('$route/dreams/'),
            )
            .map((line) => ({ file, line })),
        );

        // two close lanes per guard — an empty set would pass the loop below vacuously
        expect(closes.length).toEqual(8);

        for (const { file, line } of closes)
          expect(`${file} :: ${line}`).toMatch(
            /--paths-with '\$route\/(1\.vision|5\.1\.execution\.\*)\.yield\.md'/,
          );
      });
    });
  });
});
