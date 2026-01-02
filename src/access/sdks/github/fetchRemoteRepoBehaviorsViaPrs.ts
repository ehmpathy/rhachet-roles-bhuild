import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

import type { BehaviorGathered } from '../../../domain.objects/BehaviorGathered';
import type { BehaviorSourceRepoRemote } from '../../../domain.objects/BehaviorSourceRepoRemote';
import { REMOTE_BEHAVIOR_PR_LABELS } from '../../../domain.objects/remoteBehaviorLabels';
import { enumBehaviorDirs } from '../../../domain.operations/behavior/dispatch/gather/enumBehaviorDirs';
import { parseBehaviorDir } from '../../../domain.operations/behavior/dispatch/gather/parseBehaviorDir';

const execAsync = promisify(exec);

interface GitHubPR {
  number: number;
  headRefName: string;
  labels: string[];
}

/**
 * .what = fetches behaviors from PRs with "behavior" label
 * .why = enables gathering in-flight behaviors from open pull requests
 */
export const fetchRemoteRepoBehaviorsViaPrs = async (input: {
  source: BehaviorSourceRepoRemote;
}): Promise<BehaviorGathered[]> => {
  // fetch PRs using gh cli
  const { stdout } = await execAsync(
    `gh api repos/${input.source.org}/${input.source.repo}/pulls --jq '[.[] | {number, headRefName: .head.ref, labels: [.labels[].name]}]'`,
  );
  const prs: GitHubPR[] = JSON.parse(stdout);

  // filter PRs that have the behavior label
  const behaviorPRs = prs.filter((pr) =>
    pr.labels.some((label) =>
      REMOTE_BEHAVIOR_PR_LABELS.includes(
        label as (typeof REMOTE_BEHAVIOR_PR_LABELS)[number],
      ),
    ),
  );

  const allBehaviors: BehaviorGathered[] = [];

  for (const pr of behaviorPRs) {
    // create temp directory for PR branch
    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), `rhachet-pr-${pr.number}-`),
    );

    try {
      // shallow clone the PR branch
      const repoUrl = `https://github.com/${input.source.org}/${input.source.repo}.git`;
      await execAsync(
        `git clone --depth 1 --branch ${pr.headRefName} ${repoUrl} ${tempDir}`,
      );

      // enumerate behavior directories
      const behaviorDirs = await enumBehaviorDirs({ repoDir: tempDir });

      // parse each behavior with PR source context
      const gathered = await Promise.all(
        behaviorDirs.map((behaviorDir) =>
          parseBehaviorDir({
            behaviorDir,
            org: input.source.org,
            repo: input.source.repo,
            source: {
              type: 'repo.remote.via.pr',
              org: input.source.org,
              repo: input.source.repo,
              prNumber: pr.number,
              prBranch: pr.headRefName,
            },
          }),
        ),
      );

      allBehaviors.push(...gathered);
    } finally {
      // cleanup temp directory
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  return allBehaviors;
};
