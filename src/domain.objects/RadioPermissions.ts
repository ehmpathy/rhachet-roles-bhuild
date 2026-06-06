/**
 * .what = permission state types for radio.uses controls
 * .why = enables hierarchical permission management (global > org > local)
 */

/**
 * global circuit breaker state
 *
 * when blocked = true, all radio usage is blocked regardless of org/local settings
 */
interface RadioGlobalState {
  blocked: boolean;
}

/**
 * per-org permission state
 *
 * orgs map includes:
 * - @all: default fallback for orgs not explicitly set
 * - specific org names: e.g., "ehmpathy", "ahbode"
 */
interface RadioOrgState {
  orgs: Record<string, 'allowed' | 'blocked'>;
}

/**
 * local (per-repo) permission state
 */
interface RadioLocalState {
  state: 'allowed' | 'blocked';
}

/**
 * decision result from permission check
 */
interface RadioPermissionDecision {
  allowed: boolean;
  reason: string;
  level: 'global' | 'org' | 'local' | 'default';
}

export type {
  RadioGlobalState,
  RadioOrgState,
  RadioLocalState,
  RadioPermissionDecision,
};
