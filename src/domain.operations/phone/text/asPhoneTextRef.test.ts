import { getError, given, then, useThen, when } from 'test-fns';

import { isPhoneRefusal } from '../render/isPhoneRefusal';
import { asPhoneTextRef } from './asPhoneTextRef';

const CASES_ACCEPTED = [
  {
    description: 'an 8-char alias is accepted',
    given: { raw: '7f3e9a02' },
    expect: { kind: 'alias', value: '7f3e9a02' },
  },
  {
    description: 'an alias in upper case is accepted, lowered',
    given: { raw: '7F3E9A02' },
    expect: { kind: 'alias', value: '7f3e9a02' },
  },
  {
    description: 'a full uuid is accepted',
    given: { raw: '7f3e9a02-41c6-4b0e-9d2a-0c5e8f1a3b77' },
    expect: { kind: 'full', value: '7f3e9a02-41c6-4b0e-9d2a-0c5e8f1a3b77' },
  },
];

const CASES_REFUSED = [
  {
    description: 'a number is refused: texts go by name, not number',
    given: { raw: '3' },
  },
  {
    description: 'a #number is refused the same way',
    given: { raw: '#14' },
  },
  {
    description: 'a 7-char prefix is refused, never guessed',
    given: { raw: '7f3e9a0' },
  },
];

describe('asPhoneTextRef', () => {
  CASES_ACCEPTED.map((thisCase) =>
    given(`an accepted ref: ${thisCase.description}`, () => {
      when('[t0] it is cast', () => {
        then('it names the text by alias or full uuid', () => {
          expect(asPhoneTextRef({ raw: thisCase.given.raw })).toEqual(
            thisCase.expect,
          );
        });
      });
    }),
  );

  CASES_REFUSED.map((thisCase) =>
    given(`a refused ref: ${thisCase.description}`, () => {
      when('[t0] it is cast', () => {
        const refused = useThen('it is refused', () => ({
          error: getError(() => asPhoneTextRef({ raw: thisCase.given.raw })),
        }));

        then('it is refused as a phone refusal', () => {
          expect(isPhoneRefusal(refused.error)).toEqual(true);
        });

        then('the refusal matches the snapshot', () => {
          expect(refused.error.message).toMatchSnapshot();
        });
      });
    }),
  );
});
