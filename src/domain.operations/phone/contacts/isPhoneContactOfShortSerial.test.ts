import { given, then, when } from 'test-fns';

import { PhoneAddress } from '@src/domain.objects/phone/PhoneAddress';

import { isPhoneContactOfShortSerial } from './isPhoneContactOfShortSerial';

const TREE =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-book-a-lesson';
const PARSED = new PhoneAddress({
  grove: 'bert-laptop',
  tree: 'svc-lessons.beav.feat-book-a-lesson',
  clone: 'deadbeef',
});

const TEST_CASES = [
  {
    description: '[case1] a full serial the short serial prefixes',
    given: { contact: `${TREE}/clone=deadbeef-6e0f-4b9a-8c27-5d31f90e7a46` },
    expect: { output: true },
  },
  {
    description: '[case2] a slug that starts with the same eight hex',
    given: { contact: `${TREE}/clone=deadbeef-lead` },
    expect: { output: false },
  },
  {
    description: '[case3] a full serial with another prefix',
    given: { contact: `${TREE}/clone=a1b2c3d4-6e0f-4b9a-8c27-5d31f90e7a46` },
    expect: { output: false },
  },
  {
    description: '[case4] the same serial, in another tree',
    given: {
      contact:
        'phone://grove=bert-laptop/tree=notebook/clone=deadbeef-6e0f-4b9a-8c27-5d31f90e7a46',
    },
    expect: { output: false },
  },
];

describe('isPhoneContactOfShortSerial', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the contact is checked against @:deadbeef', () => {
        then(`it answers ${thisCase.expect.output}`, () => {
          expect(
            isPhoneContactOfShortSerial({
              contact: thisCase.given.contact,
              parsed: PARSED,
            }),
          ).toEqual(thisCase.expect.output);
        });
      });
    }),
  );
});
