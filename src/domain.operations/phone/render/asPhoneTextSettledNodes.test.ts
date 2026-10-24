import { given, then, useThen, when } from 'test-fns';

import { asPhoneTextSettledNodes } from './asPhoneTextSettledNodes';
import { asPhoneTreeLines } from './asPhoneTreeLines';

const MECHANIC = 'phone://grove=bert-laptop/tree=svc-lessons/clone=mechanic';

const TEST_CASES: {
  description: string;
  given: Parameters<typeof asPhoneTextSettledNodes>[0];
  expect: { contains: string[]; lacks: string[] };
}[] = [
  {
    description: '[case1] a DELIVERED text',
    given: { status: 'DELIVERED', to: MECHANIC, alias: '7f3e9a02' },
    expect: {
      contains: [
        'a delivered text can not be unsaid',
        'send a correction',
        `--to ${MECHANIC} --re 7f3e9a02`,
      ],
      lacks: ['fix the address'],
    },
  },
  {
    description: '[case2] a REFUSED text',
    given: { status: 'REFUSED', to: MECHANIC, alias: '7f3e9a02' },
    expect: {
      contains: [
        'a refused text never reached the peer',
        'fix the address, then send it fresh',
        'rhx phone.contacts get',
      ],
      lacks: ['send a correction', '--re 7f3e9a02'],
    },
  },
  {
    description: '[case3] a FAULTED text',
    given: { status: 'FAULTED', to: MECHANIC, alias: '7f3e9a02' },
    expect: {
      contains: [
        'may or may not have landed',
        'ask the peer before a resend',
        `--to ${MECHANIC} --re 7f3e9a02`,
      ],
      lacks: ['send a correction', 'never reached'],
    },
  },
];

describe('asPhoneTextSettledNodes', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the advice is rendered', () => {
        const rendered = useThen('it renders', () => ({
          output: asPhoneTreeLines({
            nodes: asPhoneTextSettledNodes(thisCase.given),
          }).join('\n'),
        }));

        then('it names the move this status calls for', () => {
          for (const text of thisCase.expect.contains)
            expect(rendered.output).toContain(text);
        });

        then('it gives no advice that fits another status', () => {
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
