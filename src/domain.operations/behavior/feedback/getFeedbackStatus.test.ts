import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { computeFeedbackHash } from './computeFeedbackHash';
import { getFeedbackStatus } from './getFeedbackStatus';

describe('getFeedbackStatus', () => {
  let testDir: string;
  let feedbackDir: string;

  const setupTestDir = () => {
    testDir = mkdtempSync(join(tmpdir(), 'getFeedbackStatus-test-'));
    feedbackDir = join(testDir, 'feedback');
    mkdirSync(feedbackDir, { recursive: true });
    return testDir;
  };

  afterEach(() => {
    if (testDir) rmSync(testDir, { recursive: true, force: true });
  });

  given('[case1] feedback [given] file with no [taken] file', () => {
    when('[t0] getFeedbackStatus is called', () => {
      then('returns unresponded', () => {
        setupTestDir();

        const givenPath = join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
        );
        writeFileSync(givenPath, 'feedback content');

        const result = getFeedbackStatus({ givenPath });

        expect(result).toEqual({ status: 'unresponded' });
      });
    });
  });

  given('[case2] feedback [given] file with valid [taken] file', () => {
    when('[t0] getFeedbackStatus is called', () => {
      then('returns responded with takenPath', () => {
        setupTestDir();

        const givenContent = 'feedback content';
        const givenPath = join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
        );
        writeFileSync(givenPath, givenContent);

        const givenHash = computeFeedbackHash({ content: givenContent });
        const takenPath = join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[taken].by_robot.md',
        );
        writeFileSync(
          takenPath,
          `---
givenHash: ${givenHash}
---

response content`,
        );

        const result = getFeedbackStatus({ givenPath });

        expect(result).toEqual({ status: 'responded', takenPath });
      });
    });
  });

  given(
    '[case3] feedback [given] file updated after [taken] was created',
    () => {
      when('[t0] getFeedbackStatus is called', () => {
        then('returns stale with hash-mismatch reason', () => {
          setupTestDir();

          const givenContentOriginal = 'original feedback';
          const givenContentUpdated = 'updated feedback';
          const givenPath = join(
            feedbackDir,
            '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
          );

          // create [taken] with hash of original content
          const originalHash = computeFeedbackHash({
            content: givenContentOriginal,
          });
          const takenPath = join(
            feedbackDir,
            '5.1.execution.v1.i1.md.[feedback].v1.[taken].by_robot.md',
          );
          writeFileSync(
            takenPath,
            `---
givenHash: ${originalHash}
---

response content`,
          );

          // but [given] now has updated content
          writeFileSync(givenPath, givenContentUpdated);

          const result = getFeedbackStatus({ givenPath });

          expect(result).toEqual({
            status: 'stale',
            takenPath,
            reason: 'hash-mismatch',
          });
        });
      });
    },
  );

  given('[case4] [taken] file without givenHash in frontmatter', () => {
    when('[t0] getFeedbackStatus is called', () => {
      then('returns stale (null hash does not match)', () => {
        setupTestDir();

        const givenPath = join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
        );
        writeFileSync(givenPath, 'feedback content');

        const takenPath = join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[taken].by_robot.md',
        );
        writeFileSync(takenPath, 'response without frontmatter');

        const result = getFeedbackStatus({ givenPath });

        expect(result).toEqual({
          status: 'stale',
          takenPath,
          reason: 'hash-mismatch',
        });
      });
    });
  });
});
