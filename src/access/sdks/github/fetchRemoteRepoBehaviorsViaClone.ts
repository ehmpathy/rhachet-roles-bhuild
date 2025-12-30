import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

import type { BehaviorGathered } from '../../../domain.objects/BehaviorGathered';
import type { BehaviorSourceRepoRemote } from '../../../domain.objects/BehaviorSourceRepoRemote';
import { enumBehaviorDirs } from '../../../domain.operations/behavior/dispatch/gather/enumBehaviorDirs';
import { parseBehaviorDir } from '../../../domain.operations/behavior/dispatch/gather/parseBehaviorDir';

const execAsync = promisify(exec);

/**
 * .what = fetches behaviors from a remote repository's main branch
 * .why = enables gathering behaviors from external git repositories
 */
export const fetchRemoteRepoBehaviorsViaClone = async (input: {
  source: BehaviorSourceRepoRemote;
}): Promise<BehaviorGathered[]> => {
  // create temp directory for clone
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'rhachet-remote-repo-'),
  );

  try {
    // shallow clone the specified branch
    const repoUrl = `https://github.com/${input.source.org}/${input.source.repo}.git`;
    await execAsync(
      `git clone --depth 1 --branch ${input.source.branch} ${repoUrl} ${tempDir}`,
    );

    // enumerate behavior directories
    const behaviorDirs = await enumBehaviorDirs({ repoDir: tempDir });

    // parse each behavior
    const gathered = await Promise.all(
      behaviorDirs.map((behaviorDir) =>
        parseBehaviorDir({
          behaviorDir,
          org: input.source.org,
          repo: input.source.repo,
          source: {
            type: 'repo.remote.via.clone',
            org: input.source.org,
            repo: input.source.repo,
            branch: input.source.branch,
          },
        }),
      ),
    );

    return gathered;
  } finally {
    // cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};
