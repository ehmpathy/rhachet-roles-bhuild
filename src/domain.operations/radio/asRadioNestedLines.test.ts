import { asRadioNestedLines } from './asRadioNestedLines';

const TEST_CASES = [
  {
    description: 'single-line items each take a branch, the last a corner',
    given: { head: 'a', lines: ['b', 'c'] },
    expect: { output: ['a', '├─ b', '└─ c'].join('\n') },
  },
  {
    description: 'no items leaves the head alone',
    given: { head: 'a', lines: [] },
    expect: { output: 'a' },
  },
  {
    description:
      'a multi-line item that is not last keeps its later lines on its rail',
    given: { head: 'a', lines: [['b', '└─ b1'].join('\n'), 'c'] },
    expect: { output: ['a', '├─ b', '│  └─ b1', '└─ c'].join('\n') },
  },
  {
    description: 'a multi-line item that is last indents its later lines bare',
    given: { head: 'a', lines: ['b', ['c', '├─ c1', '└─ c2'].join('\n')] },
    expect: {
      output: ['a', '├─ b', '└─ c', '   ├─ c1', '   └─ c2'].join('\n'),
    },
  },
  {
    description: 'a nested item nests again, rails intact at each depth',
    given: {
      head: 'a',
      lines: [asRadioNestedLines({ head: 'b', lines: ['b1', 'b2'] }), 'c'],
    },
    expect: {
      output: ['a', '├─ b', '│  ├─ b1', '│  └─ b2', '└─ c'].join('\n'),
    },
  },
];

describe('asRadioNestedLines', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = asRadioNestedLines(thisCase.given);
      expect(output).toEqual(thisCase.expect.output);

      // the tree as a human reads it, for a vibecheck without execution
      expect(output).toMatchSnapshot();
    }),
  );
});
