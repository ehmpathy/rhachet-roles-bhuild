import { given, then, useThen, when } from 'test-fns';

import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { asPhoneTextSaid } from './asPhoneTextSaid';

const DIRECTOR = 'phone://grove=bert-laptop/tree=notebook/clone=director';
const MECHANIC =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-book-a-lesson/clone=mechanic';

/**
 * .what = one `in` record, as the receiver tree's daemon says it
 */
const genRecord = (input: {
  group: string | null;
  re: string | null;
}): PhoneTextRecord =>
  new PhoneTextRecord({
    uuid: '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
    way: 'in',
    group: input.group,
    re: input.re,
    from: DIRECTOR,
    to: MECHANIC,
    what: 'where is book-a-lesson?\nblocked on aught?',
    status: 'QUEUED',
    reason: null,
  });

const TEST_CASES: {
  description: string;
  given: Parameters<typeof genRecord>[0];
  expect: { contains: string[]; lacks: string[] };
}[] = [
  {
    description: '[case1] a text to one peer',
    given: { group: null, re: null },
    expect: {
      contains: [
        `text 7f3e9a02 from ${DIRECTOR}`,
        `rhx phone.text set --into ${DIRECTOR} --re 7f3e9a02 --what '...'`,
        'where is book-a-lesson?',
      ],
      lacks: ['to group:', 'the whole group', 'the sender alone', '--to '],
    },
  },
  {
    description: '[case2] a reply to a text',
    given: { group: null, re: 'a1b2c3d4-6e0f-4b9a-8c27-5d31f90e7a46' },
    expect: {
      contains: [`from ${DIRECTOR} (re a1b2c3d4)`],
      lacks: ['to group:'],
    },
  },
  {
    description: '[case3] a text to a group',
    given: { group: '0c5e8f1a-41c6-4b0e-9d2a-0c5e8f1a3b77', re: null },
    expect: {
      contains: [
        `text 7f3e9a02 from ${DIRECTOR} to group:0c5e8f1a`,
        "the whole group: rhx phone.text set --re 7f3e9a02 --what '...'",
        `the sender alone: rhx phone.text set --into ${DIRECTOR} --re 7f3e9a02 --what '...'`,
      ],
      lacks: ['--to '],
    },
  },
  {
    description: '[case4] a reply to a group text',
    given: {
      group: '0c5e8f1a-41c6-4b0e-9d2a-0c5e8f1a3b77',
      re: 'a1b2c3d4-6e0f-4b9a-8c27-5d31f90e7a46',
    },
    expect: {
      contains: [`to group:0c5e8f1a (re a1b2c3d4)`],
      lacks: [],
    },
  },
];

describe('asPhoneTextSaid', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the text is rendered for the peer pane', () => {
        const rendered = useThen('it renders', () => ({
          output: asPhoneTextSaid({ record: genRecord(thisCase.given) }),
        }));

        then('it carries the facts the peer needs to reply', () => {
          for (const text of thisCase.expect.contains)
            expect(rendered.output).toContain(text);
        });

        then('it carries no form that fits another text', () => {
          for (const text of thisCase.expect.lacks)
            expect(rendered.output).not.toContain(text);
        });

        then('it matches the snapshot', () => {
          expect(rendered.output).toMatchSnapshot();
        });
      });
    }),
  );
});
