import * as fs from 'fs/promises';
import * as path from 'path';

import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';

/**
 * .what = archives a file if its content has changed
 * .why = preserves history of prioritization outputs for comparison
 */
export const archiveBehaviorIfChanged = async (
  input: {
    filePath: string;
    newContent: string;
  },
  context: BehaviorDispatchContext,
): Promise<{
  archived: boolean;
  archivePath: string | null;
}> => {
  // check if file exists
  let contentBefore: string | null = null;
  try {
    contentBefore = await fs.readFile(input.filePath, 'utf-8');
  } catch {
    // file doesn't exist, will be created
  }

  // if content is same, no archive needed
  if (contentBefore === input.newContent) {
    return { archived: false, archivePath: null };
  }

  // if file existed, archive it
  if (contentBefore !== null) {
    const archiveDir = path.join(path.dirname(input.filePath), '.archive');
    await fs.mkdir(archiveDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = path.basename(input.filePath);
    const archivePath = path.join(archiveDir, `${timestamp}.${baseName}`);

    await fs.writeFile(archivePath, contentBefore, 'utf-8');

    context.log.debug('archived prior output', { archivePath });

    // write new content
    await fs.writeFile(input.filePath, input.newContent, 'utf-8');

    return { archived: true, archivePath };
  }

  // file didn't exist, just write new content
  await fs.mkdir(path.dirname(input.filePath), { recursive: true });
  await fs.writeFile(input.filePath, input.newContent, 'utf-8');

  return { archived: false, archivePath: null };
};
