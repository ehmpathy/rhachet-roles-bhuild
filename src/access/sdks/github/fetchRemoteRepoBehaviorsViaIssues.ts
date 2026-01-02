import { exec } from 'child_process';
import { createHash } from 'crypto';
import * as os from 'os';
import * as path from 'path';
import { genArtifactGitFile } from 'rhachet-artifact-git';
import { promisify } from 'util';

import { BehaviorGathered } from '../../../domain.objects/BehaviorGathered';
import type { BehaviorSourceRepoRemote } from '../../../domain.objects/BehaviorSourceRepoRemote';
import { REMOTE_BEHAVIOR_ISSUE_LABELS } from '../../../domain.objects/remoteBehaviorLabels';

const execAsync = promisify(exec);

interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
}

/**
 * .what = fetches issues with "behavior.wish" label and creates synthetic behaviors
 * .why = enables treating issues as behavior wishes in the dispatch pipeline
 */
export const fetchRemoteRepoBehaviorsViaIssues = async (input: {
  source: BehaviorSourceRepoRemote;
}): Promise<BehaviorGathered[]> => {
  // fetch issues using gh cli with the behavior.wish label
  const labelQuery = REMOTE_BEHAVIOR_ISSUE_LABELS.map(
    (l) => `label:"${l}"`,
  ).join(' ');
  const { stdout } = await execAsync(
    `gh issue list --repo ${input.source.org}/${input.source.repo} --state open --search '${labelQuery}' --json number,title,body`,
  );
  const issues: GitHubIssue[] = JSON.parse(stdout);

  // convert each issue to a synthetic behavior
  const behaviors = await Promise.all(
    issues.map(async (issue) => {
      // generate behavior name from issue
      const datePrefix = new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '_');
      const slugifiedTitle = issue.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
      const behaviorName = `v${datePrefix}.issue-${issue.number}.${slugifiedTitle}`;

      // create wish content from issue
      const wishContent = [
        `# ${issue.title}`,
        '',
        issue.body ?? '',
        '',
        '---',
        `*sourced from issue #${issue.number}*`,
      ].join('\n');

      // compute content hash
      const contentHash = createHash('sha256')
        .update(wishContent)
        .digest('hex')
        .slice(0, 16);

      // write synthetic content to temp dir for consistent file-based access
      const wishUri = path.join(
        os.tmpdir(),
        'rhachet-issue-behaviors',
        input.source.org,
        input.source.repo,
        behaviorName,
        '0.wish.md',
      );
      const wishArtifact = genArtifactGitFile({ uri: wishUri });
      await wishArtifact.set({ content: wishContent });

      return new BehaviorGathered({
        gatheredAt: new Date().toISOString(),
        behavior: {
          org: input.source.org,
          repo: input.source.repo,
          name: behaviorName,
        },
        contentHash,
        status: 'wished',
        files: [{ uri: wishUri }],
        source: {
          type: 'repo.remote.via.issue',
          org: input.source.org,
          repo: input.source.repo,
          issueNumber: issue.number,
        },
      });
    }),
  );

  return behaviors;
};
