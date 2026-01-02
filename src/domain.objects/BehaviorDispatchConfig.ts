import { DomainLiteral } from 'domain-objects';

import type { BehaviorSourceRepoRemote } from './BehaviorSourceRepoRemote';

/**
 * .what = configuration literal for behavior dispatch operations
 * .why = provides centralized config for gather/prioritize/coordinate skills
 *
 * @example
 * ```yaml
 * # rhachet.dispatch.yml
 * output: .dispatch
 * sources:
 *   local:
 *     enabled: true
 *   remote:
 *     - org: ehmpathy
 *       repo: domain-objects
 *       branch: main
 * criteria:
 *   hourlyRate: 150
 * constraints:
 *   maxConcurrency: 3
 * ```
 */
export interface BehaviorDispatchConfig {
  output: string;
  sources: {
    local: {
      enabled: boolean;
    };
    remote: BehaviorSourceRepoRemote[];
  };
  criteria: {
    gain: {
      leverage: {
        weights: {
          author: number;
          support: number;
        };
      };
    };
    convert: {
      equate: {
        cash: { dollars: number };
        time: { hours: number };
      };
    };
  };
  /**
   * cost amortization settings
   */
  cost: {
    /**
     * amortization horizon for upfront costs
     * @default { weeks: 24 } (1 half year)
     */
    horizon: { weeks: number };
  };
  constraints: {
    maxConcurrency: number;
  };
}

export class BehaviorDispatchConfig
  extends DomainLiteral<BehaviorDispatchConfig>
  implements BehaviorDispatchConfig
{
  public static nested = {
    sources: DomainLiteral,
    criteria: DomainLiteral,
    cost: DomainLiteral,
    constraints: DomainLiteral,
  };
}
