import { createHash } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = computes sha256 hash of all files in a behavior directory
 * .why = enables cache invalidation; downstream skills reuse this hash without recomputation
 */
export const computeBehaviorGatheredContentHash = async (input: {
  behaviorDir: string;
}): Promise<string> => {
  // enumerate all files in the behavior directory recursively
  const files = await enumerateFilesRecursively({ dir: input.behaviorDir });

  // sort files alphabetically for deterministic hash
  const sortedFiles = files.sort();

  // compute hash from sorted filenames + contents
  const hash = createHash('sha256');
  for (const file of sortedFiles) {
    const relativePath = path.relative(input.behaviorDir, file);
    const content = await fs.readFile(file, 'utf-8');
    hash.update(relativePath);
    hash.update(content);
  }

  return hash.digest('hex');
};

/**
 * .what = recursively enumerates all files in a directory
 * .why = needed for content hash computation across all behavior files
 */
const enumerateFilesRecursively = async (input: {
  dir: string;
}): Promise<string[]> => {
  const entries = await fs.readdir(input.dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(input.dir, entry.name);
    if (entry.isDirectory()) {
      const nestedFiles = await enumerateFilesRecursively({ dir: fullPath });
      files.push(...nestedFiles);
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
};
