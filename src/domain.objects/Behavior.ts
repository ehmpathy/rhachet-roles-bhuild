import { DomainEntity } from 'domain-objects';

/**
 * .what = root entity representing a behavior in a repository
 * .why = provides identity for behaviors across gather/deptrace/measure/triage lifecycle
 */
export interface Behavior {
  org: string;
  repo: string;
  name: string;
}

export class Behavior extends DomainEntity<Behavior> implements Behavior {
  public static unique = ['org', 'repo', 'name'] as const;
}
