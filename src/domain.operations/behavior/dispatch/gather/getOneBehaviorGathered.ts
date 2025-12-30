import type { RefByUnique } from 'domain-objects';
import * as fs from 'fs/promises';
import * as path from 'path';

import type { Behavior } from '../../../../domain.objects/Behavior';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import type { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { parseBehaviorDir } from './parseBehaviorDir';

/**
 * .what = retrieves a single gathered behavior by reference
 * .why = enables cache-critical lookup of individual behaviors
 */
export const getOneBehaviorGathered = async (
  input: {
    behavior: RefByUnique<typeof Behavior>;
    repoDir: string;
  },
  context: BehaviorDispatchContext,
): Promise<BehaviorGathered | null> => {
  // construct behavior directory path
  const behaviorDir = path.join(
    input.repoDir,
    '.behavior',
    input.behavior.name,
  );

  // check if behavior directory exists
  const dirExists = await fs
    .stat(behaviorDir)
    .then((s) => s.isDirectory())
    .catch(() => false);

  if (!dirExists) return null;

  // parse the behavior directory
  const gathered = await parseBehaviorDir({
    behaviorDir,
    org: input.behavior.org,
    repo: input.behavior.repo,
    source: { type: 'repo.local' },
  });

  return gathered;
};
