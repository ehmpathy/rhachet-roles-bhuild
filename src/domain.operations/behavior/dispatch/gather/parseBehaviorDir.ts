import * as fs from 'fs/promises';
import * as path from 'path';

import type { RefByUnique } from 'domain-objects';
import type { GitFile } from 'rhachet-artifact-git';

import {
  BehaviorGathered,
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

  // enumerate file refs in the behavior directory (no content loaded)
  const files = await enumBehaviorFileRefs({ behaviorDir: input.behaviorDir });

  // extract status from file names
  const status = inferBehaviorStatus({ files });

  return new BehaviorGathered({
    gatheredAt: new Date().toISOString(),
    behavior: { org: input.org, repo: input.repo, name: behaviorName },
    contentHash,
    status,
    files,
    source: input.source,
  });
};

/**
 * .what = enumerates file refs in a behavior directory
 * .why = creates lightweight refs without loading content into memory
 *
 * @note excludes files with [feedback] in the path (feedback artifacts are separate)
 */
const enumBehaviorFileRefs = async (input: {
  behaviorDir: string;
}): Promise<RefByUnique<typeof GitFile>[]> => {
  const files: RefByUnique<typeof GitFile>[] = [];
  const entries = await fs.readdir(input.behaviorDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    // exclude feedback files
    if (entry.name.includes('[feedback]')) continue;

    files.push({ uri: path.join(input.behaviorDir, entry.name) });
  }

  return files;
};

/**
 * .what = infers behavior status from file structure
 * .why = determines lifecycle stage based on which standard files exist
 *
 * @note supports decomposed files like 0.wish.*.md, 1.vision.*.md, 2.criteria.*.md
 */
const inferBehaviorStatus = (input: {
  files: RefByUnique<typeof GitFile>[];
}): BehaviorGatheredStatus => {
  // extract basenames from uris for pattern matching
  const fileNames = input.files.map((f) => path.basename(f.uri));

  // check for status markers in file names (supports decomposed patterns)
  // order matters: later stages take precedence
  if (fileNames.some((f) => f.includes('delivered'))) return 'delivered';
  if (fileNames.some((f) => f.includes('execution'))) return 'inflight';
  if (fileNames.some((f) => f.includes('.blueprint.'))) return 'blueprinted';
  if (fileNames.some((f) => /^2\.criteria(\.|$)/.test(f))) return 'constrained';
  if (fileNames.some((f) => /^1\.vision(\.|$)/.test(f))) return 'envisioned';
  if (fileNames.some((f) => /^0\.wish(\.|$)/.test(f))) return 'wished';

  return 'wished';
};
