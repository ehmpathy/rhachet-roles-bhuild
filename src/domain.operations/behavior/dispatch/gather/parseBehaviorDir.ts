import * as fs from 'fs/promises';
import * as path from 'path';

import {
  BehaviorGathered,
  type BehaviorGatheredFile,
  type BehaviorGatheredSource,
  type BehaviorGatheredStatus,
} from '../../../../domain.objects/BehaviorGathered';
import { computeBehaviorGatheredContentHash } from './computeBehaviorGatheredContentHash';

/**
 * .what = parses a behavior directory into a BehaviorGathered object
 * .why = transforms raw directory structure into domain object with contentHash
 */
export const parseBehaviorDir = async (input: {
  behaviorDir: string;
  org: string;
  repo: string;
  source: BehaviorGatheredSource;
}): Promise<BehaviorGathered> => {
  const behaviorName = path.basename(input.behaviorDir);

  // compute content hash for cache invalidation
  const contentHash = await computeBehaviorGatheredContentHash({
    behaviorDir: input.behaviorDir,
  });

  // read all files in the behavior directory
  const files = await readBehaviorFiles({ behaviorDir: input.behaviorDir });

  // extract status from files
  const status = inferBehaviorStatus({ files });

  // extract content from standard files
  const wishFile = files.find((f) => f.path.endsWith('0.wish.md'));
  const visionFile = files.find((f) => f.path.endsWith('1.vision.md'));
  const criteriaFile = files.find((f) => f.path.endsWith('2.criteria.md'));

  return new BehaviorGathered({
    gatheredAt: new Date().toISOString(),
    behavior: { org: input.org, repo: input.repo, name: behaviorName },
    contentHash,
    status,
    files,
    wish: wishFile?.content ?? null,
    vision: visionFile?.content ?? null,
    criteria: criteriaFile?.content ?? null,
    source: input.source,
  });
};

/**
 * .what = reads all files in a behavior directory
 * .why = captures full behavior content for downstream processing
 */
const readBehaviorFiles = async (input: {
  behaviorDir: string;
}): Promise<BehaviorGatheredFile[]> => {
  const files: BehaviorGatheredFile[] = [];
  const entries = await fs.readdir(input.behaviorDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(input.behaviorDir, entry.name);
    const content = await fs.readFile(filePath, 'utf-8');
    files.push({
      path: entry.name,
      content,
    });
  }

  return files;
};

/**
 * .what = infers behavior status from file structure
 * .why = determines lifecycle stage based on which standard files exist
 */
const inferBehaviorStatus = (input: {
  files: BehaviorGatheredFile[];
}): BehaviorGatheredStatus => {
  const fileNames = input.files.map((f) => f.path);

  // check for status markers in file names or content
  if (fileNames.some((f) => f.includes('delivered'))) return 'delivered';
  if (fileNames.some((f) => f.includes('review'))) return 'review';
  if (fileNames.some((f) => f.startsWith('2.criteria'))) return 'criteria';
  if (fileNames.some((f) => f.startsWith('1.vision'))) return 'vision';
  if (fileNames.some((f) => f.startsWith('0.wish'))) return 'wish';

  return 'active';
};
