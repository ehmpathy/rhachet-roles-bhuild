import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genBehaviorFixture,
  genConsumerRepo,
  runRhachetSkill,
  type ConsumerRepo,
} from '../.test/infra';

/**
 * .what = runs give.feedback via rhachet dispatch (consumer pattern)
 * .why = tests the skill as a consumer would invoke it
 */
const runGiveFeedbackSkillViaRhachet = (input: {
  against: string;
  behavior?: string;
  version?: number;
  template?: string;
  force?: boolean;
  repoDir: string;
}) => {
  const args = [
    `--against "${input.against}"`,
    input.behavior ? `--behavior "${input.behavior}"` : '',
    input.version ? `--version ${input.version}` : '',
    input.template ? `--template "${input.template}"` : '',
    input.force ? '--force' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return runRhachetSkill({
    repo: 'bhuild',
    skill: 'give.feedback',
    args,
    repoDir: input.repoDir,
  });
};

describe('give.feedback', () => {
  // ========================================
  // consumer invocation tests (via rhachet)
  // ========================================

  given('[case1] consumer: behavior with execution artifact', () => {
    let consumer: ConsumerRepo;
    let behaviorDir: string;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'give-feedback-test-' });
      execSync('git checkout -b feedback-test-branch', {
        cwd: consumer.repoDir,
      });

      // create behavior with execution artifact and template
      const fixture = genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'feedback-test',
        withFeedbackTemplate: true,
        withExecution: true,
      });
      behaviorDir = fixture.behaviorDir;
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] give.feedback --against execution is invoked', () => {
      then('exits with code 0', () => {
        const result = runGiveFeedbackSkillViaRhachet({
          against: 'execution',
          behavior: 'feedback-test',
          repoDir: consumer.repoDir,
        });

        expect(result.exitCode).toBe(0);
      });

      then('creates feedback file with placeholders replaced', () => {
        // check feedback file was created (exclude template files)
        const feedbackFiles = fs.readdirSync(behaviorDir).filter(
          (f) => f.includes('[feedback]') && !f.startsWith('.ref.'),
        );
        expect(feedbackFiles.length).toBeGreaterThan(0);

        const feedbackPath = path.join(behaviorDir, feedbackFiles[0]!);
        const content = fs.readFileSync(feedbackPath, 'utf-8');
        expect(content).toContain('# feedback for');
        expect(content).toContain('5.1.execution.v1.i1.md');
      });

      then('outputs 🦫 wassup? format with filename', () => {
        // create new branch for fresh test
        execSync('git checkout -b feedback-output-test', {
          cwd: consumer.repoDir,
        });

        genBehaviorFixture({
          repoDir: consumer.repoDir,
          behaviorName: 'output-test',
          withFeedbackTemplate: true,
          withExecution: true,
        });

        const result = runGiveFeedbackSkillViaRhachet({
          against: 'execution',
          behavior: 'output-test',
          repoDir: consumer.repoDir,
        });

        expect(result.output).toContain('🦫 wassup?');
        expect(result.output).toContain('5.1.execution.v1.i1.md');
        expect(result.output).toContain('--version ++');
      });
    });
  });

  given('[case2] consumer: feedback file already exists (findsert)', () => {
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'give-feedback-exists-test-' });
      execSync('git checkout -b feedback-exists-branch', {
        cwd: consumer.repoDir,
      });

      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'exists-test',
        withFeedbackTemplate: true,
        withExecution: true,
      });

      // create feedback file first
      runGiveFeedbackSkillViaRhachet({
        against: 'execution',
        behavior: 'exists-test',
        repoDir: consumer.repoDir,
      });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] give.feedback invoked again for same artifact', () => {
      const result = useBeforeAll(async () =>
        runGiveFeedbackSkillViaRhachet({
          against: 'execution',
          behavior: 'exists-test',
          repoDir: consumer.repoDir,
        }),
      );

      then('exits with code 0 (findsert)', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output shows 🦫 wassup? format with filename', () => {
        expect(result.output).toContain('🦫 wassup?');
        expect(result.output).toContain('[feedback].v1');
      });

      then('output shows --version ++ tip', () => {
        expect(result.output).toContain('--version ++');
      });
    });
  });

  given('[case3] consumer: version flag creates v2 feedback', () => {
    let consumer: ConsumerRepo;
    let behaviorDir: string;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'give-feedback-version-test-' });
      execSync('git checkout -b feedback-version-branch', {
        cwd: consumer.repoDir,
      });

      const fixture = genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'version-test',
        withFeedbackTemplate: true,
        withExecution: true,
      });
      behaviorDir = fixture.behaviorDir;
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] give.feedback --version 2 is invoked', () => {
      then('creates v2 feedback file', () => {
        const result = runGiveFeedbackSkillViaRhachet({
          against: 'execution',
          behavior: 'version-test',
          version: 2,
          repoDir: consumer.repoDir,
        });

        expect(result.exitCode).toBe(0);

        const feedbackFiles = fs.readdirSync(behaviorDir).filter((f) =>
          f.includes('[feedback].v2'),
        );
        expect(feedbackFiles.length).toBe(1);
      });
    });
  });

  given('[case4] consumer: artifact not found', () => {
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'give-feedback-notfound-test-' });
      execSync('git checkout -b feedback-notfound-branch', {
        cwd: consumer.repoDir,
      });

      // create behavior without execution artifact
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'notfound-test',
        withFeedbackTemplate: true,
        withExecution: false, // no execution artifact
      });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] give.feedback for absent artifact', () => {
      const result = useBeforeAll(async () =>
        runGiveFeedbackSkillViaRhachet({
          against: 'execution',
          behavior: 'notfound-test',
          repoDir: consumer.repoDir,
        }),
      );

      then('exits with non-zero code', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions artifact not found', () => {
        expect(result.output).toContain('no artifact found');
      });
    });
  });

  given('[case5] consumer: template not found', () => {
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'give-feedback-notemplate-test-' });
      execSync('git checkout -b feedback-notemplate-branch', {
        cwd: consumer.repoDir,
      });

      // create behavior without feedback template
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'notemplate-test',
        withFeedbackTemplate: false, // no template
        withExecution: true,
      });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] give.feedback without template', () => {
      const result = useBeforeAll(async () =>
        runGiveFeedbackSkillViaRhachet({
          against: 'execution',
          behavior: 'notemplate-test',
          repoDir: consumer.repoDir,
        }),
      );

      then('exits with non-zero code', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions template not found', () => {
        expect(result.output).toContain('template not found');
      });
    });
  });
});
