import type {
  RadioGlobalState,
  RadioLocalState,
  RadioOrgState,
  RadioPermissionDecision,
} from '../../../domain.objects/RadioPermissions';

/**
 * .what = compute radio usage permission decision from state hierarchy
 * .why = precedence rules: global > local > org > @all > default blocked
 */
export const computeRadioUsagePermissionDecision = (input: {
  global: RadioGlobalState | null;
  org: RadioOrgState | null;
  local: RadioLocalState | null;
  targetOrg: string;
}): RadioPermissionDecision => {
  // rule 1: global blocked supersedes all
  if (input.global?.blocked === true) {
    return { allowed: false, reason: 'global blocked', level: 'global' };
  }

  // rule 2: org-specific state takes precedence over local
  const orgState = input.org?.orgs?.[input.targetOrg];
  if (orgState !== undefined) {
    if (orgState === 'blocked') {
      return { allowed: false, reason: 'org blocked', level: 'org' };
    }
    if (orgState === 'allowed') {
      return { allowed: true, reason: 'org allowed', level: 'org' };
    }
  }

  // rule 3: @all fallback for orgs not explicitly set (before local)
  const allState = input.org?.orgs?.['@all'];
  if (allState !== undefined) {
    if (allState === 'blocked') {
      return { allowed: false, reason: '@all blocked', level: 'org' };
    }
    if (allState === 'allowed') {
      return { allowed: true, reason: '@all allowed', level: 'org' };
    }
  }

  // rule 4: local state (only applies if org unset)
  if (input.local !== null) {
    if (input.local.state === 'blocked') {
      return { allowed: false, reason: 'local blocked', level: 'local' };
    }
    if (input.local.state === 'allowed') {
      return { allowed: true, reason: 'local allowed', level: 'local' };
    }
  }

  // rule 5: all unset = blocked (safe default)
  return { allowed: false, reason: 'safe default (unset)', level: 'default' };
};
