import { getError } from 'test-fns';

import { getOneGhCallTimeout } from './getOneGhCallTimeout';
import { RADIO_GH_SEND_TIMEOUT } from './RADIO_GH_SEND_TIMEOUT';
import { RadioGhSendTimeoutError } from './RadioGhSendTimeoutError';

const genLimit = (input: { perCall: number; left: number }) => ({
  perCall: { milliseconds: input.perCall },
  getMillisecondsLeft: () => input.left,
});

describe('getOneGhCallTimeout', () => {
  test('outside a drain, the per-call default', () => {
    expect(getOneGhCallTimeout({ limit: null })).toEqual(RADIO_GH_SEND_TIMEOUT);
  });

  test('with time to spare, the per-call cap', () => {
    expect(
      getOneGhCallTimeout({
        limit: genLimit({ perCall: 60_000, left: 90_000 }),
      }),
    ).toEqual({ milliseconds: 60_000 });
  });

  test('near the deadline, cut to the whole milliseconds left', () => {
    expect(
      getOneGhCallTimeout({
        limit: genLimit({ perCall: 60_000, left: 1_462.7 }),
      }),
    ).toEqual({ milliseconds: 1_462 });
  });

  test('past the deadline, a send timeout before the call', () => {
    const error = getError(() =>
      getOneGhCallTimeout({ limit: genLimit({ perCall: 60_000, left: 0.4 }) }),
    );
    expect(error).toBeInstanceOf(RadioGhSendTimeoutError);
    expect(error.message).toContain('etimedout');
  });
});
