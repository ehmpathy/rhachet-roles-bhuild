import { given, then, useThen, when } from 'test-fns';

import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';
import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { asPhoneTextDelOutput } from './asPhoneTextDelOutput';

const ENTRY: PhoneMailboxEntry = {
  path: '/mailbox/text.0001.out.json',
  record: new PhoneTextRecord({
    uuid: '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
    way: 'out',
    group: null,
    re: null,
    from: 'phone://grove=bert-laptop/tree=notebook/clone=director',
    to: 'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-book-a-lesson/clone=mechanic',
    what: 'where is book-a-lesson?',
    status: 'WITHDRAWN',
    reason: null,
  }),
};

const TEST_CASES = [
  {
    description: '[case1] a QUEUED text is withdrawn',
    given: { entry: ENTRY, statusBefore: 'QUEUED' as const },
    expect: { contains: 'status: QUEUED → WITHDRAWN (never said)' },
  },
  {
    description: '[case2] a text already withdrawn',
    given: { entry: ENTRY, statusBefore: 'WITHDRAWN' as const },
    expect: { contains: 'status: WITHDRAWN (no change)' },
  },
];

describe('asPhoneTextDelOutput', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the output is rendered', () => {
        const rendered = useThen('it renders', () => ({
          output: asPhoneTextDelOutput(thisCase.given),
        }));

        then('it names the status change', () => {
          expect(rendered.output).toContain(thisCase.expect.contains);
        });

        then('it matches the snapshot', () => {
          expect(rendered.output).toMatchSnapshot();
        });
      });
    }),
  );
});
