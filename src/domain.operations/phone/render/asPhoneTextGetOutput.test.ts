import { given, then, when } from 'test-fns';

import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';
import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';
import type { PhoneTextStatus } from '@src/domain.objects/phone/PhoneTextStatus';

import { asPhoneTextGetOutput } from './asPhoneTextGetOutput';

const DIRECTOR = 'phone://grove=bert-laptop/tree=notebook/clone=director';
const MECHANIC =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-book-a-lesson/clone=mechanic';

/**
 * .what = one entry of the director's thread
 */
const genEntry = (input: {
  uuid: string;
  way: 'out' | 'in';
  status: PhoneTextStatus;
  reason: string | null;
  re: string | null;
  what: string;
}): PhoneMailboxEntry => ({
  path: `/mailbox/text.0001.${input.way}.json`,
  record: new PhoneTextRecord({
    uuid: input.uuid,
    way: input.way,
    group: null,
    re: input.re,
    from: input.way === 'out' ? DIRECTOR : MECHANIC,
    to: input.way === 'out' ? MECHANIC : DIRECTOR,
    what: input.what,
    status: input.status,
    reason: input.reason,
  }),
});

const TEST_CASES = [
  {
    description: '[case1] an empty thread',
    given: { entries: [], unreadable: [], daemon: 'LIVE' as const },
    expect: { contains: '(no texts yet)' },
  },
  {
    description: '[case5] one text, and one record a newer writer left',
    given: {
      entries: [
        genEntry({
          uuid: '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
          way: 'out',
          status: 'DELIVERED',
          reason: null,
          re: null,
          what: 'where is book-a-lesson?',
        }),
      ],
      unreadable: [
        {
          path: '/mailbox/text.0002.in.json',
          reason: 'phone text record has an unknown shape',
        },
      ],
      daemon: 'LIVE' as const,
    },
    expect: { contains: '1 unreadable, skipped' },
  },
  {
    description: '[case6] no text it can read, one record it can not',
    given: {
      entries: [],
      unreadable: [
        {
          path: '/mailbox/text.0001.in.json',
          reason: 'phone text record is not json',
        },
      ],
      daemon: 'LIVE' as const,
    },
    expect: { contains: 'text.0001.in.json: phone text record is not json' },
  },
  {
    description: '[case2] one text, said',
    given: {
      entries: [
        genEntry({
          uuid: '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
          way: 'out',
          status: 'DELIVERED',
          reason: null,
          re: null,
          what: 'where is book-a-lesson?',
        }),
      ],
      unreadable: [],
      daemon: 'DOWN' as const,
    },
    expect: { contains: 'DELIVERED' },
  },
  {
    description:
      '[case3] a full thread: said, a reply, one that waits, one refused',
    given: {
      entries: [
        genEntry({
          uuid: '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
          way: 'out',
          status: 'DELIVERED',
          reason: null,
          re: null,
          what: 'where is book-a-lesson?\nblocked on aught?',
        }),
        genEntry({
          uuid: 'a1b2c3d4-6e0f-4b9a-8c27-5d31f90e7a46',
          way: 'in',
          status: 'DELIVERED',
          reason: null,
          re: '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
          what: 'pr open; awaits ci',
        }),
        genEntry({
          uuid: '0c5e8f1a-41c6-4b0e-9d2a-0c5e8f1a3b77',
          way: 'out',
          status: 'QUEUED',
          reason: 'peer at a modal',
          re: null,
          what: 'text me when green',
        }),
        genEntry({
          uuid: '20fa7ac9-4dfc-4cbc-be9f-7685b5672a14',
          way: 'out',
          status: 'REFUSED',
          reason: 'no clone mechanic in that tree',
          re: null,
          what: 'hello?',
        }),
      ],
      unreadable: [],
      daemon: 'LIVE' as const,
    },
    expect: { contains: 'QUEUED · peer at a modal' },
  },
  {
    description: '[case4] a QUEUED text, and no daemon live to carry it',
    given: {
      entries: [
        genEntry({
          uuid: '0c5e8f1a-41c6-4b0e-9d2a-0c5e8f1a3b77',
          way: 'out',
          status: 'QUEUED',
          reason: null,
          re: null,
          what: 'text me when green',
        }),
      ],
      unreadable: [],
      daemon: 'DOWN' as const,
    },
    expect: { contains: 'start it: rhx phone.daemon set' },
  },
];

describe('asPhoneTextGetOutput', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the output is rendered', () => {
        const output = asPhoneTextGetOutput(thisCase.given);

        then('it names the fact the reader needs', () => {
          expect(output).toContain(thisCase.expect.contains);
        });

        then('it matches the snapshot', () => {
          expect(output).toMatchSnapshot();
        });
      });
    }),
  );
});
