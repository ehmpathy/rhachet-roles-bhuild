import type {
  RadioGlobalState,
  RadioLocalState,
  RadioOrgState,
} from '../../../domain.objects/RadioPermissions';
import { computeRadioUsagePermissionDecision } from './computeRadioUsagePermissionDecision';

/**
 * all 24 rows from criteria matrix.1
 *
 * columns: global, @all, org X, local → expected, reason
 *
 * states: 'blocked' | 'allowed' | null (unset)
 */
const TEST_CASES: Array<{
  row: number;
  description: string;
  given: {
    global: RadioGlobalState | null;
    org: RadioOrgState | null;
    local: RadioLocalState | null;
    targetOrg: string;
  };
  expect: {
    allowed: boolean;
    reason: string;
  };
}> = [
  // row 1: global blocked supersedes all
  {
    row: 1,
    description: 'global=blocked supersedes all',
    given: {
      global: { blocked: true },
      org: { orgs: { '@all': 'allowed', ehmpathy: 'allowed' } },
      local: { state: 'allowed' },
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: false, reason: 'global blocked' },
  },

  // rows 2-10: global=allowed, @all=blocked variations
  {
    row: 2,
    description:
      'global=allowed, @all=blocked, orgX=unset, local=unset → blocked',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'blocked' } },
      local: null,
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: false, reason: '@all blocked' },
  },
  {
    row: 3,
    description:
      'global=allowed, @all=blocked, orgX=unset, local=allowed → allowed',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'blocked' } },
      local: { state: 'allowed' },
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: true, reason: 'local allowed' },
  },
  {
    row: 4,
    description:
      'global=allowed, @all=blocked, orgX=unset, local=blocked → blocked',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'blocked' } },
      local: { state: 'blocked' },
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: false, reason: 'local blocked' },
  },
  {
    row: 5,
    description:
      'global=allowed, @all=blocked, orgX=allowed, local=unset → allowed',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'blocked', ehmpathy: 'allowed' } },
      local: null,
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: true, reason: 'org allowed' },
  },
  {
    row: 6,
    description:
      'global=allowed, @all=blocked, orgX=allowed, local=allowed → allowed',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'blocked', ehmpathy: 'allowed' } },
      local: { state: 'allowed' },
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: true, reason: 'local allowed' },
  },
  {
    row: 7,
    description:
      'global=allowed, @all=blocked, orgX=allowed, local=blocked → blocked',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'blocked', ehmpathy: 'allowed' } },
      local: { state: 'blocked' },
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: false, reason: 'local blocked' },
  },
  {
    row: 8,
    description:
      'global=allowed, @all=blocked, orgX=blocked, local=unset → blocked',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'blocked', ehmpathy: 'blocked' } },
      local: null,
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: false, reason: 'org blocked' },
  },
  {
    row: 9,
    description:
      'global=allowed, @all=blocked, orgX=blocked, local=allowed → allowed',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'blocked', ehmpathy: 'blocked' } },
      local: { state: 'allowed' },
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: true, reason: 'local allowed' },
  },
  {
    row: 10,
    description:
      'global=allowed, @all=blocked, orgX=blocked, local=blocked → blocked',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'blocked', ehmpathy: 'blocked' } },
      local: { state: 'blocked' },
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: false, reason: 'local blocked' },
  },

  // rows 11-19: global=allowed, @all=allowed variations
  {
    row: 11,
    description:
      'global=allowed, @all=allowed, orgX=unset, local=unset → allowed',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'allowed' } },
      local: null,
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: true, reason: '@all allowed' },
  },
  {
    row: 12,
    description:
      'global=allowed, @all=allowed, orgX=unset, local=allowed → allowed',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'allowed' } },
      local: { state: 'allowed' },
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: true, reason: 'local allowed' },
  },
  {
    row: 13,
    description:
      'global=allowed, @all=allowed, orgX=unset, local=blocked → blocked',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'allowed' } },
      local: { state: 'blocked' },
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: false, reason: 'local blocked' },
  },
  {
    row: 14,
    description:
      'global=allowed, @all=allowed, orgX=allowed, local=unset → allowed',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'allowed', ehmpathy: 'allowed' } },
      local: null,
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: true, reason: 'org allowed' },
  },
  {
    row: 15,
    description:
      'global=allowed, @all=allowed, orgX=allowed, local=allowed → allowed',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'allowed', ehmpathy: 'allowed' } },
      local: { state: 'allowed' },
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: true, reason: 'local allowed' },
  },
  {
    row: 16,
    description:
      'global=allowed, @all=allowed, orgX=allowed, local=blocked → blocked',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'allowed', ehmpathy: 'allowed' } },
      local: { state: 'blocked' },
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: false, reason: 'local blocked' },
  },
  {
    row: 17,
    description:
      'global=allowed, @all=allowed, orgX=blocked, local=unset → blocked',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'allowed', ehmpathy: 'blocked' } },
      local: null,
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: false, reason: 'org blocked' },
  },
  {
    row: 18,
    description:
      'global=allowed, @all=allowed, orgX=blocked, local=allowed → allowed',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'allowed', ehmpathy: 'blocked' } },
      local: { state: 'allowed' },
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: true, reason: 'local allowed' },
  },
  {
    row: 19,
    description:
      'global=allowed, @all=allowed, orgX=blocked, local=blocked → blocked',
    given: {
      global: { blocked: false },
      org: { orgs: { '@all': 'allowed', ehmpathy: 'blocked' } },
      local: { state: 'blocked' },
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: false, reason: 'local blocked' },
  },

  // rows 20-23: global=allowed, @all=unset variations
  {
    row: 20,
    description:
      'global=allowed, @all=unset, orgX=unset, local=unset → blocked',
    given: {
      global: { blocked: false },
      org: { orgs: {} },
      local: null,
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: false, reason: 'safe default (unset)' },
  },
  {
    row: 21,
    description:
      'global=allowed, @all=unset, orgX=unset, local=allowed → allowed',
    given: {
      global: { blocked: false },
      org: { orgs: {} },
      local: { state: 'allowed' },
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: true, reason: 'local allowed' },
  },
  {
    row: 22,
    description:
      'global=allowed, @all=unset, orgX=allowed, local=unset → allowed',
    given: {
      global: { blocked: false },
      org: { orgs: { ehmpathy: 'allowed' } },
      local: null,
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: true, reason: 'org allowed' },
  },
  {
    row: 23,
    description:
      'global=allowed, @all=unset, orgX=blocked, local=unset → blocked',
    given: {
      global: { blocked: false },
      org: { orgs: { ehmpathy: 'blocked' } },
      local: null,
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: false, reason: 'org blocked' },
  },

  // row 24: all unset
  {
    row: 24,
    description: 'all unset → blocked (safe default)',
    given: {
      global: null,
      org: null,
      local: null,
      targetOrg: 'ehmpathy',
    },
    expect: { allowed: false, reason: 'safe default (unset)' },
  },
];

describe('computeRadioUsagePermissionDecision', () => {
  describe('precedence matrix (24 rows)', () => {
    TEST_CASES.map((thisCase) =>
      test(`row ${thisCase.row}: ${thisCase.description}`, () => {
        const result = computeRadioUsagePermissionDecision(thisCase.given);
        expect(result.allowed).toEqual(thisCase.expect.allowed);
        expect(result.reason).toEqual(thisCase.expect.reason);
      }),
    );
  });
});
