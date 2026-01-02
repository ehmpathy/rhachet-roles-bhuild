import * as path from 'path';
import { genArtifactGitFile } from 'rhachet-artifact-git';

import { fetchRemoteRepoBehaviorsViaClone } from '../../../../access/sdks/github/fetchRemoteRepoBehaviorsViaClone';
import { fetchRemoteRepoBehaviorsViaIssues } from '../../../../access/sdks/github/fetchRemoteRepoBehaviorsViaIssues';
import { fetchRemoteRepoBehaviorsViaPrs } from '../../../../access/sdks/github/fetchRemoteRepoBehaviorsViaPrs';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import type { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { enumBehaviorDirs } from './enumBehaviorDirs';
import { parseBehaviorDir } from './parseBehaviorDir';

/**
 * .what = gathers all behaviors from configured sources
 * .why = central entry point for gather skill, scanning local and remote repos
 *
 * .note = this operation is NOT cached - it must always run fresh to detect changes
 */
export const getAllBehaviorGathered = async (
  input: {
    repoDir: string;
  },
  context: BehaviorDispatchContext,
): Promise<BehaviorGathered[]> => {
  const gathered: BehaviorGathered[] = [];

  // gather from local sources if enabled
  if (context.config.sources.local.enabled) {
    const localGathered = await gatherFromLocalRepo({
      repoDir: input.repoDir,
    });
    gathered.push(...localGathered);
  }

  // gather from remote sources (uses gh cli for auth)
  for (const remoteSource of context.config.sources.remote) {
    context.log.info('gathering from remote source', {
      org: remoteSource.org,
      repo: remoteSource.repo,
    });

    // gather behaviors from main branch via clone
    const repoBehaviors = await fetchRemoteRepoBehaviorsViaClone({
      source: remoteSource,
    });
    gathered.push(...repoBehaviors);

    // gather behaviors from PRs with "behavior" label
    const prBehaviors = await fetchRemoteRepoBehaviorsViaPrs({
      source: remoteSource,
    });
    gathered.push(...prBehaviors);

    // gather synthetic behaviors from issues with "behavior.wish" label
    const issueBehaviors = await fetchRemoteRepoBehaviorsViaIssues({
      source: remoteSource,
    });
    gathered.push(...issueBehaviors);
  }

  // write gathered behaviors to output directory
  await writeGatheredOutput({ gathered }, context);

  return gathered;
};

/**
 * .what = gathers all behaviors from a local repository
 * .why = scans .behavior/{name}/ directories in the local repo
 */
const gatherFromLocalRepo = async (input: {
  repoDir: string;
}): Promise<BehaviorGathered[]> => {
  // extract org and repo from repo path
  const { org, repo } = inferOrgRepoFromPath({ repoDir: input.repoDir });

  // enumerate behavior directories
  const behaviorDirs = await enumBehaviorDirs({ repoDir: input.repoDir });

  // parse each behavior directory
  const gathered = await Promise.all(
    behaviorDirs.map((behaviorDir) =>
      parseBehaviorDir({
        behaviorDir,
        org,
        repo,
        source: { type: 'repo.local' },
      }),
    ),
  );

  return gathered;
};

/**
 * .what = infers org and repo from repository path
 * .why = enables tracing behavior origin from local path
 */
const inferOrgRepoFromPath = (input: {
  repoDir: string;
}): { org: string; repo: string } => {
  const parts = input.repoDir.split(path.sep);
  const repo = parts[parts.length - 1] ?? 'unknown';
  const org = parts[parts.length - 2] ?? 'local';
  return { org, repo };
};

/**
 * .what = writes gathered behaviors to output directory
 * .why = persists gathered results for downstream skills
 */
const writeGatheredOutput = async (
  input: { gathered: BehaviorGathered[] },
  context: BehaviorDispatchContext,
): Promise<void> => {
  const outputDir = context.cacheDir.mounted.path;
  const gatheredDir = path.join(outputDir, '.gathered');

  // write each gathered behavior
  for (const behavior of input.gathered) {
    const behaviorOutputDir = path.join(
      gatheredDir,
      behavior.behavior.org,
      behavior.behavior.repo,
      behavior.behavior.name,
    );

    // write gathered.json
    const gatheredJsonPath = path.join(behaviorOutputDir, '.gathered.json');
    const gatheredJsonArtifact = genArtifactGitFile({ uri: gatheredJsonPath });
    await gatheredJsonArtifact.set({
      content: JSON.stringify(
        {
          source: behavior.source,
          org: behavior.behavior.org,
          repo: behavior.behavior.repo,
          gatheredAt: behavior.gatheredAt,
          contentHash: behavior.contentHash,
          status: behavior.status,
        },
        null,
        2,
      ),
    });

    // write behavior files (copy from source to output)
    for (const file of behavior.files) {
      const sourceArtifact = genArtifactGitFile({ uri: file.uri });
      const sourceFile = await sourceArtifact.get();
      if (!sourceFile) continue;

      const fileName = path.basename(file.uri);
      const destPath = path.join(behaviorOutputDir, fileName);
      const destArtifact = genArtifactGitFile({ uri: destPath });
      await destArtifact.set({ content: sourceFile.content });
    }
  }

  // write gathered.md summary
  const gatheredMd = renderGatheredSummary({ gathered: input.gathered });
  const gatheredMdArtifact = genArtifactGitFile({
    uri: path.join(outputDir, 'gathered.md'),
  });
  await gatheredMdArtifact.set({ content: gatheredMd });

  // write gathered.json
  const gatheredJson = input.gathered.map((g) => ({
    behavior: g.behavior,
    contentHash: g.contentHash,
    status: g.status,
    gatheredAt: g.gatheredAt,
  }));
  const gatheredJsonArtifact = genArtifactGitFile({
    uri: path.join(outputDir, 'gathered.json'),
  });
  await gatheredJsonArtifact.set({
    content: JSON.stringify(gatheredJson, null, 2),
  });
};

/**
 * .what = renders human-readable summary of gathered behaviors
 * .why = provides scannable overview of what was gathered
 */
const renderGatheredSummary = (input: {
  gathered: BehaviorGathered[];
}): string => {
  const lines: string[] = ['# gathered behaviors', ''];

  // group by org/repo
  const byOrgRepo = new Map<string, BehaviorGathered[]>();
  for (const behavior of input.gathered) {
    const key = `${behavior.behavior.org}/${behavior.behavior.repo}`;
    const entriesBefore = byOrgRepo.get(key) ?? [];
    entriesBefore.push(behavior);
    byOrgRepo.set(key, entriesBefore);
  }

  for (const [orgRepo, behaviors] of byOrgRepo) {
    lines.push(`## ${orgRepo}`);
    lines.push('');
    for (const behavior of behaviors) {
      lines.push(
        `- **${behavior.behavior.name}** (${behavior.status}) - ${behavior.contentHash.slice(0, 8)}`,
      );
    }
    lines.push('');
  }

  lines.push(`---`);
  lines.push(`*gathered ${input.gathered.length} behaviors*`);

  return lines.join('\n');
};
