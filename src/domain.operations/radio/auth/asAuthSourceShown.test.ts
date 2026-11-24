import type { AuthSource } from './AuthSource';
import { asAuthSourceShown } from './asAuthSourceShown';

const TEST_CASES: {
  description: string;
  given: { authSource: AuthSource | null };
  expect: string | null;
}[] = [
  {
    description: 'a keyrack hit names keyrack',
    given: { authSource: { auth: 'as-ehmpath', spot: 'keyrack' } },
    expect: 'as-ehmpath (via keyrack)',
  },
  {
    description: 'an ambient hit names ambient',
    given: { authSource: { auth: 'as-ehmpath', spot: 'ambient' } },
    expect: 'as-ehmpath (via ambient)',
  },
  {
    description: 'a default send on a human email names that email',
    given: {
      authSource: {
        auth: 'as-human',
        spot: 'ambient',
        email: 'bert@example.com',
      },
    },
    expect: 'as-human (via ambient email bert@example.com)',
  },
  {
    description: 'a send with no traced source shows naught',
    given: { authSource: null },
    expect: null,
  },
];

describe('asAuthSourceShown', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asAuthSourceShown(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
