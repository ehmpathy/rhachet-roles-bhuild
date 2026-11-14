import { asFlagsParsedFromCliText } from './asFlagsParsedFromCliText';

const TEST_CASES = [
  {
    description: 'reads each named key as its flag',
    given: {
      text: 'const schemaOfArgs = z.object({\n  named: z.object({\n    via: z.string(),\n    into: z.string(),\n  }),\n  ordered: z.array(z.string()),\n});',
    },
    expect: ['--via', '--into'],
  },
  {
    description: 'reads a camelCase key as its kebab flag',
    given: {
      text: '  named: z.object({\n    includeIgnored: z.boolean().default(false),\n  }),',
    },
    expect: ['--include-ignored'],
  },
  {
    description: 'reads keys past a nested object, and never the nested keys',
    given: {
      text: '  named: z.object({\n    via: z.string(),\n    auth: z.object({\n      token: z.string(),\n    }).nullable(),\n    into: z.string(),\n  }),',
    },
    expect: ['--via', '--auth', '--into'],
  },
  {
    description: 'parses naught from a key that sits outside the named schema',
    given: {
      text: '// usage: --barin\nconst other = z.object({\n  barin: z.string(),\n});',
    },
    expect: [],
  },
];

describe('asFlagsParsedFromCliText', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asFlagsParsedFromCliText(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
