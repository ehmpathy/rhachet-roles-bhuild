import fs from 'fs';
import os from 'os';
import path from 'path';
import { given, then, when } from 'test-fns';

import { initBehaviorDir } from './initBehaviorDir';

describe('initBehaviorDir', () => {
  let tempDir: string;
  let behaviorDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'initBehaviorDir-test-'));
    behaviorDir = path.join(tempDir, '.behavior', 'v2025_01_01.test-feature');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  given('empty behavior directory', () => {
    when('initBehaviorDir is called', () => {
      then('creates all template files', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created.length).toBeGreaterThan(0);
        expect(result.kept.length).toBe(0);

        // verify files created
        expect(fs.existsSync(path.join(behaviorDir, '0.wish.md'))).toBe(true);
        expect(fs.existsSync(path.join(behaviorDir, '1.vision.md'))).toBe(true);
        expect(
          fs.existsSync(path.join(behaviorDir, '2.1.criteria.blackbox.src')),
        ).toBe(true);
      });

      then('replaces $BEHAVIOR_DIR_REL in content', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const criteriaBlackboxSrc = fs.readFileSync(
          path.join(behaviorDir, '2.1.criteria.blackbox.src'),
          'utf-8',
        );

        expect(criteriaBlackboxSrc).toContain(
          '.behavior/v2025_01_01.test-feature/0.wish.md',
        );
        expect(criteriaBlackboxSrc).not.toContain('$BEHAVIOR_DIR_REL');
      });
    });
  });

  given('behavior directory with some files already present', () => {
    beforeEach(() => {
      fs.mkdirSync(behaviorDir, { recursive: true });
      fs.writeFileSync(
        path.join(behaviorDir, '0.wish.md'),
        'wish = my custom wish\n',
      );
    });

    when('initBehaviorDir is called', () => {
      then('keeps files that already exist', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.kept).toContain('0.wish.md');
        expect(result.created).not.toContain('0.wish.md');

        // verify content preserved
        const wishContent = fs.readFileSync(
          path.join(behaviorDir, '0.wish.md'),
          'utf-8',
        );
        expect(wishContent).toBe('wish = my custom wish\n');
      });

      then('creates files that do not exist', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('1.vision.md');
        expect(fs.existsSync(path.join(behaviorDir, '1.vision.md'))).toBe(true);
      });
    });
  });

  given('running twice', () => {
    when('initBehaviorDir is called twice', () => {
      then('is idempotent - second run keeps all files', () => {
        const firstResult = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const secondResult = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(firstResult.created.length).toBeGreaterThan(0);
        expect(secondResult.created.length).toBe(0);
        expect(secondResult.kept.length).toBe(firstResult.created.length);
      });
    });
  });
});
