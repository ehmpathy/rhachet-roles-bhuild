import { isEhmpathEmail } from './isEhmpathEmail';

const TEST_CASES: { description: string; email: string; expect: boolean }[] = [
  {
    description: 'admits an address at the ehmpath.com domain',
    email: 'seaturtle@ehmpath.com',
    expect: true,
  },
  {
    description: 'admits the domain regardless of case and outer whitespace',
    email: '  Beaver@EHMPATH.com\n',
    expect: true,
  },
  {
    description: 'admits the seaturtle clone noreply',
    email: '259600029+ehm-seaturtle@users.noreply.github.com',
    expect: true,
  },
  {
    description: 'admits the seaturtle app bot noreply',
    email: '295111357+ehm-a-seaturtle[bot]@users.noreply.github.com',
    expect: true,
  },
  {
    description: 'refuses a human address',
    email: 'bert@example.com',
    expect: false,
  },
  {
    description: 'refuses a lookalike domain',
    email: 'bert@notehmpath.com.evil.example',
    expect: false,
  },
  {
    description: 'refuses a domain that only ends in ehmpath.com text',
    email: 'bert@fakeehmpath.com',
    expect: false,
  },
  {
    description:
      'refuses a subdomain of ehmpath.com (the bar is the apex domain, per fulcrum F1)',
    email: 'bot@ci.ehmpath.com',
    expect: false,
  },
  {
    description: 'refuses a bare domain with no local part',
    email: '@ehmpath.com',
    expect: false,
  },
  {
    description: 'refuses some other noreply',
    email: '1+bert@users.noreply.github.com',
    expect: false,
  },
  {
    description: 'refuses an empty string',
    email: '',
    expect: false,
  },
];

describe('isEhmpathEmail', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isEhmpathEmail({ email: thisCase.email })).toEqual(
        thisCase.expect,
      );
    }),
  );
});
