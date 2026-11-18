import { given, then, when } from 'test-fns';

import type { RadioRepoVisibility } from '@src/domain.objects/RadioRepoVisibility';

import { asRadioPromiseHoldReason } from './asRadioPromiseHoldReason';

const TEST_CASES: {
  description: string;
  visibility: RadioRepoVisibility;
  causeCode: string | null;
  expect: string | null;
}[] = [
  {
    description: 'public',
    visibility: 'public',
    causeCode: null,
    expect: 'public-repo:unpromised',
  },
  {
    description: 'private',
    visibility: 'private',
    causeCode: null,
    expect: null,
  },
  {
    description: 'internal',
    visibility: 'internal',
    causeCode: null,
    expect: null,
  },
  {
    description: 'unreadable, a parse miss',
    visibility: 'unreadable',
    causeCode: null,
    expect: 'public-repo:unreadable',
  },
  {
    description: 'unreadable, a fault no auth cures',
    visibility: 'unreadable',
    causeCode: 'upstream:fault',
    expect: 'public-repo:unreadable',
  },
  {
    description: 'unreadable, a 401',
    visibility: 'unreadable',
    causeCode: 'upstream:401',
    expect: 'public-repo:unreadable-auth',
  },
  {
    description: 'unreadable, a repo not found',
    visibility: 'unreadable',
    causeCode: 'upstream:not-found',
    expect: 'public-repo:unreadable-auth',
  },
];

describe('asRadioPromiseHoldReason', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the visibility is mapped', () => {
        then('it returns the hold reason, or null', () => {
          expect(
            asRadioPromiseHoldReason({
              visibility: thisCase.visibility,
              causeCode: thisCase.causeCode,
            }),
          ).toEqual(thisCase.expect);
        });
      });
    }),
  );
});
