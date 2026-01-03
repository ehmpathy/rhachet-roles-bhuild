import { DomainLiteral } from 'domain-objects';

/**
 * .what = configuration for a remote repository source
 * .why = enables gathering behaviors from remote git repositories
 *
 * @example
 * ```yaml
 * sources:
 *   remote:
 *     - org: ehmpathy
 *       repo: domain-objects
 *       branch: main
 * ```
 */
export interface BehaviorSourceRepoRemote {
  org: string;
  repo: string;
  branch: string;
}

export class BehaviorSourceRepoRemote
  extends DomainLiteral<BehaviorSourceRepoRemote>
  implements BehaviorSourceRepoRemote {}
