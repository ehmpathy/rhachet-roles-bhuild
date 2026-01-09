import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { giveFeedback } from './giveFeedback';

describe('giveFeedback.integration', () => {
  given('[case1] behavior with execution artifact', () => {
    const testDir = path.join(os.tmpdir(), 'giveFeedback-int-case1');

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
        '.behavior/v2025_01_01.test-feature',
      );
      fs.mkdirSync(behaviorDir, { recursive: true });

      // create template
      fs.writeFileSync(
        path.join(behaviorDir, '.ref.[feedback].v1.[given].by_human.md'),
        [
          '# feedback for $BEHAVIOR_REF_NAME',
          '',
          'emit response to $BEHAVIOR_DIR_REL/response.md',
        ].join('\n'),
      );

      // create execution artifact
      fs.writeFileSync(
        path.join(behaviorDir, '5.1.execution.v1.i1.md'),
        '# execution v1 attempt 1\n\nsome content here',
      );

      return { testDir, behaviorDir };
    });

    afterAll(() => {
      fs.rmSync(testDir, { recursive: true, force: true });
    });

    when('[t0] giveFeedback invoked for execution artifact', () => {
      then('feedback file is created with placeholders replaced', () => {
        const result = giveFeedback(
          { against: 'execution', behavior: 'test-feature' },
          { cwd: scene.testDir },
        );

        expect(fs.existsSync(result.feedbackFile)).toBe(true);
        expect(result.feedbackFile).toContain(
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
        );

        const content = fs.readFileSync(result.feedbackFile, 'utf-8');
        expect(content).toContain('# feedback for 5.1.execution.v1.i1.md');
        expect(content).toContain(
          '.behavior/v2025_01_01.test-feature/response.md',
        );
      });

      then('artifactFile points to the execution artifact', () => {
        // create fresh feedback for this assertion
        const behaviorDir = path.join(
          scene.testDir,
          '.behavior/v2025_01_01.test-feature',
        );
        const feedbackPath = path.join(
          behaviorDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
        );
        if (fs.existsSync(feedbackPath)) fs.rmSync(feedbackPath);

        const result = giveFeedback(
          { against: 'execution', behavior: 'test-feature' },
          { cwd: scene.testDir },
        );

        expect(result.artifactFile).toContain('5.1.execution.v1.i1.md');
        expect(result.behaviorDir).toContain(
          '.behavior/v2025_01_01.test-feature',
        );
      });
    });

    when('[t1] giveFeedback invoked second time for same artifact', () => {
      then('throws error about file already present', () => {
        // ensure feedback file exists from prior test
        const behaviorDir = path.join(
          scene.testDir,
          '.behavior/v2025_01_01.test-feature',
        );
        const feedbackPath = path.join(
          behaviorDir,
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
        );
        if (!fs.existsSync(feedbackPath)) {
          giveFeedback(
            { against: 'execution', behavior: 'test-feature' },
            { cwd: scene.testDir },
          );
        }

        expect(() =>
          giveFeedback(
            { against: 'execution', behavior: 'test-feature' },
            { cwd: scene.testDir },
          ),
        ).toThrow(/already exists/);
      });
    });

    when('[t2] giveFeedback invoked with --version 2', () => {
      then('v2 feedback file is created', () => {
        const result = giveFeedback(
          { against: 'execution', behavior: 'test-feature', version: 2 },
          { cwd: scene.testDir },
        );

        expect(fs.existsSync(result.feedbackFile)).toBe(true);
        expect(result.feedbackFile).toContain(
          '5.1.execution.v1.i1.md.[feedback].v2.[given].by_human.md',
        );
      });
    });
  });

  given('[case2] behavior with multiple artifact versions', () => {
    const testDir = path.join(os.tmpdir(), 'giveFeedback-int-case2');

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
        '.behavior/v2025_01_01.multi-version',
      );
      fs.mkdirSync(behaviorDir, { recursive: true });

      // create template
      fs.writeFileSync(
        path.join(behaviorDir, '.ref.[feedback].v1.[given].by_human.md'),
        'feedback for $BEHAVIOR_REF_NAME',
      );

      // create multiple execution versions
      fs.writeFileSync(
        path.join(behaviorDir, '5.1.execution.v1.i1.md'),
        '# execution v1.i1',
      );
      fs.writeFileSync(
        path.join(behaviorDir, '5.1.execution.v1.i2.md'),
        '# execution v1.i2',
      );
      fs.writeFileSync(
        path.join(behaviorDir, '5.1.execution.v2.i1.md'),
        '# execution v2.i1',
      );

      return { testDir, behaviorDir };
    });

    afterAll(() => {
      fs.rmSync(testDir, { recursive: true, force: true });
    });

    when('[t0] giveFeedback invoked for execution', () => {
      then('targets the latest version (v2.i1)', () => {
        const result = giveFeedback(
          { against: 'execution', behavior: 'multi-version' },
          { cwd: scene.testDir },
        );

        expect(result.artifactFile).toContain('5.1.execution.v2.i1.md');
        expect(result.feedbackFile).toContain(
          '5.1.execution.v2.i1.md.[feedback].v1.[given].by_human.md',
        );

        const content = fs.readFileSync(result.feedbackFile, 'utf-8');
        expect(content).toEqual('feedback for 5.1.execution.v2.i1.md');
      });
    });
  });

  given('[case3] behavior without template', () => {
    const testDir = path.join(os.tmpdir(), 'giveFeedback-int-case3');

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

      // create behavior directory without template
      const behaviorDir = path.join(
        testDir,
        '.behavior/v2025_01_01.no-template',
      );
      fs.mkdirSync(behaviorDir, { recursive: true });

      // create artifact but no template
      fs.writeFileSync(path.join(behaviorDir, '0.wish.md'), '# wish');

      return { testDir, behaviorDir };
    });

    afterAll(() => {
      fs.rmSync(testDir, { recursive: true, force: true });
    });

    when('[t0] giveFeedback invoked', () => {
      then('throws "template not found" error', () => {
        expect(() =>
          giveFeedback(
            { against: 'wish', behavior: 'no-template' },
            { cwd: scene.testDir },
          ),
        ).toThrow(/template not found/);
      });
    });
  });

  given('[case4] behavior with custom template path', () => {
    const testDir = path.join(os.tmpdir(), 'giveFeedback-int-case4');

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
        '.behavior/v2025_01_01.custom-template',
      );
      fs.mkdirSync(behaviorDir, { recursive: true });

      // create custom template at root level
      const customTemplatePath = path.join(
        testDir,
        'custom-feedback-template.md',
      );
      fs.writeFileSync(
        customTemplatePath,
        'CUSTOM: review of $BEHAVIOR_REF_NAME in $BEHAVIOR_DIR_REL',
      );

      // create artifact
      fs.writeFileSync(
        path.join(behaviorDir, '2.criteria.blackbox.md'),
        '# blackbox criteria',
      );

      return { testDir, behaviorDir, customTemplatePath };
    });

    afterAll(() => {
      fs.rmSync(testDir, { recursive: true, force: true });
    });

    when('[t0] giveFeedback invoked with custom template', () => {
      then('uses the custom template content', () => {
        const result = giveFeedback(
          {
            against: 'criteria.blackbox',
            behavior: 'custom-template',
            template: scene.customTemplatePath,
          },
          { cwd: scene.testDir },
        );

        const content = fs.readFileSync(result.feedbackFile, 'utf-8');
        expect(content).toContain('CUSTOM: review of 2.criteria.blackbox.md');
        expect(content).toContain('.behavior/v2025_01_01.custom-template');
      });
    });
  });
});
