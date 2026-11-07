import { given, then, useThen, when } from 'test-fns';

import { asPhoneTreeLines } from '../render/asPhoneTreeLines';
import { asPhoneReachNodes } from './asPhoneReachNodes';
import type { PhoneReach } from './getOnePhoneReach';

const DIRECTOR = 'phone://grove=bert-laptop/tree=notebook/clone=director';
const SCOUT =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-ratings/clone=scout';
const CREW_OTHER =
  'phone://grove=grove-sandpine-v20260901/tree=svc-lessons.beav.feat-coachbook/clone=mechanic';

const EMPTY: PhoneReach = {
  contacts: [],
  inbound: [],
  groupMates: [],
  ownTree: [],
  contactsUnreadable: null,
};

const TEST_CASES: {
  description: string;
  given: PhoneReach;
  expect: { contains: string[] };
}[] = [
  {
    description: '[case1] no one is in reach',
    given: EMPTY,
    expect: { contains: ['(no one yet)'] },
  },
  {
    description: '[case2] a group mate, reached through its group alone',
    given: { ...EMPTY, groupMates: [SCOUT] },
    expect: { contains: [`${SCOUT}   (group mate, via its group)`] },
  },
  {
    description: '[case3] each ground of admission, aligned',
    given: {
      ...EMPTY,
      contacts: [DIRECTOR],
      inbound: [CREW_OTHER],
      groupMates: [SCOUT],
      ownTree: [
        {
          serial: '4c1e8b27-9a0f-4d2e-8b31-6f7a0c5d2e19',
          slug: 'foreman',
          reachState: 'LIVE',
        },
      ],
    },
    expect: {
      contains: [
        '(contact)',
        '(texted you)',
        '(group mate, via its group)',
        '(own tree)',
      ],
    },
  },
];

describe('asPhoneReachNodes', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the nodes are rendered', () => {
        const rendered = useThen('it renders', () => ({
          output: asPhoneTreeLines({
            nodes: asPhoneReachNodes({ reach: thisCase.given }),
          }).join('\n'),
        }));

        then('it names each ground of admission', () => {
          for (const text of thisCase.expect.contains)
            expect(rendered.output).toContain(text);
        });

        then('it matches the snapshot', () => {
          expect(rendered.output).toMatchSnapshot();
        });
      });
    }),
  );
});
