import { getError } from 'test-fns';

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
  },
  {
    description: 'an address with no scheme is refused',
    given: { raw: 'notebook/director' },
  },
  {
    description: 'a repeated key is refused',
    given: { raw: 'phone://grove=a/grove=b/clone=director' },
  },
  {
    description: 'the @: shorthand inside the clone key is refused',
    given: { raw: 'phone://grove=bert-laptop/tree=notebook/clone=@:director' },
  },
  {
    description: 'an empty clone is refused',
    given: { raw: '@:' },
  },
];

describe('asPhoneAddressFromInput', () => {
  CASES_ACCEPTED.map((thisCase) =>
    test(thisCase.description, () => {
      const address = asPhoneAddressFromInput({
        raw: thisCase.given.raw,
        self: SELF,
      });
      expect(asPhoneAddressString(address)).toEqual(thisCase.expect);
    }),
  );

  CASES_REFUSED.map((thisCase) =>
    test(thisCase.description, () => {
      const error = getError(() =>
        asPhoneAddressFromInput({ raw: thisCase.given.raw, self: SELF }),
      );
      expect(isPhoneRefusal(error)).toEqual(true);
      expect(error.message).toMatchSnapshot();
    }),
  );
});
