import { getError, given, then, useThen, when } from 'test-fns';

import { isPhoneRefusal } from '../render/isPhoneRefusal';
import { asPhoneGroupRef } from './asPhoneGroupRef';

const UUID = '0c5e8f1a-41c6-4b0e-9d2a-0c5e8f1a3b77';

const TEST_CASES_CAST: {
  description: string;
  given: { raw: string };
  expect: { kind: 'alias' | 'full'; value: string };
}[] = [
  {
    description: '[case1] the first 8 chars of a uuid, the alias',
    given: { raw: 'group:0c5e8f1a' },
    expect: { kind: 'alias', value: '0c5e8f1a' },
  },
  {
    description: '[case2] the whole uuid',
    given: { raw: `group:${UUID}` },
    expect: { kind: 'full', value: UUID },
  },
  {
    description: '[case3] capitals and edge space are cast away',
    given: { raw: `  GROUP:0C5E8F1A ` },
    expect: { kind: 'alias', value: '0c5e8f1a' },
  },
];

const TEST_CASES_REFUSED: { description: string; given: { raw: string } }[] = [
  { description: '[case4] a ref of no hex', given: { raw: 'group:nope' } },
  {
    description: '[case5] an alias one char short',
    given: { raw: 'group:0c5e8f1' },
  },
  {
    description: '[case6] a uuid with a char too many',
    given: { raw: `group:${UUID}0` },
  },
  { description: '[case7] the prefix alone', given: { raw: 'group:' } },
];

describe('asPhoneGroupRef', () => {
  TEST_CASES_CAST.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the ref is cast', () => {
        const result = useThen('it casts', () =>
          asPhoneGroupRef(thisCase.given),
        );

        then('it names the kind and the lowercase value', () => {
          expect(result).toEqual(thisCase.expect);
        });
      });
    }),
  );

  TEST_CASES_REFUSED.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the ref is cast', () => {
        const refused = useThen('it refuses', () => ({
          error: getError(() => asPhoneGroupRef(thisCase.given)),
        }));

        then('it is a phone refusal that names the form to use', () => {
          expect(isPhoneRefusal(refused.error)).toEqual(true);
          expect(refused.error.message).toContain('is not a group reference');
          expect(refused.error.message).toContain('group:<first 8 chars>');
        });
      });
    }),
  );
});
