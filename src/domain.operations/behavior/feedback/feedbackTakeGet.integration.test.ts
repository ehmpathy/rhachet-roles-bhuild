import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { computeFeedbackHash } from './computeFeedbackHash';
import { feedbackTakeGet } from './feedbackTakeGet';

describe('feedbackTakeGet.integration', () => {
  given('[case1] behavior with no feedback files', () => {
    const testDir = path.join(os.tmpdir(), 'feedbackTakeGet-int-case1');

    const scene = useBeforeAll(async () => {
      // clean and setup test repo
      fs.rmSync(testDir, { recursive: true, force: true });
      fs.mkdirSync(testDir, { recursive: true });

      // init git repo
      execSync('git init', { cwd: testDir });
      execSync('git config user.email "test@test.com"', { cwd: testDir });
      execSync('git config user.name "Test"', { cwd: testDir });
      fs.writeFileSync(path.join(testDir, 'README.md'), '# test');
      execSync('git add . && git commit -m "init"', { cwd: testDir });

      // create behavior directory
      const behaviorDir = path.join(
        testDir,
        '.behavior/v2026_01_01.test-behavior',
      );
      fs.mkdirSync(behaviorDir, { recursive: true });
      fs.writeFileSync(path.join(behaviorDir, '0.wish.md'), 'the wish');

      return { testDir, behaviorDir };
    });

    afterAll(() => {
      fs.rmSync(testDir, { recursive: true, force: true });
    });

    when('[t0] feedbackTakeGet is called', () => {
      then('returns empty feedback list', () => {
        const result = feedbackTakeGet(
          { behavior: 'v2026_01_01.test-behavior', force: true },
          { cwd: scene.testDir },
        );

        expect(result.feedback).toHaveLength(0);
        expect(result.unresponded).toEqual(0);
        expect(result.responded).toEqual(0);
        expect(result.stale).toEqual(0);
      });
    });
  });

  given('[case2] behavior with one unresponded feedback', () => {
    const testDir = path.join(os.tmpdir(), 'feedbackTakeGet-int-case2');

    const scene = useBeforeAll(async () => {
      // clean and setup test repo
      fs.rmSync(testDir, { recursive: true, force: true });
      fs.mkdirSync(testDir, { recursive: true });

      // init git repo
      execSync('git init', { cwd: testDir });
      execSync('git config user.email "test@test.com"', { cwd: testDir });
      execSync('git config user.name "Test"', { cwd: testDir });
      fs.writeFileSync(path.join(testDir, 'README.md'), '# test');
      execSync('git add . && git commit -m "init"', { cwd: testDir });

      // create behavior directory
      const behaviorDir = path.join(
        testDir,
        '.behavior/v2026_01_01.test-behavior',
      );
      const feedbackDir = path.join(behaviorDir, 'feedback');
      fs.mkdirSync(feedbackDir, { recursive: true });
      fs.writeFileSync(path.join(behaviorDir, '0.wish.md'), 'the wish');

      // create unresponded feedback
      fs.writeFileSync(
        path.join(feedbackDir, '0.wish.md.[feedback].v1.[given].by_human.md'),
        'feedback content',
      );

      return { testDir, behaviorDir, feedbackDir };
    });

    afterAll(() => {
      fs.rmSync(testDir, { recursive: true, force: true });
    });

    when('[t0] feedbackTakeGet is called', () => {
      then('returns unresponded count of 1', () => {
        const result = feedbackTakeGet(
          { behavior: 'v2026_01_01.test-behavior', force: true },
          { cwd: scene.testDir },
        );

        expect(result.feedback).toHaveLength(1);
        expect(result.unresponded).toEqual(1);
        expect(result.responded).toEqual(0);
        expect(result.stale).toEqual(0);
        expect(result.feedback[0]?.status.status).toEqual('unresponded');
      });
    });
  });

  given('[case3] behavior with one responded feedback', () => {
    const testDir = path.join(os.tmpdir(), 'feedbackTakeGet-int-case3');

    const scene = useBeforeAll(async () => {
      // clean and setup test repo
      fs.rmSync(testDir, { recursive: true, force: true });
      fs.mkdirSync(testDir, { recursive: true });

      // init git repo
      execSync('git init', { cwd: testDir });
      execSync('git config user.email "test@test.com"', { cwd: testDir });
      execSync('git config user.name "Test"', { cwd: testDir });
      fs.writeFileSync(path.join(testDir, 'README.md'), '# test');
      execSync('git add . && git commit -m "init"', { cwd: testDir });

      // create behavior directory
      const behaviorDir = path.join(
        testDir,
        '.behavior/v2026_01_01.test-behavior',
      );
      const feedbackDir = path.join(behaviorDir, 'feedback');
      fs.mkdirSync(feedbackDir, { recursive: true });
      fs.writeFileSync(path.join(behaviorDir, '0.wish.md'), 'the wish');

      // create responded feedback
      const givenContent = 'feedback content';
      fs.writeFileSync(
        path.join(feedbackDir, '0.wish.md.[feedback].v1.[given].by_human.md'),
        givenContent,
      );

      const givenHash = computeFeedbackHash({ content: givenContent });
      fs.writeFileSync(
        path.join(feedbackDir, '0.wish.md.[feedback].v1.[taken].by_robot.md'),
        `---
givenHash: ${givenHash}
---

response content`,
      );

      return { testDir, behaviorDir, feedbackDir };
    });

    afterAll(() => {
      fs.rmSync(testDir, { recursive: true, force: true });
    });

    when('[t0] feedbackTakeGet is called', () => {
      then('returns responded count of 1', () => {
        const result = feedbackTakeGet(
          { behavior: 'v2026_01_01.test-behavior', force: true },
          { cwd: scene.testDir },
        );

        expect(result.feedback).toHaveLength(1);
        expect(result.unresponded).toEqual(0);
        expect(result.responded).toEqual(1);
        expect(result.stale).toEqual(0);
        expect(result.feedback[0]?.status.status).toEqual('responded');
      });
    });
  });

  given('[case4] behavior with stale feedback (hash mismatch)', () => {
    const testDir = path.join(os.tmpdir(), 'feedbackTakeGet-int-case4');

    const scene = useBeforeAll(async () => {
      // clean and setup test repo
      fs.rmSync(testDir, { recursive: true, force: true });
      fs.mkdirSync(testDir, { recursive: true });

      // init git repo
      execSync('git init', { cwd: testDir });
      execSync('git config user.email "test@test.com"', { cwd: testDir });
      execSync('git config user.name "Test"', { cwd: testDir });
      fs.writeFileSync(path.join(testDir, 'README.md'), '# test');
      execSync('git add . && git commit -m "init"', { cwd: testDir });

      // create behavior directory
      const behaviorDir = path.join(
        testDir,
        '.behavior/v2026_01_01.test-behavior',
      );
      const feedbackDir = path.join(behaviorDir, 'feedback');
      fs.mkdirSync(feedbackDir, { recursive: true });
      fs.writeFileSync(path.join(behaviorDir, '0.wish.md'), 'the wish');

      // create stale feedback
      const originalContent = 'original feedback';
      const updatedContent = 'updated feedback';

      // [taken] has hash of original content
      const originalHash = computeFeedbackHash({ content: originalContent });
      fs.writeFileSync(
        path.join(feedbackDir, '0.wish.md.[feedback].v1.[taken].by_robot.md'),
        `---
givenHash: ${originalHash}
---

response content`,
      );

      // [given] has updated content (mismatch)
      fs.writeFileSync(
        path.join(feedbackDir, '0.wish.md.[feedback].v1.[given].by_human.md'),
        updatedContent,
      );

      return { testDir, behaviorDir, feedbackDir };
    });

    afterAll(() => {
      fs.rmSync(testDir, { recursive: true, force: true });
    });

    when('[t0] feedbackTakeGet is called', () => {
      then('returns stale count of 1', () => {
        const result = feedbackTakeGet(
          { behavior: 'v2026_01_01.test-behavior', force: true },
          { cwd: scene.testDir },
        );

        expect(result.feedback).toHaveLength(1);
        expect(result.unresponded).toEqual(0);
        expect(result.responded).toEqual(0);
        expect(result.stale).toEqual(1);
        expect(result.feedback[0]?.status.status).toEqual('stale');
      });
    });
  });

  given('[case5] behavior with mixed feedback statuses', () => {
    const testDir = path.join(os.tmpdir(), 'feedbackTakeGet-int-case5');

    const scene = useBeforeAll(async () => {
      // clean and setup test repo
      fs.rmSync(testDir, { recursive: true, force: true });
      fs.mkdirSync(testDir, { recursive: true });

      // init git repo
      execSync('git init', { cwd: testDir });
      execSync('git config user.email "test@test.com"', { cwd: testDir });
      execSync('git config user.name "Test"', { cwd: testDir });
      fs.writeFileSync(path.join(testDir, 'README.md'), '# test');
      execSync('git add . && git commit -m "init"', { cwd: testDir });

      // create behavior directory
      const behaviorDir = path.join(
        testDir,
        '.behavior/v2026_01_01.test-behavior',
      );
      const feedbackDir = path.join(behaviorDir, 'feedback');
      fs.mkdirSync(feedbackDir, { recursive: true });
      fs.writeFileSync(path.join(behaviorDir, '0.wish.md'), 'the wish');
      fs.writeFileSync(
        path.join(behaviorDir, '5.1.execution.v1.i1.md'),
        'execution',
      );

      // unresponded
      fs.writeFileSync(
        path.join(feedbackDir, '0.wish.md.[feedback].v1.[given].by_human.md'),
        'wish feedback',
      );

      // responded
      const execContent = 'exec feedback';
      fs.writeFileSync(
        path.join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
        ),
        execContent,
      );
      const execHash = computeFeedbackHash({ content: execContent });
      fs.writeFileSync(
        path.join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[taken].by_robot.md',
        ),
        `---
givenHash: ${execHash}
---

exec response`,
      );

      // stale (v2 feedback with outdated response)
      const staleOriginal = 'original v2';
      const staleUpdated = 'updated v2';
      fs.writeFileSync(
        path.join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v2.[given].by_human.md',
        ),
        staleUpdated,
      );
      const staleHash = computeFeedbackHash({ content: staleOriginal });
      fs.writeFileSync(
        path.join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v2.[taken].by_robot.md',
        ),
        `---
givenHash: ${staleHash}
---

stale response`,
      );

      return { testDir, behaviorDir, feedbackDir };
    });

    afterAll(() => {
      fs.rmSync(testDir, { recursive: true, force: true });
    });

    when('[t0] feedbackTakeGet is called', () => {
      then('returns correct counts for each status', () => {
        const result = feedbackTakeGet(
          { behavior: 'v2026_01_01.test-behavior', force: true },
          { cwd: scene.testDir },
        );

        expect(result.feedback).toHaveLength(3);
        expect(result.unresponded).toEqual(1);
        expect(result.responded).toEqual(1);
        expect(result.stale).toEqual(1);
      });
    });
  });
});
