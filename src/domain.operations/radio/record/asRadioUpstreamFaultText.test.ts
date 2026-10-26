import { ConstraintError } from 'helpful-errors';

import { RadioGhSendTimeoutError } from '@src/access/daos/daoRadioTask/RadioGhSendTimeoutError';

import { asRadioUpstreamFaultText } from './asRadioUpstreamFaultText';
import { asRadioUpstreamReason } from './asRadioUpstreamReason';

const CMD =
  'gh issue create --repo sandpine/svc-lessons --title 🎙️ task - handle rate limit in radio --body-file /tmp/x.md';

const TEST_CASES = [
  {
    description: 'an exec error: the echoed command is cut, stderr is kept',
    given: {
      error: {
        message: `Command failed: ${CMD}\nHTTP 403: Resource not accessible by integration`,
        cmd: CMD,
        stderr: 'HTTP 403: Resource not accessible by integration',
      },
    },
    expect: { reason: 'upstream:access', excludes: 'handle rate limit' },
  },
  {
    description: 'a helpful error: its metadata (with the command) is redacted',
    given: {
      error: new ConstraintError('github auth failed: token rejected (401)', {
        command: CMD,
      }),
    },
    expect: { reason: 'upstream:401', excludes: 'handle rate limit' },
  },
  {
    description: 'a send timeout: classified transient, its command redacted',
    given: {
      error: new RadioGhSendTimeoutError(
        'gh call timed out after 60s (etimedout); the record stays held',
        { command: CMD },
      ),
    },
    expect: { reason: 'upstream:transient', excludes: 'handle rate limit' },
  },
  {
    description: 'a bare value: its text as is',
    given: { error: 'API rate limit exceeded' },
    expect: { reason: 'upstream:rate-limit', excludes: null },
  },
];

describe('asRadioUpstreamFaultText', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const text = asRadioUpstreamFaultText({ error: thisCase.given.error });
      expect(asRadioUpstreamReason({ message: text })).toEqual(
        thisCase.expect.reason,
      );
      if (thisCase.expect.excludes)
        expect(text).not.toContain(thisCase.expect.excludes);
    }),
  );
});
