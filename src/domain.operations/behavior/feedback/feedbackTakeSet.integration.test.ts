import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { getError } from 'helpful-errors';
import { tmpdir } from 'os';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { computeFeedbackHash } from './computeFeedbackHash';
import { feedbackTakeSet } from './feedbackTakeSet';

describe('feedbackTakeSet.integration', () => {
  let testDir: string;
  let feedbackDir: string;

  const setupTestDir = () => {
    testDir = mkdtempSync(join(tmpdir(), 'feedbackTakeSet-test-'));
    feedbackDir = join(testDir, 'feedback');
    mkdirSync(feedbackDir, { recursive: true });
    return testDir;
  };

  afterEach(() => {
    if (testDir) rmSync(testDir, { recursive: true, force: true });
  });

  given('[case1] valid [given] and [taken] paths', () => {
    when('[t0] feedbackTakeSet is called', () => {
      then('creates [taken] file with correct hash', () => {
        setupTestDir();

        const givenContent = 'this is the feedback';
        const givenPath = join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
        );
        writeFileSync(givenPath, givenContent);

        const intoPath = join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[taken].by_robot.md',
        );

        const response = 'acknowledged. will address the feedback.';

        const result = feedbackTakeSet({
          fromPath: givenPath,
          intoPath,
          response,
        });

        expect(result.takenPath).toEqual(intoPath);

        // verify hash
        const expectedHash = computeFeedbackHash({ content: givenContent });
        expect(result.givenHash).toEqual(expectedHash);

        // verify file content
        const takenContent = readFileSync(intoPath, 'utf-8');
        expect(takenContent).toContain(`givenHash: ${expectedHash}`);
        expect(takenContent).toContain(response);
      });
    });
  });

  given('[case2] [given] file does not exist', () => {
    when('[t0] feedbackTakeSet is called', () => {
      then('throws "file not found" error', async () => {
        setupTestDir();

        const givenPath = join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
        );
        const intoPath = join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[taken].by_robot.md',
        );

        const error = await getError(async () =>
          feedbackTakeSet({
            fromPath: givenPath,
            intoPath,
            response: 'response',
          }),
        );

        expect(error.message).toContain('[given] file not found');
      });
    });
  });

  given('[case3] --from path is not a [given] file', () => {
    when('[t0] feedbackTakeSet is called', () => {
      then('throws validation error', async () => {
        setupTestDir();

        const givenPath = join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[taken].by_human.md',
        );
        const intoPath = join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[taken].by_robot.md',
        );

        const error = await getError(async () =>
          feedbackTakeSet({
            fromPath: givenPath,
            intoPath,
            response: 'response',
          }),
        );

        expect(error.message).toContain('--from path must be a [given]');
      });
    });
  });

  given('[case4] --into path does not match --from derivation', () => {
    when('[t0] feedbackTakeSet is called', () => {
      then('throws validation error', async () => {
        setupTestDir();

        const givenContent = 'feedback';
        const givenPath = join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
        );
        writeFileSync(givenPath, givenContent);

        // wrong version in --into
        const intoPath = join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v2.[taken].by_robot.md',
        );

        const error = await getError(async () =>
          feedbackTakeSet({
            fromPath: givenPath,
            intoPath,
            response: 'response',
          }),
        );

        expect(error.message).toContain('--into path does not match --from');
      });
    });
  });

  given('[case5] multiline response content', () => {
    when('[t0] feedbackTakeSet is called', () => {
      then('preserves full response in [taken] file', () => {
        setupTestDir();

        const givenContent = 'feedback content';
        const givenPath = join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
        );
        writeFileSync(givenPath, givenContent);

        const intoPath = join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[taken].by_robot.md',
        );

        const response = `# feedback response

## summary
addressed all points.

## details
- point 1: done
- point 2: done
- point 3: done`;

        const result = feedbackTakeSet({
          fromPath: givenPath,
          intoPath,
          response,
        });

        const takenContent = readFileSync(result.takenPath, 'utf-8');
        expect(takenContent).toContain('# feedback response');
        expect(takenContent).toContain('- point 1: done');
        expect(takenContent).toContain('- point 3: done');
      });
    });
  });
});
