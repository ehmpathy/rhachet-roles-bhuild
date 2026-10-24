import { given, then, useThen, when } from 'test-fns';

import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';
import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { asPhoneTextSetOutput } from './asPhoneTextSetOutput';

const DIRECTOR = 'phone://grove=bert-laptop/tree=notebook/clone=director';
const MECHANIC =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-book-a-lesson/clone=mechanic';
const FOREMAN =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-book-a-lesson/clone=foreman';

/**
 * .what = one QUEUED `out` entry, as `phone.text set` writes it
 */
const genEntry = (input: {
  uuid: string;
  to: string;
  group: string | null;
  re: string | null;
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
    status: 'QUEUED',
    reason: null,
  }),
});

const ONE = genEntry({
  uuid: '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
  to: MECHANIC,
  group: null,
  re: null,
});

/**
 * .what = a group of two, one record per peer, as a group send writes them
 */
const genGroup = (input: { re: string | null }): PhoneMailboxEntry[] => [
  genEntry({
    uuid: '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
    to: MECHANIC,
    group: '0c5e8f1a-41c6-4b0e-9d2a-0c5e8f1a3b77',
    re: input.re,
  }),
  genEntry({
    uuid: 'a1b2c3d4-6e0f-4b9a-8c27-5d31f90e7a46',
    to: FOREMAN,
    group: '0c5e8f1a-41c6-4b0e-9d2a-0c5e8f1a3b77',
    re: input.re,
  }),
];

const TEST_CASES = [
  {
    description: '[case1] one peer, the daemon found live',
    given: { entries: [ONE], daemon: 'FOUND' as const, duplicates: 0 },
    expect: { contains: 'status: QUEUED → the daemon carries it' },
  },
  {
    description: '[case2] one peer, no daemon seen',
    given: { entries: [ONE], daemon: 'UNCONFIRMED' as const, duplicates: 0 },
    expect: { contains: 'start one: rhx phone.daemon set' },
  },
  {
    description: '[case6] one peer, the send started the daemon',
    given: { entries: [ONE], daemon: 'STARTED' as const, duplicates: 0 },
    expect: { contains: 'a daemon started (was down)' },
  },
  {
    description: '[case7] one peer named twice',
    given: { entries: [ONE], daemon: 'FOUND' as const, duplicates: 1 },
    expect: { contains: '1 repeated --to dropped; each peer gets one text' },
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
      daemon: 'FOUND' as const,
      duplicates: 0,
    },
    expect: { contains: 'text: 7f3e9a02, re a1b2c3d4' },
  },
  {
    description: '[case4] a group of two',
    given: {
      entries: genGroup({ re: null }),
      daemon: 'FOUND' as const,
      duplicates: 0,
    },
    expect: { contains: 'group: 2 peers' },
  },
  {
    description: '[case8] a group of two, the send started the daemon',
    given: {
      entries: genGroup({ re: null }),
      daemon: 'STARTED' as const,
      duplicates: 0,
    },
    expect: { contains: 'a daemon started (was down); it carries them' },
  },
  {
    description: '[case9] a group of two, no daemon seen',
    given: {
      entries: genGroup({ re: null }),
      daemon: 'UNCONFIRMED' as const,
      duplicates: 0,
    },
    expect: { contains: 'start one: rhx phone.daemon set' },
  },
  {
    description: '[case10] a group of two, a reply, one peer named twice',
    given: {
      entries: genGroup({ re: 'c41d8e5b-6e0f-4b9a-8c27-5d31f90e7a46' }),
      daemon: 'FOUND' as const,
      duplicates: 1,
    },
    expect: { contains: 'group: 2 peers, re c41d8e5b' },
  },
  {
    description: '[case5] no entries',
    given: { entries: [], daemon: 'FOUND' as const, duplicates: 0 },
    expect: {
      contains: ['naught to send', 'status: naught sent; no peer was named'],
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
