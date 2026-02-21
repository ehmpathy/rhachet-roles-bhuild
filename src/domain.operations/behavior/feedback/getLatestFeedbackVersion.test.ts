import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { getLatestFeedbackVersion } from './getLatestFeedbackVersion';

describe('getLatestFeedbackVersion', () => {
  let testDir: string;

  const setupTestDir = () => {
    testDir = mkdtempSync(join(tmpdir(), 'getLatestFeedbackVersion-test-'));
    return testDir;
  };

  afterEach(() => {
    if (testDir) rmSync(testDir, { recursive: true, force: true });
  });

  given('[case1] behavior directory with no feedback files', () => {
    when('[t0] getLatestFeedbackVersion is called', () => {
      then('returns null', () => {
        setupTestDir();

        // create artifact but no feedback
        writeFileSync(join(testDir, '5.1.execution.v1.i1.md'), 'content');

        const result = getLatestFeedbackVersion({
          behaviorDir: testDir,
          artifactFileName: '5.1.execution.v1.i1.md',
        });

        expect(result).toEqual(null);
      });
    });
  });

  given('[case2] behavior directory with v1 feedback', () => {
    when('[t0] getLatestFeedbackVersion is called', () => {
      then('returns 1', () => {
        setupTestDir();

        // create artifact and v1 feedback
        writeFileSync(join(testDir, '5.1.execution.v1.i1.md'), 'content');
        writeFileSync(
          join(
            testDir,
            '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
          ),
          'feedback v1',
        );

        const result = getLatestFeedbackVersion({
          behaviorDir: testDir,
          artifactFileName: '5.1.execution.v1.i1.md',
        });

        expect(result).toEqual(1);
      });
    });
  });

  given('[case3] behavior directory with v1 and v2 feedback', () => {
    when('[t0] getLatestFeedbackVersion is called', () => {
      then('returns 2', () => {
        setupTestDir();

        // create artifact and v1+v2 feedback
        writeFileSync(join(testDir, '5.1.execution.v1.i1.md'), 'content');
        writeFileSync(
          join(
            testDir,
            '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
          ),
          'feedback v1',
        );
        writeFileSync(
          join(
            testDir,
            '5.1.execution.v1.i1.md.[feedback].v2.[given].by_human.md',
          ),
          'feedback v2',
        );

        const result = getLatestFeedbackVersion({
          behaviorDir: testDir,
          artifactFileName: '5.1.execution.v1.i1.md',
        });

        expect(result).toEqual(2);
      });
    });
  });

  given(
    '[case4] behavior directory with feedback for multiple artifacts',
    () => {
      when('[t0] getLatestFeedbackVersion is called for one artifact', () => {
        then('ignores feedback for other artifacts', () => {
          setupTestDir();

          // create two artifacts with different feedback
          writeFileSync(join(testDir, '5.1.execution.v1.i1.md'), 'content');
          writeFileSync(join(testDir, '0.wish.md'), 'content');

          // execution has v1 feedback
          writeFileSync(
            join(
              testDir,
              '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
            ),
            'feedback v1',
          );

          // wish has v1+v2+v3 feedback
          writeFileSync(
            join(testDir, '0.wish.md.[feedback].v1.[given].by_human.md'),
            'feedback v1',
          );
          writeFileSync(
            join(testDir, '0.wish.md.[feedback].v2.[given].by_human.md'),
            'feedback v2',
          );
          writeFileSync(
            join(testDir, '0.wish.md.[feedback].v3.[given].by_human.md'),
            'feedback v3',
          );

          // should only see execution feedback (v1)
          const result = getLatestFeedbackVersion({
            behaviorDir: testDir,
            artifactFileName: '5.1.execution.v1.i1.md',
          });

          expect(result).toEqual(1);
        });
      });
    },
  );

  given('[case5] feedback versions created out of order', () => {
    when('[t0] getLatestFeedbackVersion is called', () => {
      then('returns highest version regardless of fs order', () => {
        setupTestDir();

        writeFileSync(join(testDir, '5.1.execution.v1.i1.md'), 'content');

        // create v3 first, then v1, then v2
        writeFileSync(
          join(
            testDir,
            '5.1.execution.v1.i1.md.[feedback].v3.[given].by_human.md',
          ),
          'feedback v3',
        );
        writeFileSync(
          join(
            testDir,
            '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
          ),
          'feedback v1',
        );
        writeFileSync(
          join(
            testDir,
            '5.1.execution.v1.i1.md.[feedback].v2.[given].by_human.md',
          ),
          'feedback v2',
        );

        const result = getLatestFeedbackVersion({
          behaviorDir: testDir,
          artifactFileName: '5.1.execution.v1.i1.md',
        });

        expect(result).toEqual(3);
      });
    });
  });
});
