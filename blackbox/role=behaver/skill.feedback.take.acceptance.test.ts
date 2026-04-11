import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { computeFeedbackHash } from '../../src/domain.operations/behavior/feedback/computeFeedbackHash';
import {
  genBehaviorFixture,
  genConsumerRepo,
  runRhachetSkill,
} from '../.test/infra';

/**
 * .what = mask dynamic values in output for snapshot consistency
 * .why = paths, dates, and hashes vary per run, mask them for stable snapshots
 */
const asSnapshotStable = (output: string): string =>
  output
    // mask worktree suffix in repo path: rhachet-roles-bhuild.branch-name -> rhachet-roles-bhuild
    .replace(/rhachet-roles-bhuild\.[a-z0-9._-]+/gi, 'rhachet-roles-bhuild')
    // mask behavior names with dates: v2026_04_09.my-feature -> v{DATE}.{NAME}
    .replace(/v\d{4}_\d{2}_\d{2}\.[a-z0-9-]+/gi, 'v{DATE}.{NAME}')
    // mask behavior dir names only: v2026_04_09 -> v{DATE}
    .replace(/v\d{4}_\d{2}_\d{2}/g, 'v{DATE}')
    // mask sha256 hashes: 64-char hex -> {HASH}
    .replace(/[a-f0-9]{64}/gi, '{HASH}')
    // mask temp directory paths: /tmp/xxx-xxx -> /tmp/{TEMP}
    .replace(/\/tmp\/[a-z0-9-]+/gi, '/tmp/{TEMP}')
    // mask .temp dir with iso timestamp: .temp/2026-04-10T15-23-19.328Z.name.uuid -> .temp/{TIMESTAMP}
    .replace(/\.temp\/\d{4}-\d{2}-\d{2}T[\d-]+\.\d+Z\.[a-z0-9-]+\.[a-f0-9]+/gi, '.temp/{TIMESTAMP}')
    // mask time values: "passed 3.6s" -> "passed [time]"
    .replace(/\d+\.\d+s/g, '[time]');

/**
 * .what = runs feedback.take.get via rhachet dispatch (consumer pattern)
 * .why = tests the skill as a consumer would invoke it
 */
