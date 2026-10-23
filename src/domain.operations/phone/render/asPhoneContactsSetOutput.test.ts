import { given, then, when } from 'test-fns';

import { asPhoneContactsSetOutput } from './asPhoneContactsSetOutput';

const MECHANIC =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-book-a-lesson/clone=mechanic';
const FOREMAN =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-book-a-lesson/clone=foreman';

const TEST_CASES: {
  description: string;
  given: Parameters<typeof asPhoneContactsSetOutput>[0];
  expect: { contains: string; label: string };
}[] = [
  {
    description: '[case1] a new contact is granted',
    given: {
      mode: 'grant',
      address: MECHANIC,
      contacts: [FOREMAN, MECHANIC],
      isChanged: true,
    },
    expect: {
      contains: 'new friend in the pond',
      label: `granted: ${MECHANIC}`,
    },
  },
  {
    description: '[case2] a contact already held is granted again',
    given: {
      mode: 'grant',
      address: MECHANIC,
      contacts: [MECHANIC],
      isChanged: false,
    },
    expect: {
      contains: 'no change, the pond already holds that',
      label: `already a contact: ${MECHANIC}`,
    },
  },
  {
    description: '[case3] a contact is revoked',
    given: {
      mode: 'revoke',
      address: MECHANIC,
      contacts: [FOREMAN],
      isChanged: true,
    },
    expect: { contains: 'waved them off', label: `revoked: ${MECHANIC}` },
  },
  {
    description: '[case4] a contact not held is revoked',
    given: {
      mode: 'revoke',
      address: MECHANIC,
      contacts: [FOREMAN],
      isChanged: false,
    },
    expect: {
      contains: 'no change, they were not in the pond',
      label: `not a contact: ${MECHANIC}`,
    },
  },
];

describe('asPhoneContactsSetOutput', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the output is rendered', () => {
        const output = asPhoneContactsSetOutput(thisCase.given);

        then('it names what changed', () => {
          expect(output).toContain(thisCase.expect.contains);
        });

        then(
          'its label names the state, never an act that did not happen',
          () => {
            expect(output).toContain(thisCase.expect.label);
          },
        );

        then('it matches the snapshot', () => {
          expect(output).toMatchSnapshot();
        });
      });
    }),
  );
});
