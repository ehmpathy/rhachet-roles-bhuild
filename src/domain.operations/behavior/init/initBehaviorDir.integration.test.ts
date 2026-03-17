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
        expect(result.created).toContain('3.3.1.blueprint.product.v1.guard');

        // verify files exist on disk
        expect(fs.existsSync(path.join(behaviorDir, '1.vision.guard'))).toBe(
          true,
        );
        expect(
          fs.existsSync(
            path.join(behaviorDir, '3.3.1.blueprint.product.v1.guard'),
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
          path.join(behaviorDir, '3.3.1.blueprint.product.v1.guard'),
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

      then('vision guard has light self-reviews (3 reviews)', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const visionGuard = fs.readFileSync(
          path.join(behaviorDir, '1.vision.guard'),
          'utf-8',
        );

        // light has: requirements, assumptions, questions
        expect(visionGuard).toContain('has-questioned-requirements');
        expect(visionGuard).toContain('has-questioned-assumptions');
        expect(visionGuard).toContain('has-questioned-questions');

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
        expect(result.created).toContain('3.3.1.blueprint.product.v1.guard');

        // verify no .light or .heavy suffix files created
        expect(result.created).not.toContain('1.vision.guard.light');
        expect(result.created).not.toContain('1.vision.guard.heavy');
      });

      then('vision guard has heavy self-reviews (8 reviews)', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const visionGuard = fs.readFileSync(
          path.join(behaviorDir, '1.vision.guard'),
          'utf-8',
        );

        // heavy has all reviews, research-based ones too
        expect(visionGuard).toContain('has-questioned-fundamentals');
        expect(visionGuard).toContain('has-questioned-requirements');
        expect(visionGuard).toContain('has-questioned-assumptions');
        expect(visionGuard).toContain('has-questioned-inverse');
        expect(visionGuard).toContain('has-questioned-devils-advocate');
        expect(visionGuard).toContain('has-questioned-premortem');
        expect(visionGuard).toContain('has-questioned-5whys');
        expect(visionGuard).toContain('has-questioned-questions');
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
          path.join(behaviorDir, '3.3.1.blueprint.product.v1.guard'),
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
      then('creates 5.3.verification.v1.stone', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.3.verification.v1.stone');
        expect(
          fs.existsSync(path.join(behaviorDir, '5.3.verification.v1.stone')),
        ).toBe(true);

        const content = fs.readFileSync(
          path.join(behaviorDir, '5.3.verification.v1.stone'),
          'utf-8',
        );
        expect(content).toContain('.what');
        expect(content).toContain('.why');
        expect(content).toContain('.how');
      });

      then('creates 5.3.verification.v1.guard with self-reviews', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.3.verification.v1.guard');

        const content = fs.readFileSync(
          path.join(behaviorDir, '5.3.verification.v1.guard'),
          'utf-8',
        );
        expect(content).toContain('has-behavior-coverage');
        expect(content).toContain('has-zero-test-skips');
        expect(content).toContain('has-all-tests-passed');
        // no judges on verification guard
        expect(content).not.toContain('judges:');
      });

      then('creates 5.5.playtest.v1.stone', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.5.playtest.v1.stone');
        expect(
          fs.existsSync(path.join(behaviorDir, '5.5.playtest.v1.stone')),
        ).toBe(true);

        const content = fs.readFileSync(
          path.join(behaviorDir, '5.5.playtest.v1.stone'),
          'utf-8',
        );
        expect(content).toContain('.what');
        expect(content).toContain('.why');
        expect(content).toContain('.how');
      });

      then('creates 5.5.playtest.v1.guard with self-reviews and judge', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.5.playtest.v1.guard');

        const content = fs.readFileSync(
          path.join(behaviorDir, '5.5.playtest.v1.guard'),
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
          '3.2.distill.repros.experience._.v1.guard',
        );

        const guardContent = fs.readFileSync(
          path.join(behaviorDir, '3.2.distill.repros.experience._.v1.guard'),
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
          path.join(behaviorDir, '3.2.distill.repros.experience._.v1.stone'),
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
          path.join(behaviorDir, '3.2.distill.repros.experience._.v1.stone'),
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
          path.join(behaviorDir, '3.2.distill.repros.experience._.v1.stone'),
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
          path.join(behaviorDir, '3.2.distill.repros.experience._.v1.stone'),
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
          path.join(behaviorDir, '5.3.verification.v1.stone'),
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
          path.join(behaviorDir, '5.3.verification.v1.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('snapshots?');
        expect(stoneContent).toContain('critical path?');
        expect(stoneContent).toContain('ergonomics ok?');
      });

      then('verification guard has 10 total self-reviews', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const guardContent = fs.readFileSync(
          path.join(behaviorDir, '5.3.verification.v1.guard'),
          'utf-8',
        );

        // 4 retained reviews
        expect(guardContent).toContain('has-behavior-coverage');
        expect(guardContent).toContain('has-zero-test-skips');
        expect(guardContent).toContain('has-all-tests-passed');
        expect(guardContent).toContain('has-preserved-test-intentions');

        // 6 new reviews
        expect(guardContent).toContain('has-journey-tests-from-repros');
        expect(guardContent).toContain('has-contract-output-variants-snapped');
        expect(guardContent).toContain('has-snap-changes-rationalized');
        expect(guardContent).toContain('has-critical-paths-frictionless');
        expect(guardContent).toContain('has-ergonomics-validated');
        expect(guardContent).toContain('has-play-test-convention');
      });
    });
  });

  given('[case7] evaluation stone and guard', () => {
    when('[t0] initBehaviorDir is called', () => {
      then('creates 5.2.evaluation.v1.stone', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.2.evaluation.v1.stone');
        expect(
          fs.existsSync(path.join(behaviorDir, '5.2.evaluation.v1.stone')),
        ).toBe(true);
      });

      then('evaluation stone mirrors blueprint structure', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '5.2.evaluation.v1.stone'),
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
          path.join(behaviorDir, '5.2.evaluation.v1.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('## divergence analysis');
        expect(stoneContent).toContain('### divergences found');
        expect(stoneContent).toContain('### divergence resolution');
        expect(stoneContent).toContain('repair');
        expect(stoneContent).toContain('backup');
      });

      then('evaluation stone references blueprint artifact', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '5.2.evaluation.v1.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('3.3.1.blueprint.product.v1');
        expect(stoneContent).toContain('.behavior/v2025_01_01.test-feature');
      });

      then('creates 5.2.evaluation.v1.guard with 4 self-reviews', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.2.evaluation.v1.guard');

        const guardContent = fs.readFileSync(
          path.join(behaviorDir, '5.2.evaluation.v1.guard'),
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
          path.join(behaviorDir, '5.2.evaluation.v1.guard'),
          'utf-8',
        );

        // skeptical checks of backups
        expect(guardContent).toContain('skeptical');
        expect(guardContent).toContain('laziness');
        expect(guardContent).toContain('rationale');
      });
    });
  });
});
