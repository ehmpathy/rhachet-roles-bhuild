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
        expect(result.created).toContain('3.3.blueprint.v1.guard');

        // verify files exist on disk
        expect(fs.existsSync(path.join(behaviorDir, '1.vision.guard'))).toBe(
          true,
        );
        expect(
          fs.existsSync(path.join(behaviorDir, '3.3.blueprint.v1.guard')),
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
          path.join(behaviorDir, '3.3.blueprint.v1.guard'),
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
        expect(result.created).toContain('3.3.blueprint.v1.guard');

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
          path.join(behaviorDir, '3.3.blueprint.v1.guard'),
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

  given('[case3] guard level change after init', () => {
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
});
