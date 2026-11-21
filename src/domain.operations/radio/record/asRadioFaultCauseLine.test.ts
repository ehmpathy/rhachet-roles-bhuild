import { given, then, when } from 'test-fns';

import { asRadioFaultCauseLine } from './asRadioFaultCauseLine';

const TEST_CASES = [
  {
    description:
      'an exec fault with its command cut reads its stderr, not the bare prefix',
    given: {
      text: 'Command failed: \nGraphQL: Could not find a repository named sandpine/spot-forecast-widget',
    },
    expect:
      'GraphQL: Could not find a repository named sandpine/spot-forecast-widget',
  },
  {
    description: 'a plain message reads its first line',
    given: { text: 'connect ECONNRESET 140.82.112.6:443\nat TLSSocket' },
    expect: 'connect ECONNRESET 140.82.112.6:443',
  },
  {
    description: 'blank lines ahead of the cause are skipped',
    given: { text: '\n  \nHTTP 403: rate limit exceeded' },
    expect: 'HTTP 403: rate limit exceeded',
  },
  {
    description: 'a bare prefix with no stderr names that it has no text',
    given: { text: 'Command failed:' },
    expect: 'no fault text',
  },
  {
    description: 'an empty text names that it has no text',
    given: { text: String() },
    expect: 'no fault text',
  },
];

describe('asRadioFaultCauseLine', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the cause line is read', () => {
        then(`it reads: ${thisCase.expect}`, () => {
          expect(asRadioFaultCauseLine(thisCase.given)).toEqual(
            thisCase.expect,
          );
        });
      });
    }),
  );
});
