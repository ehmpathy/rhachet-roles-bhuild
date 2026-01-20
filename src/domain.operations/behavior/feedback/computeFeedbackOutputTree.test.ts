import { computeFeedbackOutputTree } from './computeFeedbackOutputTree';

const TEST_CASES = [
  {
    description: 'created file without opener shows + symbol and --open tip',
    given: {
      feedbackPathRel:
        '.behavior/v2026_01_15.test/5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
      found: false,
    },
    expect: {
      contains: ['🦫 wassup?', '├─ +', 'tip: use --open codium'],
      notContains: ['tip: use --version'],
    },
  },
  {
    description: 'created file with opener shows + symbol and opened message',
    given: {
      feedbackPathRel:
        '.behavior/v2026_01_15.test/5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
      found: false,
      opener: 'codium',
    },
    expect: {
      contains: ['🦫 wassup?', '├─ +', '├─ opened in codium'],
      notContains: ['tip: use --open'],
    },
  },
  {
    description:
      'found file without opener shows ✓ symbol, --version tip, and --open tip',
    given: {
      feedbackPathRel:
        '.behavior/v2026_01_15.test/5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
      found: true,
      version: 1,
    },
    expect: {
      contains: [
        '🦫 wassup?',
        '├─ ✓',
        'tip: use --version 2',
        'tip: use --open codium',
      ],
    },
  },
  {
    description:
      'found file with opener shows ✓ symbol, --version tip, and opened message',
    given: {
      feedbackPathRel:
        '.behavior/v2026_01_15.test/5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
      found: true,
      version: 1,
      opener: 'code',
    },
    expect: {
      contains: [
        '🦫 wassup?',
        '├─ ✓',
        'tip: use --version 2',
        '├─ opened in code',
      ],
      notContains: ['tip: use --open codium'],
    },
  },
  {
    description: 'found file version 2 suggests version 3',
    given: {
      feedbackPathRel:
        '.behavior/v2026_01_15.test/5.1.execution.v1.i1.md.[feedback].v2.[given].by_human.md',
      found: true,
      version: 2,
    },
    expect: {
      contains: ['tip: use --version 3'],
    },
  },
];

describe('computeFeedbackOutputTree', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = computeFeedbackOutputTree(thisCase.given);

      // check expected substrings present
      for (const expected of thisCase.expect.contains) {
        expect(output).toContain(expected);
      }

      // check unexpected substrings absent
      for (const notExpected of thisCase.expect.notContains ?? []) {
        expect(output).not.toContain(notExpected);
      }
    }),
  );

  test('snapshot: created without opener', () => {
    const output = computeFeedbackOutputTree({
      feedbackPathRel:
        '.behavior/v2026_01_15.test/5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
      found: false,
    });
    expect(output).toMatchSnapshot();
  });

  test('snapshot: created with opener', () => {
    const output = computeFeedbackOutputTree({
      feedbackPathRel:
        '.behavior/v2026_01_15.test/5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
      found: false,
      opener: 'codium',
    });
    expect(output).toMatchSnapshot();
  });

  test('snapshot: found without opener', () => {
    const output = computeFeedbackOutputTree({
      feedbackPathRel:
        '.behavior/v2026_01_15.test/5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
      found: true,
      version: 1,
    });
    expect(output).toMatchSnapshot();
  });

  test('snapshot: found with opener', () => {
    const output = computeFeedbackOutputTree({
      feedbackPathRel:
        '.behavior/v2026_01_15.test/5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
      found: true,
      version: 1,
      opener: 'codium',
    });
    expect(output).toMatchSnapshot();
  });
});