const runFeedbackTakeGetSkill = (input: {
  behavior?: string;
  when?: 'hook.onStop';
  force?: boolean;
  repoDir: string;
}) => {
  const args = [
    input.behavior ? `--behavior "${input.behavior}"` : '',
    input.when ? `--when ${input.when}` : '',
    input.force ? '--force' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return runRhachetSkill({
    repo: 'bhuild',
    skill: 'feedback.take.get',
    args,
    repoDir: input.repoDir,
  });
};

/**
 * .what = runs feedback.take.set via rhachet dispatch (consumer pattern)
 * .why = tests the skill as a consumer would invoke it
 */
const runFeedbackTakeSetSkill = (input: {
  from: string;
  into: string;
  response: string;
  repoDir: string;
}) => {
  const args = `--from "${input.from}" --into "${input.into}" --response "${input.response}"`;

  return runRhachetSkill({
    repo: 'bhuild',
    skill: 'feedback.take.set',
    args,
    repoDir: input.repoDir,
  });
};

describe('feedback.take', () => {
  // ========================================
  // feedback.take.get tests
  // ========================================

  given('[case1] behavior with no feedback files', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'feedback-take-get-empty-' });
      execSync('git checkout -b feedback-get-empty-branch', {
        cwd: consumer.repoDir,
      });

      const fixture = genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'get-empty-test',
        withFeedbackTemplate: false,
        withExecution: false,
      });

      return { repoDir: consumer.repoDir, behaviorDir: fixture.behaviorDir };
    });

    when('[t0] feedback.take.get is called', () => {
      const result = useThen('it succeeds', () =>
        runFeedbackTakeGetSkill({
          behavior: 'get-empty-test',
          force: true,
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output shows empty status', () => {
        expect(result.output).toContain('🦫 roight,');
        expect(result.output).toContain('no feedback files found');
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });

    when('[t1] feedback.take.get --when hook.onStop is called', () => {
      const result = useThen('it succeeds', () =>
        runFeedbackTakeGetSkill({
          behavior: 'get-empty-test',
          when: 'hook.onStop',
          force: true,
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 0 (no unresponded)', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output is silent per vision (no mascot output)', () => {
        // vision: "hook.onStop (passed) = silent — no output"
        // note: rhachet wrapper prints "🪨 run solid skill..." but skill is silent
        expect(result.output).not.toContain('🦫');
        expect(result.output).not.toContain('🌲');
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });
  });

  given('[case2] behavior with unresponded feedback', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({
        prefix: 'feedback-take-get-unresponded-',
      });
      execSync('git checkout -b feedback-get-unresponded-branch', {
        cwd: consumer.repoDir,
      });

      const fixture = genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'get-unresponded-test',
        withFeedbackTemplate: true,
        withExecution: true,
      });

      // create unresponded feedback
      const feedbackDir = path.join(fixture.behaviorDir, 'feedback');
      fs.mkdirSync(feedbackDir, { recursive: true });
      fs.writeFileSync(
        path.join(
          feedbackDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
        ),
        'please fix the execution artifact',
      );

      return { repoDir: consumer.repoDir, behaviorDir: fixture.behaviorDir };
    });

    when('[t0] feedback.take.get is called', () => {
      const result = useThen('it succeeds', () =>
        runFeedbackTakeGetSkill({
          behavior: 'get-unresponded-test',
          force: true,
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output lists unresponded feedback', () => {
        expect(result.output).toContain('unresponded');
        expect(result.output).toContain('5.1.execution.v1.i1.md');
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });

    when('[t1] feedback.take.get --when hook.onStop is called', () => {
      const result = useThen('it blocks', () =>
        runFeedbackTakeGetSkill({
          behavior: 'get-unresponded-test',
          when: 'hook.onStop',
          force: true,
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 2', () => {
        expect(result.exitCode).toBe(2);
      });

      then('output shows hold up message', () => {
        expect(result.output).toContain('hold up...');
      });

      then('output instructs to respond', () => {
        expect(result.output).toContain(
          'respond to all feedback before you finish',
        );
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });
  });

  given('[case3] respond to feedback via feedback.take.set', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'feedback-take-set-' });
      execSync('git checkout -b feedback-set-branch', {
        cwd: consumer.repoDir,
      });

      const fixture = genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'take-set-test',
        withFeedbackTemplate: true,
        withExecution: true,
      });

      // create unresponded feedback
      const feedbackDir = path.join(fixture.behaviorDir, 'feedback');
      fs.mkdirSync(feedbackDir, { recursive: true });
      const givenPath = path.join(
        feedbackDir,
        '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
      );
      const takenPath = path.join(
        feedbackDir,
        '5.1.execution.v1.i1.md.[feedback].v1.[taken].by_robot.md',
      );
      fs.writeFileSync(givenPath, 'please fix the execution artifact');

      return {
        repoDir: consumer.repoDir,
        behaviorDir: fixture.behaviorDir,
        feedbackDir,
        givenPath,
        takenPath,
      };
    });

    when('[t0] feedback.take.set is called', () => {
      const result = useThen('it succeeds', () =>
        runFeedbackTakeSetSkill({
          from: scene.givenPath,
          into: scene.takenPath,
          response: 'acknowledged. will fix.',
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('creates [taken] file with correct hash', () => {
        expect(fs.existsSync(scene.takenPath)).toBe(true);
        const takenContent = fs.readFileSync(scene.takenPath, 'utf-8');
        const givenContent = fs.readFileSync(scene.givenPath, 'utf-8');
        const expectedHash = computeFeedbackHash({ content: givenContent });
        expect(takenContent).toContain(`givenHash: ${expectedHash}`);
        expect(takenContent).toContain('acknowledged. will fix.');
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });

    when('[t1] feedback.take.get is called after response', () => {
      const result = useThen('it succeeds', () =>
        runFeedbackTakeGetSkill({
          behavior: 'take-set-test',
          force: true,
          repoDir: scene.repoDir,
        }),
      );

      then('shows feedback as responded', () => {
        expect(result.output).toContain('responded');
        expect(result.output).not.toContain('unresponded');
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });

    when('[t2] feedback.take.get --when hook.onStop is called after response', () => {
      const result = useThen('it succeeds', () =>
        runFeedbackTakeGetSkill({
          behavior: 'take-set-test',
          when: 'hook.onStop',
          force: true,
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output is silent per vision (no mascot output)', () => {
        // vision: "hook.onStop (passed) = silent — no output"
        // note: rhachet wrapper prints "🪨 run solid skill..." but skill is silent
        expect(result.output).not.toContain('🦫');
        expect(result.output).not.toContain('🌲');
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });
  });

  given('[case4] behavior with stale feedback (hash mismatch)', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'feedback-take-stale-' });
      execSync('git checkout -b feedback-stale-branch', {
        cwd: consumer.repoDir,
      });

      const fixture = genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'stale-test',
        withFeedbackTemplate: true,
        withExecution: true,
      });

      // create stale feedback (hash mismatch)
      const feedbackDir = path.join(fixture.behaviorDir, 'feedback');
      fs.mkdirSync(feedbackDir, { recursive: true });

      const originalContent = 'original feedback';
      const updatedContent = 'updated feedback';

      const givenPath = path.join(
        feedbackDir,
        '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
      );
      const takenPath = path.join(
        feedbackDir,
        '5.1.execution.v1.i1.md.[feedback].v1.[taken].by_robot.md',
      );

      // [taken] has hash of original content
      const originalHash = computeFeedbackHash({ content: originalContent });
      fs.writeFileSync(
        takenPath,
        `---
givenHash: ${originalHash}
---

response content`,
      );

      // [given] has updated content (mismatch)
      fs.writeFileSync(givenPath, updatedContent);

      return { repoDir: consumer.repoDir, behaviorDir: fixture.behaviorDir };
    });

    when('[t0] feedback.take.get is called', () => {
      const result = useThen('it succeeds', () =>
        runFeedbackTakeGetSkill({
          behavior: 'stale-test',
          force: true,
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output lists stale feedback', () => {
        expect(result.output).toContain('stale');
        expect(result.output).toContain('5.1.execution.v1.i1.md');
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });

    when('[t1] feedback.take.get --when hook.onStop is called', () => {
      const result = useThen('it blocks', () =>
        runFeedbackTakeGetSkill({
          behavior: 'stale-test',
          when: 'hook.onStop',
          force: true,
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 2', () => {
        expect(result.exitCode).toBe(2);
      });

      then('output shows hold up message', () => {
        expect(result.output).toContain('hold up...');
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });
  });

  given('[case5] behavior with mixed feedback statuses', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'feedback-take-mixed-' });
      execSync('git checkout -b feedback-mixed-branch', {
        cwd: consumer.repoDir,
      });

      const fixture = genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'mixed-test',
        withFeedbackTemplate: true,
        withExecution: true,
      });

      const feedbackDir = path.join(fixture.behaviorDir, 'feedback');
      fs.mkdirSync(feedbackDir, { recursive: true });

      // unresponded feedback
      fs.writeFileSync(
        path.join(
          feedbackDir,
          '0.wish.md.[feedback].v1.[given].by_human.md',
        ),
        'wish feedback',
      );

      // responded feedback
      const visionContent = 'vision feedback';
      fs.writeFileSync(
        path.join(
          feedbackDir,
          '1.vision.yield.md.[feedback].v1.[given].by_human.md',
        ),
        visionContent,
      );
      const visionHash = computeFeedbackHash({ content: visionContent });
      fs.writeFileSync(
        path.join(
          feedbackDir,
          '1.vision.yield.md.[feedback].v1.[taken].by_robot.md',
        ),
        `---
givenHash: ${visionHash}
---

vision response`,
      );

      return { repoDir: consumer.repoDir, behaviorDir: fixture.behaviorDir };
    });

    when('[t0] feedback.take.get is called', () => {
      const result = useThen('it succeeds', () =>
        runFeedbackTakeGetSkill({
          behavior: 'mixed-test',
          force: true,
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output shows correct counts', () => {
        expect(result.output).toContain('1 open');
        expect(result.output).toContain('2 total');
      });

      then('output lists unresponded first', () => {
        expect(result.output).toContain('unresponded');
        expect(result.output).toContain('0.wish.md');
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });

    when('[t1] feedback.take.get --when hook.onStop is called', () => {
      const result = useThen('it blocks', () =>
        runFeedbackTakeGetSkill({
          behavior: 'mixed-test',
          when: 'hook.onStop',
          force: true,
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 2', () => {
        expect(result.exitCode).toBe(2);
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });
  });
});
