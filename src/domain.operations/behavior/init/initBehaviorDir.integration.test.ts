import fs from 'fs';
import os from 'os';
import path from 'path';
import { given, then, when } from 'test-fns';

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

      then('vision guard has light self-reviews (5 reviews)', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const visionGuard = fs.readFileSync(
          path.join(behaviorDir, '1.vision.guard'),
          'utf-8',
        );

        // light has 5 self-reviews: grounded-in-reality, experience-coverage,
        // requirements, assumptions, questions
        expect(visionGuard).toContain('has-grounded-in-reality');
        expect(visionGuard).toContain('has-experience-coverage');
        expect(visionGuard).toContain('has-questioned-requirements');
        expect(visionGuard).toContain('has-questioned-assumptions');
        expect(visionGuard).toContain('has-questioned-questions');

        // light also carries the experience-coverage peer review + a reviewed? judge,
        // wired against the widened glob that self-anchors on the vision yield — a
        // zero-case-file vision must still match at least that one file, never zero
        expect(visionGuard).toContain('slug: experience-coverage');
        expect(visionGuard).toContain("--paths-with '$route/1.vision.*.md'");
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

      then('vision guard has heavy self-reviews (10 reviews)', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const visionGuard = fs.readFileSync(
          path.join(behaviorDir, '1.vision.guard'),
          'utf-8',
        );

        // heavy has all 10 self-reviews, research-based ones too
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
        expect(visionGuard).toContain("--paths-with '$route/1.vision.*.md'");
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
      then('verification stone references repros artifact', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '5.3.verification.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('3.2.distill.repros.experience');
        expect(stoneContent).toContain('repros artifact');
      });

      then('verification stone has enhanced behavior coverage table', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '5.3.verification.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('snapshots?');
        expect(stoneContent).toContain('critical path?');
        expect(stoneContent).toContain('ergonomics ok?');
      });

      then('verification guard has 8 total self-reviews', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const guardContent = fs.readFileSync(
          path.join(behaviorDir, '5.3.verification.guard'),
          'utf-8',
        );

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

  given('[case8] the vision guard carries the archaeology lint', () => {
    for (const guard of ['light', 'heavy'] as const) {
      when(`[t0] inited with guard=${guard}`, () => {
        // .note = read inline rather than via useThen: useThen returns a deferred
        //         PROXY, and a proxy cannot stand in for a primitive string
        const stampVisionGuard = (): string => {
          initBehaviorDir({
            behaviorDir,
            behaviorDirRel: '.behavior/v2025_01_01.test-feature',
            guard,
          });
          return fs.readFileSync(
            path.join(behaviorDir, '1.vision.guard'),
            'utf-8',
          );
        };

        then('the archaeology lane is bound, with its stone', () => {
          const visionGuard = stampVisionGuard();
          expect(visionGuard).toContain('slug: archaeology-of-yields');
          expect(visionGuard).toContain(
            '$rhx review.for.yield-archaeology --route $route --stone 1.vision',
          );
        });

        // 🔴 the clamp. a lint bounds ROUNDS nowhere — it costs $0 and 1ms — so a
        //    budget low enough to exhaust would unlock the level on a yield that
        //    still states its own road. this pins the intent so a later sweep
        //    cannot flatten it to the 3 every brain lane carries.
        then(
          'the archaeology lane carries a budget that cannot exhaust',
          () => {
            const lintLane = stampVisionGuard()
              .split('- slug: archaeology-of-yields')[1]!
              .split('- slug:')[0]!;
            expect(lintLane).toContain('budget: 99');
          },
        );

        // 🔴 the clamp on the scope narrowing. a route-wide `$route/*.yield.md`
        //    reads clean at the vision stage — no later yield exists yet — and on a
        //    RE-DRIVE it pulls every approved downstream yield into this gate.
        then(
          'every prose lane binds THIS stage, never a route-wide glob',
          () => {
            const visionGuard = stampVisionGuard();
            expect(visionGuard).not.toContain(
              "--paths-with '$route/*.yield.md'",
            );
            expect(visionGuard).toContain(
              "--paths-with '$route/1.vision.yield.md'",
            );
          },
        );

        // 🔴 the clamp on the variant seam. `define.guard-variants-heavy-light`
        //    puts SELF-review depth on the variant axis and peer lanes nowhere on
        //    it, so a peer lane carried by heavy alone is a detection hole keyed
        //    to a flag. both variants bind both terse subjects, or this goes red.
        then('both guard variants bind the SAME terse subjects', () => {
          const visionGuard = stampVisionGuard();
          expect(visionGuard).toContain('slug: density-of-yields');
          expect(visionGuard).toContain('slug: density-of-briefs');
        });

        // 🔴 the clamp on the collapse. the three rubrics merged because each
        //    repairs by REMOVAL, so a verdict from any of them ends in one
        //    instruction. a re-split would restore three context loads and three
        //    budgets to buy that one answer.
        // 🟡 `density-of-` is the SURVIVOR's name, so it is absent from this list
        //    by construction. the teeth are unchanged: a re-split reintroduces
        //    `dense-of-` and `overzoom-of-` BESIDE it, and either one goes red.
        // 🟡 `cut-of-` and `terse-of-` are the two interim names the survivor
        //    carried. `terse-of-` was retired because it asserts a property the
        //    rubric REFUSES to demand — "terse is not thin; a settleable claim
        //    stays, however long it runs" — where `density` grades signal per
        //    word, which is what all 10 rules actually move.
        // 🔴 `dense-of-` and `density-of-` are one character-class apart, and
        //    only one is legal. the full `slug: ` prefix is what parts them, so
        //    a match on the bare stem would go red on the survivor.
        then('the three rubrics stay merged into one lane per subject', () => {
          const visionGuard = stampVisionGuard();
          for (const retired of [
            'dense-of-',
            'cut-of-',
            'terse-of-',
            'overzoom-of-',
          ])
            expect(visionGuard).not.toContain(`slug: ${retired}`);
        });
      });
    }
  });

  // 🔴 the clamp on the SPREAD. every stone that emits a yield carries a prose
  //    `density-of-yields` gate; the archaeology concern is the deterministic
  //    FLOOR under that gate. so the invariant is a triple: wherever
  //    `density-of-yields` lands, `has-ejected-the-archaeology` (write-time self)
  //    and `archaeology-of-yields` (level-0 lint) MUST land with it. a later
  //    sweep that drops the floor from any one layer goes red here, never in
  //    the wild.
  given('[case9] every terse concern carries an archaeology floor', () => {
    when('[t0] inited with guard=heavy (stamps the most guards)', () => {
      then('every guard with a density-of-yields gate carries both floors', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const guardFiles = fs
          .readdirSync(behaviorDir)
          .filter((file) => file.endsWith('.guard'));

        // a heavy init must stamp at least one guard that carries the terse
        // gate, else the walk below is vacuously true and clamps naught
        const terseBearers = guardFiles.filter((file) =>
          fs
            .readFileSync(path.join(behaviorDir, file), 'utf-8')
            .includes('slug: density-of-yields'),
        );
        expect(terseBearers.length).toBeGreaterThan(0);

        for (const file of terseBearers) {
          const guard = fs.readFileSync(path.join(behaviorDir, file), 'utf-8');
          // pin the WHOLE slug line — a bare `slug: x` substring also matches
          // `slug: x-renamed`, so the trailing newline is what gives teeth
          expect(guard).toContain('- slug: has-ejected-the-archaeology\n');
          expect(guard).toContain('- slug: archaeology-of-yields\n');
          expect(guard).toContain(
            '$rhx review.for.yield-archaeology --route $route --stone',
          );
        }
      });
    });
  });

  // 🔴 the clamp on the ESCALATION council. `defer-fulcrums-to-last` governs WHEN to
  //    escalate to the human — once, at the end — so the `fulcrums-driver-owned`
  //    council rides the TERMINAL stone (5.5.playtest) alone. this pins BOTH halves:
  //    it lands on playtest bound to the inventory, AND it does NOT spread. a copy
  //    onto a second stone would escalate one council twice.
  // 🟡 the DRIVER-OWNED close check is a SEPARATE lane (`fulcrums-self-sufficient`),
  //    clamped by [case11] — it DOES run per-stage (vision + execution). the two are
  //    not the same lane: escalation is terminal, the close check is where work is born.
  given('[case10] the fulcrum council rides the terminal stone alone', () => {
    when('[t0] inited with guard=heavy (stamps the most guards)', () => {
      then('5.5.playtest carries the fulcrum lane, bound to the inventory', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const playtestGuard = fs.readFileSync(
          path.join(behaviorDir, '5.5.playtest.guard'),
          'utf-8',
        );
        expect(playtestGuard).toContain('- slug: fulcrums-driver-owned\n');
        expect(playtestGuard).toContain(
          "--paths-with '$route/.fulcrums/inventory.of=fulcrums.*'",
        );
      });

      then('no OTHER guard carries the fulcrum lane', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const bearers = fs
          .readdirSync(behaviorDir)
          .filter((file) => file.endsWith('.guard'))
          .filter((file) =>
            fs
              .readFileSync(path.join(behaviorDir, file), 'utf-8')
              .includes('- slug: fulcrums-driver-owned\n'),
          );
        expect(bearers).toEqual(['5.5.playtest.guard']);
      });
    });
  });

  // 🔴 the clamp on the per-stage DRIVER-OWNED close checks. the driver opens fulcrums
  //    and spots adjacent fixes AT vision + execution, so both lanes run THERE — where
  //    the context that closes them is fresh — never only at the terminal council.
  //    `fulcrums-self-sufficient`  = whatever closes without the human should be closed
  //    `scouts-honor-fix-forward`  = a safe+clean+adjacent fix is done now, not dreamed
  //    the two are PAIRED, so they land on the same guards; the bearer sets must match.
  given('[case11] the driver-owned close checks run per stage', () => {
    when('[t0] inited with guard=heavy (stamps the most guards)', () => {
      then('vision + execution guards carry both close lanes', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const guardFiles = fs
          .readdirSync(behaviorDir)
          .filter((file) => file.endsWith('.guard'));

        const carries = (slug: string): string[] =>
          guardFiles
            .filter((file) =>
              fs
                .readFileSync(path.join(behaviorDir, file), 'utf-8')
                .includes(`- slug: ${slug}\n`),
            )
            .sort();

        const fulcrumBearers = carries('fulcrums-self-sufficient');
        const scoutsBearers = carries('scouts-honor-fix-forward');

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
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const visionGuard = fs.readFileSync(
          path.join(behaviorDir, '1.vision.guard'),
          'utf-8',
        );

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
  // 🟡 the teeth: a self gate cannot be overruled (`rule.always.bear-every-self-review`),
  //    where a peer lane can exhaust. so the self bearer set is the stronger guarantee,
  //    and a drop of verification from it is the silent regression this catches.
  given('[case12] a deferred adjacent fix is caught at write time', () => {
    when('[t0] inited with guard=heavy', () => {
      then('execution + verification carry the self gate', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const bearers = fs
          .readdirSync(behaviorDir)
          .filter((file) => file.endsWith('.guard'))
          .filter((file) =>
            fs
              .readFileSync(path.join(behaviorDir, file), 'utf-8')
              .includes('- slug: has-fixed-forward-adjacent-fixes\n'),
          )
          .sort();

        expect(
          bearers.some((file) => file.startsWith('5.1.execution')),
        ).toBe(true);
        expect(bearers).toContain('5.3.verification.guard');
      });

      then('the gate grades the dreams, by both SAFE and CLEAN', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const verifyGuard = fs.readFileSync(
          path.join(behaviorDir, '5.3.verification.guard'),
          'utf-8',
        );

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
  // 🟡 the blocklist is FLAT and brace-free on purpose: `--paths-wout` runs through bhrain's
  //    hand-rolled `isPathMatchedByGlob`, which expands no braces and lets `*` cross `/`.
  //    a braced exclusion there is INERT and reads exactly like a live one (bhuild#391).
  //    the teeth: drop either flag and a sweep lane re-inherits the route tree.
  given('[case13] a sweep lane never reads the round own record', () => {
    when('[t0] inited with guard=heavy', () => {
      then('every repo-wide sweep excludes the route + dream trees', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const sweeps = fs
          .readdirSync(behaviorDir)
          .filter((file) => file.endsWith('.guard'))
          .flatMap((file) =>
            fs
              .readFileSync(path.join(behaviorDir, file), 'utf-8')
              .split('\n')
              .filter((line) => line.includes('rhx review'))
              .filter(
                (line) =>
                  line.includes("--paths-with '**/*.{ts,sh,md,snap}'") ||
                  line.includes("--paths-with '**/*.md'"),
              )
              .map((line) => ({ file, line })),
          );

        // the sweeps exist — an empty set would pass every assertion below
        expect(sweeps.length).toBeGreaterThan(0);

        for (const { file, line } of sweeps) {
          expect(`${file} :: ${line}`).toContain("--paths-wout '.behavior/*'");
          expect(`${file} :: ${line}`).toContain("--paths-wout '.dream/*'");
        }
      });

      then('the exclusion carries no brace, which would be inert', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const wouts = fs
          .readdirSync(behaviorDir)
          .filter((file) => file.endsWith('.guard'))
          .flatMap((file) =>
            [
              ...fs
                .readFileSync(path.join(behaviorDir, file), 'utf-8')
                .matchAll(/--paths-wout '([^']+)'/g),
            ].map((match) => match[1]),
          );

        expect(wouts.length).toBeGreaterThan(0);
        for (const glob of wouts) expect(glob).not.toContain('{');
      });
    });
  });
});
