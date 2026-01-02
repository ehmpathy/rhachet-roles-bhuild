import { DomainEntity, type RefByUnique } from 'domain-objects';
import type { GitFile } from 'rhachet-artifact-git';

import type { Behavior } from './Behavior';

/**
 * .what = represents a behavior after collection from source repositories
 * .why = provides versioned snapshot with contentHash for cache invalidation
 */

export type BehaviorGatheredStatus =
  | 'wished'
  | 'envisioned'
  | 'constrained'
  | 'blueprinted'
  | 'inflight'
  | 'delivered';

/**
 * .what = source from a local repository
 * .why = enables tracing behaviors to local .behavior/ directories
 */
export interface BehaviorGatheredSourceRepoLocal {
  type: 'repo.local';
}

/**
 * .what = source from remote repository main branch via clone
 * .why = enables gathering behaviors from external git repos
 */
export interface BehaviorGatheredSourceRepoRemoteViaClone {
  type: 'repo.remote.via.clone';
  org: string;
  repo: string;
  branch: string;
}

/**
 * .what = source from PR branch via clone
 * .why = enables gathering in-flight behaviors from open PRs
 */
export interface BehaviorGatheredSourceRepoRemoteViaPr {
  type: 'repo.remote.via.pr';
  org: string;
  repo: string;
  prNumber: number;
  prBranch: string;
}

/**
 * .what = source synthesized from GitHub issue
 * .why = enables treating issues as behavior wishes
 */
export interface BehaviorGatheredSourceRepoRemoteViaIssue {
  type: 'repo.remote.via.issue';
  org: string;
  repo: string;
  issueNumber: number;
}

/**
 * .what = discriminated union of all behavior sources
 * .why = enables tracing behavior origin with full type safety
 */
export type BehaviorGatheredSource =
  | BehaviorGatheredSourceRepoLocal
  | BehaviorGatheredSourceRepoRemoteViaClone
  | BehaviorGatheredSourceRepoRemoteViaPr
  | BehaviorGatheredSourceRepoRemoteViaIssue;

export interface BehaviorGathered {
  gatheredAt: string;
  behavior: RefByUnique<typeof Behavior>;
  contentHash: string;
  status: BehaviorGatheredStatus;
  /**
   * .what = lightweight refs to behavior files (no content persisted)
   * .why = enables many BehaviorGathered objects in memory without bloat
   *
   * @note operations needing content should use fs.readFile(file.uri)
   */
  files: RefByUnique<typeof GitFile>[];
  /**
   * .what = where this behavior was gathered from
   * .why = enables tracing behavior origin with full metadata
   */
  source: BehaviorGatheredSource;
}

export class BehaviorGathered
  extends DomainEntity<BehaviorGathered>
  implements BehaviorGathered
{
  public static unique = ['behavior', 'contentHash'] as const;
}
