import { given, then, when } from 'test-fns';

import { asPhoneSayOutcome } from './asPhoneSayOutcome';

const SERIAL = '20fa7ac9-4dfc-4cbc-be9f-7685b5672a14';

/**
 * .what = the stderr json rhachet writes for a failed say
 */
const asStderr = (input: {
  message: string;
  reachState?: string | null;
  reachCause?: string | null;
  metadata?: Record<string, unknown>;
}): string =>
  JSON.stringify({
    class: 'ConstraintError',
    message: input.message,
    hint: null,
    reachState: input.reachState ?? null,
    reachCause: input.reachCause ?? null,
    metadata: input.metadata ?? {},
  });

const TEST_CASES = [
  {
    description: 'released → DELIVERED, with the serial that took it',
    given: {
      exitCode: 0,
      stdout: JSON.stringify({
        delivered: true,
        verdict: 'released',
        serial: SERIAL,
      }),
      stderr: '',
    },
    expect: { status: 'DELIVERED', reason: null },
  },
  {
    description:
      'a clean exit with an unsure verdict → FAULTED, rhachet reason kept',
    given: {
      exitCode: 0,
      stdout: JSON.stringify({
        delivered: false,
        verdict: 'buffered',
        reason: 'still-in-input-box',
        serial: SERIAL,
      }),
      stderr: '',
    },
    expect: {
      status: 'FAULTED',
      reason: 'buffered: still-in-input-box',
    },
  },
  {
    description: 'enqueued → DELIVERED',
    given: {
      exitCode: 0,
      stdout: JSON.stringify({
        delivered: true,
        verdict: 'enqueued',
        serial: SERIAL,
      }),
      stderr: '',
    },
    expect: { status: 'DELIVERED', reason: null },
  },
  {
    description: 'withheld at a modal → QUEUED, peer at a modal',
    given: {
      exitCode: 2,
      stdout: '',
      stderr: asStderr({
        message: 'withheld',
        metadata: { verdict: 'withheld', reason: 'modal-holds-focus' },
      }),
    },
    expect: { status: 'QUEUED', reason: 'peer at a modal' },
  },
  {
    description: 'withheld on a dirty input box → QUEUED, never forced',
    given: {
      exitCode: 2,
      stdout: '',
      stderr: asStderr({
        message: 'withheld',
        metadata: { verdict: 'withheld', reason: 'input-region-dirty' },
      }),
    },
    expect: {
      status: 'QUEUED',
      reason: 'peer input box holds typed text',
    },
  },
  {
    description: 'withheld on an unrecognized screen → QUEUED',
    given: {
      exitCode: 2,
      stdout: '',
      stderr: asStderr({
        message: 'withheld',
        metadata: { verdict: 'withheld', reason: 'focus-unrecognized' },
      }),
    },
    expect: {
      status: 'QUEUED',
      reason: 'peer screen unrecognized',
    },
  },
  {
    description: 'a dead clone → QUEUED, its state and cause named',
    given: {
      exitCode: 2,
      stdout: '',
      stderr: asStderr({
        message: 'clone is DEAD',
        reachState: 'DEAD',
        reachCause: 'DEAD-same-host',
      }),
    },
    expect: {
      status: 'QUEUED',
      reason: 'peer clone is DEAD: DEAD-same-host',
    },
  },
  {
    description: 'a deaf clone → QUEUED, named DEAF, never dead',
    given: {
      exitCode: 2,
      stdout: '',
      stderr: asStderr({ message: 'clone is DEAF', reachState: 'DEAF' }),
    },
    expect: { status: 'QUEUED', reason: 'peer clone is DEAF' },
  },
  {
    description:
      'a clone that left after the roster read → FAULTED, rhachet message kept, never resaid',
    given: {
      exitCode: 2,
      stdout: '',
      stderr: asStderr({ message: "no clone answers to '@:mechanik'" }),
    },
    expect: {
      status: 'FAULTED',
      reason: "no clone answers to '@:mechanik'",
    },
  },
  {
    description: 'buffered → FAULTED, rhachet reason kept',
    given: {
      exitCode: 1,
      stdout: '',
      stderr: asStderr({
        message: 'buffered',
        metadata: { verdict: 'buffered', reason: 'still-in-input-box' },
      }),
    },
    expect: {
      status: 'FAULTED',
      reason: 'buffered: still-in-input-box',
    },
  },
  {
    description:
      'absent (the peer exited mid-dispatch) → FAULTED, never resaid',
    given: {
      exitCode: 1,
      stdout: '',
      stderr: asStderr({
        message: 'absent',
        metadata: { verdict: 'absent', reason: 'exited-mid-dispatch' },
      }),
    },
    expect: {
      status: 'FAULTED',
      reason: 'absent: exited-mid-dispatch',
    },
  },
  {
    description: 'a clean exit with verdict absent → FAULTED',
    given: {
      exitCode: 0,
      stdout: JSON.stringify({
        delivered: false,
        verdict: 'absent',
        serial: SERIAL,
      }),
      stderr: '',
    },
    expect: { status: 'FAULTED', reason: 'absent' },
  },
  {
    description: 'unreadable stderr → FAULTED',
    given: { exitCode: 1, stdout: '', stderr: 'segfault' },
    expect: {
      status: 'FAULTED',
      reason: 'say failed; its output was unreadable',
    },
  },
];

describe('asPhoneSayOutcome', () => {
  TEST_CASES.map((thisCase) =>
    given(`a say that ends: ${thisCase.description}`, () => {
      when('[t0] its outcome is read', () => {
        then('the text gets the status and reason named', () => {
          expect(asPhoneSayOutcome({ raw: thisCase.given })).toEqual(
            thisCase.expect,
          );
        });
      });
    }),
  );
});
