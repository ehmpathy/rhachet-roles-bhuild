import { asLaneSlugList } from './asLaneSlugList';

const TEST_CASES = [
  { description: 'an absent flag is no slug', given: null, expect: [] },
  { description: 'one slug', given: 'mech-', expect: ['mech-'] },
  {
    description: 'several slugs, spaces trimmed',
    given: 'mech- , prose-of',
    expect: ['mech-', 'prose-of'],
  },
  {
    description: 'a stray or trailed comma yields no blank slug',
    given: ',mech-,,',
    expect: ['mech-'],
  },
];

describe('asLaneSlugList', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asLaneSlugList({ raw: thisCase.given })).toEqual(thisCase.expect);
    }),
  );
});
