import { given, then, useThen, when } from 'test-fns';

import { PhoneAddress } from '@src/domain.objects/phone/PhoneAddress';
import { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';

import { asPhoneContactsGetOutput } from './asPhoneContactsGetOutput';

const DIRECTOR = 'phone://grove=bert-laptop/tree=notebook/clone=director';
const CREW_OTHER =
  'phone://grove=grove-sandpine-v20260901/tree=svc-lessons.beav.feat-coachbook/clone=mechanic';
const CREW_LIVE =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-spot-forecast-widget/clone=mechanic';
const CREW_DEAD =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-cert-ingest/clone=mechanic';
const CREW_DEAF =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-coachbook/clone=foreman';
const CREW_GONE =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-board-rentals/clone=mechanic';
const CREW_UNBORN =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-wetsuit-stock/clone=mechanic';

const SELF = new PhoneSelf({
  serial: '20fa7ac9-4dfc-4cbc-be9f-7685b5672a14',
  treeDir:
    '/home/bert/git/sandpine/_worktrees/svc-lessons.beav.feat-book-a-lesson',
  address: new PhoneAddress({
    grove: 'bert-laptop',
    tree: 'svc-lessons.beav.feat-book-a-lesson',
    clone: 'mechanic',
  }),
});

const TEST_CASES: {
  description: string;
  given: Parameters<typeof asPhoneContactsGetOutput>[0];
  expect: { contains: string };
}[] = [
  {
    description: '[case1] no contacts, no inbound, an empty tree',
    given: {
      self: SELF,
      reach: {
        contacts: [],
        inbound: [],
        ownTree: [],
        contactsUnreadable: null,
      },
      reachStateOf: {},
    },
    expect: { contains: 'grant one: rhx phone.contacts set --address' },
  },
  {
    description:
      '[case4] a contacts file no reader here can parse, as a newer writer would leave',
    given: {
      self: SELF,
      reach: {
        contacts: [],
        inbound: [],
        ownTree: [],
        contactsUnreadable: {
          path: '/home/bert/git/sandpine/_worktrees/svc-lessons.beav.feat-book-a-lesson/.agent/.cache/repo=bhuild/role=dispatcher/skill=phone.contacts/clone=mechanic/contacts.json',
          reason: 'phone contacts file has an unknown shape',
        },
      },
      reachStateOf: {},
    },
    expect: { contains: 'unreadable, read as no grants' },
  },
  {
    description:
      '[case3] a tree with DEAD clones enrolled before the LIVE one, as a long-lived tree holds',
    given: {
      self: SELF,
      reach: {
        contacts: [],
        inbound: [],
        ownTree: [
          {
            serial: '7289120d-1a2b-4c3d-8e4f-5a6b7c8d9e0f',
            slug: null,
            reachState: 'DEAD',
          },
          {
            serial: '64758597-2b3c-4d5e-9f60-7a8b9c0d1e2f',
            slug: 'mechanic',
            reachState: 'DEAD',
          },
          {
            serial: '9b3d7e10-5c2a-4f8e-a1b6-2e7f0d4c8a91',
            slug: null,
            reachState: 'DEAF',
          },
          {
            serial: '25a53ac8-3c4d-4e5f-8a71-8b9c0d1e2f30',
            slug: 'foreman',
            reachState: 'LIVE',
          },
        ],
        contactsUnreadable: null,
      },
      reachStateOf: {},
    },
    expect: { contains: '+ 2 DEAD, not shown (see all: rhx clone list)' },
  },
  {
    description:
      '[case2] contacts, a sender that texted first, and its own tree',
    given: {
      self: SELF,
      reach: {
        contacts: [DIRECTOR],
        inbound: [CREW_OTHER],
        ownTree: [
          {
            serial: '4c1e8b27-9a0f-4d2e-8b31-6f7a0c5d2e19',
            slug: 'foreman',
            reachState: 'LIVE',
          },
          {
            serial: '9b3d7e10-5c2a-4f8e-a1b6-2e7f0d4c8a91',
            slug: null,
            reachState: 'DEAF',
          },
        ],
        contactsUnreadable: null,
      },
      reachStateOf: { [DIRECTOR]: 'LIVE', [CREW_OTHER]: 'other grove' },
    },
    expect: { contains: 'texted you' },
  },
  {
    description:
      '[case5] a contact in each reach state the producer can emit: a clone state, gone, no clone yet, other grove',
    given: {
      self: SELF,
      reach: {
        contacts: [
          CREW_LIVE,
          CREW_DEAD,
          CREW_DEAF,
          CREW_GONE,
          CREW_UNBORN,
          CREW_OTHER,
        ],
        inbound: [],
        ownTree: [],
        contactsUnreadable: null,
      },
      reachStateOf: {
        [CREW_LIVE]: 'LIVE',
        [CREW_DEAD]: 'DEAD',
        [CREW_DEAF]: 'DEAF',
        [CREW_GONE]: 'gone',
        [CREW_UNBORN]: 'no clone yet',
        [CREW_OTHER]: 'other grove',
      },
    },
    expect: { contains: '(no clone yet)' },
  },
];

describe('asPhoneContactsGetOutput', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the output is rendered', () => {
        const rendered = useThen('it renders', () => ({
          output: asPhoneContactsGetOutput(thisCase.given),
        }));

        then('it names who this clone may reach', () => {
          expect(rendered.output).toContain(thisCase.expect.contains);
        });

        then('it matches the snapshot', () => {
          expect(rendered.output).toMatchSnapshot();
        });
      });
    }),
  );
});
