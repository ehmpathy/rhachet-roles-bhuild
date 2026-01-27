import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { initFeedbackTemplate } from './initFeedbackTemplate';

describe('initFeedbackTemplate', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'feedback-template-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test('replaces $BEHAVIOR_REF_NAME with artifactFileName', () => {
    const templatePath = join(testDir, 'template.md');
    const targetPath = join(testDir, 'output.md');

    writeFileSync(
      templatePath,
      'feedback for $BEHAVIOR_REF_NAME artifact',
      'utf-8',
    );

    initFeedbackTemplate({
      templatePath,
      targetPath,
      artifactFileName: '5.1.execution.v1.i1.md',
      behaviorDirRel: '.behavior/v2025_01_01.feature',
    });

    const content = readFileSync(targetPath, 'utf-8');
    expect(content).toEqual('feedback for 5.1.execution.v1.i1.md artifact');
  });

  test('replaces $BEHAVIOR_DIR_REL with behaviorDirRel', () => {
    const templatePath = join(testDir, 'template.md');
    const targetPath = join(testDir, 'output.md');

    writeFileSync(
      templatePath,
      'emit to $BEHAVIOR_DIR_REL/response.md',
      'utf-8',
    );

    initFeedbackTemplate({
      templatePath,
      targetPath,
      artifactFileName: '0.wish.md',
      behaviorDirRel: '.behavior/v2025_06_15.new-feature',
    });

    const content = readFileSync(targetPath, 'utf-8');
    expect(content).toEqual(
      'emit to .behavior/v2025_06_15.new-feature/response.md',
    );
  });

  test('replaces both placeholders in same template', () => {
    const templatePath = join(testDir, 'template.md');
    const targetPath = join(testDir, 'output.md');

    writeFileSync(
      templatePath,
      [
        'emit response to',
        '- $BEHAVIOR_DIR_REL/$BEHAVIOR_REF_NAME.[feedback].v1.[taken].md',
        '',
        'target: $BEHAVIOR_REF_NAME',
      ].join('\n'),
      'utf-8',
    );

    initFeedbackTemplate({
      templatePath,
      targetPath,
      artifactFileName: '2.1.criteria.blackbox.md',
      behaviorDirRel: '.behavior/v2026_01_08.give-feedback',
    });

    const content = readFileSync(targetPath, 'utf-8');
    expect(content).toEqual(
      [
        'emit response to',
        '- .behavior/v2026_01_08.give-feedback/2.1.criteria.blackbox.md.[feedback].v1.[taken].md',
        '',
        'target: 2.1.criteria.blackbox.md',
      ].join('\n'),
    );
  });
});
