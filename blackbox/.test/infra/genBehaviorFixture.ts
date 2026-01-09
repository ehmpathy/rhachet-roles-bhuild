import fs from 'fs';
import path from 'path';

/**
 * .what = creates a behavior directory in the consumer repo
 * .why  = tests need behavior artifacts to operate on
 */
export const genBehaviorFixture = (input: {
  repoDir: string;
  behaviorName: string;
  withCriteria?: boolean;
  withDecomposed?: boolean;
  withFeedbackTemplate?: boolean;
  withExecution?: boolean;
  datePrefix?: string;
}): { behaviorDir: string } => {
  const datePrefix = input.datePrefix ?? 'v2025_01_01';
  const behaviorDir = path.join(
    input.repoDir,
    '.behavior',
    `${datePrefix}.${input.behaviorName}`,
  );
  fs.mkdirSync(behaviorDir, { recursive: true });

  // always create wish file
  fs.writeFileSync(
    path.join(behaviorDir, '0.wish.md'),
    `wish = enable ${input.behaviorName} functionality`,
  );

  // optionally create vision file
  fs.writeFileSync(path.join(behaviorDir, '1.vision.md'), '');

  // optionally create criteria
  if (input.withCriteria) {
    fs.writeFileSync(
      path.join(behaviorDir, '2.criteria.md'),
      `# criteria for ${input.behaviorName}\n\n- must support basic operations\n- must handle edge cases`,
    );
  }

  // optionally mark as decomposed
  if (input.withDecomposed) {
    fs.writeFileSync(
      path.join(behaviorDir, 'z.decomposed.md'),
      `# decomposed\n\nthis behavior was decomposed into:\n\n- sub-behavior-1\n- sub-behavior-2\n`,
    );
  }

  // optionally create feedback template
  if (input.withFeedbackTemplate) {
    fs.writeFileSync(
      path.join(behaviorDir, '.ref.[feedback].v1.[given].by_human.md'),
      [
        '# feedback for $BEHAVIOR_REF_NAME',
        '',
        'emit response to $BEHAVIOR_DIR_REL/response.md',
      ].join('\n'),
    );
  }

  // optionally create execution artifact
  if (input.withExecution) {
    fs.writeFileSync(
      path.join(behaviorDir, '5.1.execution.v1.i1.md'),
      `# execution v1 attempt 1\n\nsome content for ${input.behaviorName}`,
    );
  }

  return { behaviorDir };
};
