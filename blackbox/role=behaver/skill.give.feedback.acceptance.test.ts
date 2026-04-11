import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

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
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'give-feedback-test-' });
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
      return { repoDir: consumer.repoDir, behaviorDir: fixture.behaviorDir };
    });

    when('[t0] give.feedback --against execution is invoked', () => {
      then('exits with code 0', () => {
        const result = runGiveFeedbackSkillViaRhachet({
          against: 'execution',
          behavior: 'feedback-test',
          repoDir: scene.repoDir,
        });

        expect(result.exitCode).toBe(0);
      });

      then('creates feedback file with placeholders replaced', () => {
        // check feedback file was created in feedback/ subdirectory
        const feedbackDir = path.join(scene.behaviorDir, 'feedback');
        const feedbackFiles = fs.readdirSync(feedbackDir).filter(
          (f) => f.includes('[feedback]') && f.includes('[given]'),
        );
        expect(feedbackFiles.length).toBeGreaterThan(0);

        const feedbackPath = path.join(feedbackDir, feedbackFiles[0]!);
        const content = fs.readFileSync(feedbackPath, 'utf-8');
        expect(content).toContain('# feedback for');
        expect(content).toContain('5.1.execution.v1.i1.md');
      });

      then('outputs 🦫 wassup? format with filename', () => {
        // create new branch for fresh test
        execSync('git checkout -b feedback-output-test', {
          cwd: scene.repoDir,
        });

        genBehaviorFixture({
          repoDir: scene.repoDir,
          behaviorName: 'output-test',
          withFeedbackTemplate: true,
          withExecution: true,
        });

        const result = runGiveFeedbackSkillViaRhachet({
          against: 'execution',
          behavior: 'output-test',
          repoDir: scene.repoDir,
        });

        expect(result.output).toContain('🦫 wassup?');
        expect(result.output).toContain('5.1.execution.v1.i1.md');
        expect(result.output).toContain('--version ++');

        // snapshot for vibecheck
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });
  });

  given('[case2] consumer: feedback file already exists (findsert)', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'give-feedback-exists-test-' });
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
      return consumer;
    });

    when('[t0] give.feedback invoked again for same artifact', () => {
      const result = useBeforeAll(async () =>
        runGiveFeedbackSkillViaRhachet({
          against: 'execution',
          behavior: 'exists-test',
          repoDir: scene.repoDir,
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

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });
  });

  given('[case3] consumer: version flag creates v2 feedback', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'give-feedback-version-test-' });
      execSync('git checkout -b feedback-version-branch', {
        cwd: consumer.repoDir,
      });

      const fixture = genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'version-test',
        withFeedbackTemplate: true,
        withExecution: true,
      });
      return { repoDir: consumer.repoDir, behaviorDir: fixture.behaviorDir };
    });

    when('[t0] give.feedback --version 2 is invoked', () => {
      const result = useThen('it succeeds', () =>
        runGiveFeedbackSkillViaRhachet({
          against: 'execution',
          behavior: 'version-test',
          version: 2,
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('creates v2 feedback file', () => {
        const feedbackDir = path.join(scene.behaviorDir, 'feedback');
        const feedbackFiles = fs.readdirSync(feedbackDir).filter((f) =>
          f.includes('[feedback].v2'),
        );
        expect(feedbackFiles.length).toBe(1);
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });
  });

  given('[case4] consumer: artifact not found', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'give-feedback-notfound-test-' });
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
      return consumer;
    });

    when('[t0] give.feedback for absent artifact', () => {
      const result = useBeforeAll(async () =>
        runGiveFeedbackSkillViaRhachet({
          against: 'execution',
          behavior: 'notfound-test',
          repoDir: scene.repoDir,
        }),
      );

      then('exits with non-zero code', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions artifact not found', () => {
        expect(result.output).toContain('no artifact found');
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });
  });

  given('[case5] consumer: template not found', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'give-feedback-notemplate-test-' });
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
      return consumer;
    });

    when('[t0] give.feedback without template', () => {
      const result = useBeforeAll(async () =>
        runGiveFeedbackSkillViaRhachet({
          against: 'execution',
          behavior: 'notemplate-test',
          repoDir: scene.repoDir,
        }),
      );

      then('exits with non-zero code', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions template not found', () => {
        expect(result.output).toContain('template not found');
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });
  });

  given('[case6] consumer: --force overrides behavior bind', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'give-feedback-force-test-' });
      execSync('git checkout -b feedback-force-branch', {
        cwd: consumer.repoDir,
      });

      // create two behaviors
      const bound = genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'bound-behavior',
        withFeedbackTemplate: true,
        withExecution: true,
      });

      const other = genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'other-behavior',
        withFeedbackTemplate: true,
        withExecution: true,
      });

      // bind branch to first behavior via bind flag file
      // bind flags go in .bind/ dir with flattened branch name
      fs.mkdirSync(path.join(bound.behaviorDir, '.bind'), { recursive: true });
      const branchName = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: consumer.repoDir,
      })
        .toString()
        .trim();
      // flatten: replace / with . and keep only alphanumeric, dots, dashes, underscores
      const flatBranch = branchName
        .replace(/\//g, '.')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_$/, '');
      fs.writeFileSync(
        path.join(bound.behaviorDir, '.bind', `${flatBranch}.flag`),
        '',
      );

      return {
        repoDir: consumer.repoDir,
        boundDir: bound.behaviorDir,
        otherDir: other.behaviorDir,
      };
    });

    when('[t0] give.feedback --behavior other without --force', () => {
      const result = useThen('it fails', () =>
        runGiveFeedbackSkillViaRhachet({
          against: 'execution',
          behavior: 'other-behavior',
          repoDir: scene.repoDir,
        }),
      );

      then('exits with non-zero code', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions force override', () => {
        expect(result.output).toContain('--force');
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });

    when('[t1] give.feedback --behavior other --force', () => {
      const result = useThen('it succeeds', () =>
        runGiveFeedbackSkillViaRhachet({
          against: 'execution',
          behavior: 'other-behavior',
          force: true,
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('creates feedback in other behavior', () => {
        const feedbackDir = path.join(scene.otherDir, 'feedback');
        const feedbackFiles = fs.readdirSync(feedbackDir).filter(
          (f) => f.includes('[feedback]') && f.includes('[given]'),
        );
        expect(feedbackFiles.length).toBe(1);
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });
  });

  given('[case7] consumer: custom template via --template flag', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({
        prefix: 'give-feedback-custom-template-test-',
      });
      execSync('git checkout -b feedback-custom-template-branch', {
        cwd: consumer.repoDir,
      });

      const fixture = genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'custom-template-test',
        withFeedbackTemplate: true,
        withExecution: true,
      });

      // create a custom template in refs/
      const refsDir = path.join(fixture.behaviorDir, 'refs');
      fs.mkdirSync(refsDir, { recursive: true });
      const customTemplatePath = path.join(
        refsDir,
        'template.[feedback].custom.[given].by_human.md',
      );
      fs.writeFileSync(
        customTemplatePath,
        '# custom feedback\n\n$artifact\n\n## custom section\n',
      );

      return {
        repoDir: consumer.repoDir,
        behaviorDir: fixture.behaviorDir,
        customTemplatePath,
      };
    });

    when('[t0] give.feedback --template with full path is invoked', () => {
      const result = useThen('it succeeds', () =>
        runGiveFeedbackSkillViaRhachet({
          against: 'execution',
          behavior: 'custom-template-test',
          template: scene.customTemplatePath,
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('uses custom template content', () => {
        const feedbackDir = path.join(scene.behaviorDir, 'feedback');
        const feedbackFiles = fs.readdirSync(feedbackDir).filter(
          (f) => f.includes('[feedback]') && f.includes('[given]'),
        );
        const feedbackPath = path.join(feedbackDir, feedbackFiles[0]!);
        const content = fs.readFileSync(feedbackPath, 'utf-8');
        expect(content).toContain('# custom feedback');
        expect(content).toContain('## custom section');
      });

      then('output matches snapshot', () => {
        expect(asSnapshotStable(result.output)).toMatchSnapshot();
      });
    });
  });
});
