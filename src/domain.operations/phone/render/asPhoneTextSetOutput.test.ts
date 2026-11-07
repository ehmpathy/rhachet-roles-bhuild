import { given, then, useThen, when } from 'test-fns';

import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';
import { PhoneGroup } from '@src/domain.objects/phone/PhoneGroup';
import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { asPhoneTextSetOutput } from './asPhoneTextSetOutput';

const DIRECTOR = 'phone://grove=bert-laptop/tree=notebook/clone=director';
const MECHANIC =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-book-a-lesson/clone=mechanic';
const FOREMAN =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-book-a-lesson/clone=foreman';
const DIRECTOR_REMOTE =
  'phone://grove=grove-sandpine-v20260901/tree=notebook/clone=director';
const GROUP_UUID = '0c5e8f1a-41c6-4b0e-9d2a-0c5e8f1a3b77';

/**
 * .what = one `out` entry, as `phone.text set` writes it
 */
const genEntry = (input: {
  uuid: string;
  to: string;
  group: string | null;
  re: string | null;
  status?: PhoneTextRecord['status'];
  reason?: string | null;
}): PhoneMailboxEntry => ({
  path: `/mailbox/text.0001.out.json`,
  record: new PhoneTextRecord({
    uuid: input.uuid,
    way: 'out',
    group: input.group,
    re: input.re,
    from: DIRECTOR,
    to: input.to,
    what: 'where is book-a-lesson?',
    status: input.status ?? 'QUEUED',
    reason: input.reason ?? null,
  }),
});

const ONE = genEntry({
  uuid: '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
  to: MECHANIC,
  group: null,
  re: null,
});

/**
 * .what = the group a send to two peers mints, the sender first
 */
const GROUP = new PhoneGroup({
  uuid: GROUP_UUID,
  members: [DIRECTOR, MECHANIC, FOREMAN],
});

/**
 * .what = a group of two, one record per peer, as a group send writes them
 */
const genGroup = (input: { re: string | null }): PhoneMailboxEntry[] => [
  genEntry({
    uuid: '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
    to: MECHANIC,
    group: GROUP_UUID,
    re: input.re,
  }),
  genEntry({
    uuid: 'a1b2c3d4-6e0f-4b9a-8c27-5d31f90e7a46',
    to: FOREMAN,
    group: GROUP_UUID,
    re: input.re,
  }),
];

const TEST_CASES: {
  description: string;
  given: Parameters<typeof asPhoneTextSetOutput>[0];
  expect: { contains: string | string[] };
}[] = [
  {
    description: '[case1] one peer, the receiver daemon found live',
    given: { entries: [ONE], daemon: 'FOUND', duplicates: 0, group: null },
    expect: { contains: "status: QUEUED → the receiver's daemon says it" },
  },
  {
    description: '[case2] one peer, no receiver daemon seen',
    given: {
      entries: [ONE],
      daemon: 'UNCONFIRMED',
      duplicates: 0,
      group: null,
    },
    expect: { contains: 'start one there: rhx phone.daemon set' },
  },
  {
    description: '[case6] one peer, the send started the receiver daemon',
    given: { entries: [ONE], daemon: 'STARTED', duplicates: 0, group: null },
    expect: { contains: "the receiver's daemon woke (was down)" },
  },
  {
    description: '[case7] one peer named twice',
    given: { entries: [ONE], daemon: 'FOUND', duplicates: 1, group: null },
    expect: { contains: '1 repeated --into dropped; each peer gets one text' },
  },
  {
    description: '[case3] one peer, a reply',
    given: {
      entries: [
        genEntry({
          uuid: '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
          to: MECHANIC,
          group: null,
          re: 'a1b2c3d4-6e0f-4b9a-8c27-5d31f90e7a46',
        }),
      ],
      daemon: 'FOUND',
      duplicates: 0,
      group: null,
    },
    expect: { contains: 'text: 7f3e9a02, re a1b2c3d4' },
  },
  {
    description: '[case4] a group of two',
    given: {
      entries: genGroup({ re: null }),
      daemon: 'FOUND',
      duplicates: 0,
      group: GROUP,
    },
    expect: { contains: 'group: group:0c5e8f1a · 2 peers' },
  },
  {
    description: '[case8] a group of two, the send started the receiver daemon',
    given: {
      entries: genGroup({ re: null }),
      daemon: 'STARTED',
      duplicates: 0,
      group: GROUP,
    },
    expect: { contains: "the receiver's daemon woke (was down); it says them" },
  },
  {
    description: '[case9] a group of two, no receiver daemon seen',
    given: {
      entries: genGroup({ re: null }),
      daemon: 'UNCONFIRMED',
      duplicates: 0,
      group: GROUP,
    },
    expect: { contains: 'start one there: rhx phone.daemon set' },
  },
  {
    description: '[case10] a group of two, a reply, one peer named twice',
    given: {
      entries: genGroup({ re: 'c41d8e5b-6e0f-4b9a-8c27-5d31f90e7a46' }),
      daemon: 'FOUND',
      duplicates: 1,
      group: GROUP,
    },
    expect: { contains: 'group: group:0c5e8f1a · 2 peers, re c41d8e5b' },
  },
  {
    description: '[case5] no entries',
    given: { entries: [], daemon: 'FOUND', duplicates: 0, group: null },
    expect: {
      contains: ['naught to send', 'status: naught sent; no peer was named'],
    },
  },
  {
    description: '[case11] one peer on another grove, no tree here woke',
    given: {
      entries: [
        genEntry({
          uuid: '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
          to: DIRECTOR_REMOTE,
          group: null,
          re: null,
        }),
      ],
      daemon: 'NONE',
      duplicates: 0,
      group: null,
    },
    expect: {
      contains: "into the inbox on its grove; that grove's daemon says it",
    },
  },
  {
    description:
      '[case12] one peer on another grove, whose grove refused the text',
    given: {
      entries: [
        genEntry({
          uuid: '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
          to: DIRECTOR_REMOTE,
          group: null,
          re: null,
          status: 'REFUSED',
          reason: 'no clone answers to @:director in that tree',
        }),
      ],
      daemon: 'NONE',
      duplicates: 0,
      group: null,
    },
    expect: {
      contains: [
        'REFUSED no clone answers to @:director in that tree',
        'status: naught QUEUED; the fate of each is named above',
      ],
    },
  },
];

describe('asPhoneTextSetOutput', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the output is rendered', () => {
        const rendered = useThen('it renders', () => ({
          output: asPhoneTextSetOutput(thisCase.given),
        }));

        then('it names the fact the sender needs', () => {
          [thisCase.expect.contains]
            .flat()
            .map((fact) => expect(rendered.output).toContain(fact));
        });

        then('it matches the snapshot', () => {
          expect(rendered.output).toMatchSnapshot();
        });
      });
    }),
  );
});
