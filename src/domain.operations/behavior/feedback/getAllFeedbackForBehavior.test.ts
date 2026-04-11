import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { getAllFeedbackForBehavior } from './getAllFeedbackForBehavior';

describe('getAllFeedbackForBehavior', () => {
  let testDir: string;
  let feedbackDir: string;

  const setupTestDir = () => {
    testDir = mkdtempSync(join(tmpdir(), 'getAllFeedbackForBehavior-test-'));
    feedbackDir = join(testDir, 'feedback');
    mkdirSync(feedbackDir, { recursive: true });
    return testDir;
  };

  afterEach(() => {
    if (testDir) rmSync(testDir, { recursive: true, force: true });
  });

  given('[case1] behavior directory with no feedback/ subdir', () => {
    when('[t0] getAllFeedbackForBehavior is called', () => {
      then('returns empty array', () => {
        testDir = mkdtempSync(
          join(tmpdir(), 'getAllFeedbackForBehavior-test-'),
        );
        // no feedback/ subdir created

        const result = getAllFeedbackForBehavior({ behaviorDir: testDir });

        expect(result).toEqual([]);
      });
    });
  });

  given('[case2] behavior directory with empty feedback/ subdir', () => {
    when('[t0] getAllFeedbackForBehavior is called', () => {
      then('returns empty array', () => {
        setupTestDir();
        // feedback/ exists but is empty

        const result = getAllFeedbackForBehavior({ behaviorDir: testDir });

        expect(result).toEqual([]);
      });
    });
  });

  given('[case3] behavior directory with one [given] feedback file', () => {
    when('[t0] getAllFeedbackForBehavior is called', () => {
      then('returns that feedback file', () => {
        setupTestDir();

        writeFileSync(
          join(
            feedbackDir,
            '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
          ),
          'feedback content',
        );

        const result = getAllFeedbackForBehavior({ behaviorDir: testDir });

        expect(result).toHaveLength(1);
        expect(result[0]?.artifactFileName).toEqual('5.1.execution.v1.i1.md');
        expect(result[0]?.feedbackVersion).toEqual(1);
        expect(result[0]?.givenPath).toContain('feedback/');
      });
    });
  });

  given('[case4] behavior directory with multiple feedback versions', () => {
    when('[t0] getAllFeedbackForBehavior is called', () => {
      then('returns all versions sorted by version (highest first)', () => {
        setupTestDir();

        writeFileSync(
          join(
            feedbackDir,
            '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
          ),
          'feedback v1',
        );
        writeFileSync(
          join(
            feedbackDir,
            '5.1.execution.v1.i1.md.[feedback].v2.[given].by_human.md',
          ),
          'feedback v2',
        );
        writeFileSync(
          join(
            feedbackDir,
            '5.1.execution.v1.i1.md.[feedback].v3.[given].by_human.md',
          ),
          'feedback v3',
        );

        const result = getAllFeedbackForBehavior({ behaviorDir: testDir });

        expect(result).toHaveLength(3);
        expect(result[0]?.feedbackVersion).toEqual(3);
        expect(result[1]?.feedbackVersion).toEqual(2);
        expect(result[2]?.feedbackVersion).toEqual(1);
      });
    });
  });

  given(
    '[case5] behavior directory with feedback for multiple artifacts',
    () => {
      when('[t0] getAllFeedbackForBehavior is called', () => {
        then('returns feedback sorted by artifact name, then version', () => {
          setupTestDir();

          writeFileSync(
            join(feedbackDir, '0.wish.md.[feedback].v1.[given].by_human.md'),
            'wish feedback',
          );
          writeFileSync(
            join(
              feedbackDir,
              '5.1.execution.v1.i1.md.[feedback].v2.[given].by_human.md',
            ),
            'exec feedback v2',
          );
          writeFileSync(
            join(
              feedbackDir,
              '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
            ),
            'exec feedback v1',
          );

          const result = getAllFeedbackForBehavior({ behaviorDir: testDir });

          expect(result).toHaveLength(3);
          // 0.wish comes before 5.1.execution
          expect(result[0]?.artifactFileName).toEqual('0.wish.md');
          expect(result[1]?.artifactFileName).toEqual('5.1.execution.v1.i1.md');
          expect(result[1]?.feedbackVersion).toEqual(2);
          expect(result[2]?.artifactFileName).toEqual('5.1.execution.v1.i1.md');
          expect(result[2]?.feedbackVersion).toEqual(1);
        });
      });
    },
  );

  given(
    '[case6] behavior directory with [taken] files (should be ignored)',
    () => {
      when('[t0] getAllFeedbackForBehavior is called', () => {
        then('returns only [given] files, ignores [taken]', () => {
          setupTestDir();

          // [given] file
          writeFileSync(
            join(
              feedbackDir,
              '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
            ),
            'feedback content',
          );
          // [taken] file (should be ignored)
          writeFileSync(
            join(
              feedbackDir,
              '5.1.execution.v1.i1.md.[feedback].v1.[taken].by_robot.md',
            ),
            'response content',
          );

          const result = getAllFeedbackForBehavior({ behaviorDir: testDir });

          expect(result).toHaveLength(1);
          expect(result[0]?.givenPath).toContain('[given]');
        });
      });
    },
  );
});
