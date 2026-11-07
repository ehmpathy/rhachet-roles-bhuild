import { isPhoneAddressInTreeOf } from './isPhoneAddressInTreeOf';

const SELF = 'phone://grove=bert-laptop/tree=svc-lessons/clone=mechanic';

const TEST_CASES = [
  {
    description: 'a seat in the same tree, on the same grove, shares the tree',
    given: {
      address: 'phone://grove=bert-laptop/tree=svc-lessons/clone=foreman',
    },
    expect: { output: true },
  },
  {
    description: 'a seat in another tree does not',
    given: {
      address: 'phone://grove=bert-laptop/tree=coachbook/clone=foreman',
    },
    expect: { output: false },
  },
  {
    description: 'a tree of the same name on another grove does not',
    given: {
      address:
        'phone://grove=grove-sandpine-v20260901/tree=svc-lessons/clone=foreman',
    },
    expect: { output: false },
  },
  {
    description: 'a tree whose name only starts the same does not',
    given: {
      address: 'phone://grove=bert-laptop/tree=svc-lessons-v2/clone=foreman',
    },
    expect: { output: false },
  },
  {
    description: 'a value with no clone key shares no tree',
    given: { address: 'phone://grove=bert-laptop/tree=svc-lessons' },
    expect: { output: false },
  },
];

describe('isPhoneAddressInTreeOf', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        isPhoneAddressInTreeOf({ address: thisCase.given.address, of: SELF }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
