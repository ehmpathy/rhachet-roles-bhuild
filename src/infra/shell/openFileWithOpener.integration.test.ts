import fs from 'fs';
import os from 'os';
import path from 'path';
import { getError, given, then, when } from 'test-fns';

import { OpenerUnavailableError } from './OpenerUnavailableError';
import { openFileWithOpener } from './openFileWithOpener';

describe('openFileWithOpener', () => {
  let tempDir: string;
  let testFile: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'openFileWithOpener-test-'),
    );
    testFile = path.join(tempDir, 'test.md');
    fs.writeFileSync(testFile, 'test content');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  given('opener is "cat" (safe test command)', () => {
    when('openFileWithOpener is called', () => {
      then('completes without error', () => {
        expect(() =>
          openFileWithOpener({ opener: 'cat', filePath: testFile }),
        ).not.toThrow();
      });
    });
  });

  given('opener is nonexistent command', () => {
    when('openFileWithOpener is called', () => {
      then('throws OpenerUnavailableError', async () => {
        const error = await getError(async () =>
          openFileWithOpener({
            opener: 'nonexistent-cmd-xyz-12345',
            filePath: testFile,
          }),
        );
        expect(error).toBeInstanceOf(OpenerUnavailableError);
      });

      then('error message contains opener name', async () => {
        const error = await getError(async () =>
          openFileWithOpener({
            opener: 'nonexistent-cmd-xyz-12345',
            filePath: testFile,
          }),
        );
        expect(error.message).toContain('nonexistent-cmd-xyz-12345');
      });

      then('error includes metadata about the failure', async () => {
        const error = await getError(async () =>
          openFileWithOpener({
            opener: 'nonexistent-cmd-xyz-12345',
            filePath: testFile,
          }),
        );
        expect(error.message).toContain('unavailable');
      });
    });
  });

  given('file path has spaces', () => {
    let fileWithSpaces: string;

    beforeEach(() => {
      fileWithSpaces = path.join(tempDir, 'file with spaces.md');
      fs.writeFileSync(fileWithSpaces, 'content with spaces');
    });

    when('openFileWithOpener is called', () => {
      then('handles path correctly', () => {
        expect(() =>
          openFileWithOpener({ opener: 'cat', filePath: fileWithSpaces }),
        ).not.toThrow();
      });
    });
  });
});
