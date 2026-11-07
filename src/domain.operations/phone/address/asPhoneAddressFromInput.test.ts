import { getError, given, then, useThen, when } from 'test-fns';

import { isPhoneRefusal } from '../render/isPhoneRefusal';
import { asPhoneAddressFromInput } from './asPhoneAddressFromInput';
import { asPhoneAddressString } from './asPhoneAddressString';

const SELF = {
  grove: 'bert-laptop',
  tree: 'svc-lessons.beav.feat-book-a-lesson',
};

const CASES_ACCEPTED = [
  {
    description: 'the full form passes through as typed',
    given: {
      raw: 'phone://grove=bert-laptop/tree=notebook/clone=director',
    },
    expect: 'phone://grove=bert-laptop/tree=notebook/clone=director',
  },
  {
    description: 'grove=local is cast to this grove name',
    given: { raw: 'phone://grove=local/tree=notebook/clone=director' },
    expect: 'phone://grove=bert-laptop/tree=notebook/clone=director',
  },
  {
    description: '@:<clone> names a clone in the own tree',
    given: { raw: '@:foreman' },
    expect:
      'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-book-a-lesson/clone=foreman',
  },
  {
    description: 'a full serial is a valid clone value',
    given: {
      raw: 'phone://grove=bert-laptop/tree=notebook/clone=4c1e8b27-9a0f-4d2e-8b31-6f7a0c5d2e19',
    },
    expect:
      'phone://grove=bert-laptop/tree=notebook/clone=4c1e8b27-9a0f-4d2e-8b31-6f7a0c5d2e19',
  },
];

const CASES_REFUSED = [
  {
    description:
      'keys out of order are refused, and the canonical form is named',
    given: { raw: 'phone://tree=notebook/grove=bert-laptop/clone=director' },
    expect: {
      fault: 'use: phone://grove=bert-laptop/tree=notebook/clone=director',
    },
  },
  {
    description: 'an address with no scheme is refused',
    given: { raw: 'notebook/director' },
    expect: { fault: 'fault: it starts with neither phone:// nor @:' },
  },
  {
    description: 'a repeated key is refused',
    given: { raw: 'phone://grove=a/grove=b/clone=director' },
    expect: {
      fault: 'fault: its keys must be grove, tree, and clone, each once',
    },
  },
  {
    description: 'the @: shorthand inside the clone key is refused',
    given: { raw: 'phone://grove=bert-laptop/tree=notebook/clone=@:director' },
    expect: {
      fault:
        'fault: the clone key takes a bare name: clone=director, not clone=@:director',
    },
  },
  {
    description: 'an empty clone is refused',
    given: { raw: '@:' },
    expect: { fault: 'fault: no clone is named after @:; e.g. @:foreman' },
  },
  {
    description: 'an empty clone value in the full form is refused',
    given: { raw: 'phone://grove=bert-laptop/tree=notebook/clone=' },
    expect: { fault: 'fault: the clone key has no value' },
  },
];

describe('asPhoneAddressFromInput', () => {
  CASES_ACCEPTED.map((thisCase) =>
    given(`an accepted address: ${thisCase.description}`, () => {
      when('[t0] it is cast', () => {
        then('it leaves in canonical form', () => {
          const address = asPhoneAddressFromInput({
            raw: thisCase.given.raw,
            self: SELF,
          });
          expect(asPhoneAddressString(address)).toEqual(thisCase.expect);
        });
      });
    }),
  );

  CASES_REFUSED.map((thisCase) =>
    given(`a refused address: ${thisCase.description}`, () => {
      when('[t0] it is cast', () => {
        const refused = useThen('it is refused', () => ({
          error: getError(() =>
            asPhoneAddressFromInput({ raw: thisCase.given.raw, self: SELF }),
          ),
        }));

        then('it is refused as a phone refusal', () => {
          expect(isPhoneRefusal(refused.error)).toEqual(true);
        });

        then('the refusal names the fault it hit', () => {
          expect(refused.error.message).toContain(thisCase.expect.fault);
        });

        then('the refusal matches the snapshot', () => {
          expect(refused.error.message).toMatchSnapshot();
        });
      });
    }),
  );
});
