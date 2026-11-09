import { getError, given, then, useThen, when } from 'test-fns';

import { asErrorWithCode } from './asErrorWithCode';

const ERROR_ABSENT = Object.assign(new Error('ENOENT: absent'), {
  code: 'ENOENT',
});
const ERROR_BARE = new Error('no code here');
const ERROR_CODE_NUMERIC = Object.assign(new Error('a numeric errno'), {
  code: 13,
});
const ERROR_CODE_UNDEFINED = Object.assign(new Error('a code key, unset'), {
  code: undefined,
});

const TEST_CASES: {
  description: string;
  given: { error: Error };
  expect: { code: string | null };
}[] = [
  {
    description: 'an fs error yields its errno code',
    given: { error: ERROR_ABSENT },
    expect: { code: 'ENOENT' },
  },
  {
    description: 'an error with no code yields null',
    given: { error: ERROR_BARE },
    expect: { code: null },
  },
  {
    description: 'a numeric code yields null, never the string of a number',
    given: { error: ERROR_CODE_NUMERIC },
    expect: { code: null },
  },
  {
    description: 'a code key with no value yields null, never "undefined"',
    given: { error: ERROR_CODE_UNDEFINED },
    expect: { code: null },
  },
];

describe('asErrorWithCode', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the error is read for its code', () => {
        const result = useThen('it reads', async () => ({
          output: asErrorWithCode({ error: thisCase.given.error }),
        }));

        then('it yields the code, and the error itself', () => {
          expect(result.output.code).toEqual(thisCase.expect.code);
          expect(result.output.error).toBe(thisCase.given.error);
        });
      });
    }),
  );

  given('a thrown value that is not an error', () => {
    when('[t0] it is read for its code', () => {
      const result = useThen('it rethrows', async () => ({
        // a string throw carries no code, and must never pass as a fixable one
        error: await getError(() =>
          asErrorWithCode({ error: 'a bare string' }),
        ),
      }));

      then('it is rethrown as is', () => {
        expect(result.error).toEqual('a bare string');
      });
    });
  });
});
