import fs from 'fs';
import os from 'os';
import path from 'path';
import { given, then, when } from 'test-fns';

import { getBehaviorDir } from './getBehaviorDir';

describe('getBehaviorDir', () => {
  let tempDir: string;
  let context: { cwd: string };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'getBehaviorDir-test-'));
    context = { cwd: tempDir };
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  given('no .behavior directory', () => {
    when('getBehaviorDir is called', () => {
      then('throws BadRequestError', () => {
        expect(() => getBehaviorDir({ name: 'test' }, context)).toThrow(
          '.behavior/ directory not found',
        );
      });
    });
  });

  given('.behavior directory with one matching behavior', () => {
    beforeEach(() => {
      const behaviorDir = path.join(
        tempDir,
        '.behavior',
        'v2025_01_01.my-feature',
      );
      fs.mkdirSync(behaviorDir, { recursive: true });
    });

    when('getBehaviorDir is called with matching name', () => {
      then('returns the behavior directory path', () => {
        const result = getBehaviorDir({ name: 'my-feature' }, context);
        expect(result).toContain('v2025_01_01.my-feature');
      });
    });

    when('getBehaviorDir is called with partial name', () => {
      then('returns the behavior directory path', () => {
        const result = getBehaviorDir({ name: 'feature' }, context);
        expect(result).toContain('v2025_01_01.my-feature');
      });
    });
  });

  given('.behavior directory with no matching behavior', () => {
    beforeEach(() => {
      const behaviorDir = path.join(
        tempDir,
        '.behavior',
        'v2025_01_01.other-thing',
      );
      fs.mkdirSync(behaviorDir, { recursive: true });
    });

    when('getBehaviorDir is called with non-matching name', () => {
      then('throws BadRequestError with available behaviors', () => {
        expect(() => getBehaviorDir({ name: 'nonexistent' }, context)).toThrow(
          "no behavior found matching 'nonexistent'",
        );
      });
    });
  });

  given('.behavior directory with multiple matching behaviors', () => {
    beforeEach(() => {
      fs.mkdirSync(path.join(tempDir, '.behavior', 'v2025_01_01.feature-a'), {
        recursive: true,
      });
      fs.mkdirSync(path.join(tempDir, '.behavior', 'v2025_01_02.feature-b'), {
        recursive: true,
      });
    });

    when('getBehaviorDir is called with ambiguous name', () => {
      then('throws BadRequestError listing matches', () => {
        expect(() => getBehaviorDir({ name: 'feature' }, context)).toThrow(
          "multiple behaviors match 'feature'",
        );
      });
    });
  });
});
