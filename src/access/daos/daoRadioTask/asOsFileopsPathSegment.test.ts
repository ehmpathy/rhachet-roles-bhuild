import { getError } from 'test-fns';

import { asOsFileopsPathSegment } from './asOsFileopsPathSegment';

const CASES_PLAIN = [
  { description: 'a repo owner', value: 'sandpine' },
  { description: 'a repo name with a dash and a dot', value: 'svc-lessons.v2' },
  { description: 'a minted exid', value: '3f9a1c2e' },
  { description: 'an exid with an underscore', value: 'lesson_42' },
];

const CASES_CLIMB = [
  { description: 'a parent climb', value: '../../etc' },
  { description: 'a bare parent', value: '..' },
  { description: 'a separator', value: 'sandpine/svc-lessons' },
  { description: 'a backslash', value: 'a\\b' },
  { description: 'a shell metachar', value: '7; touch pwned' },
  { description: 'an empty value', value: '' },
];

describe('asOsFileopsPathSegment', () => {
  CASES_PLAIN.map((thisCase) =>
    test(`keeps ${thisCase.description}`, () => {
      expect(
        asOsFileopsPathSegment({ value: thisCase.value, of: 'exid' }),
      ).toEqual(thisCase.value);
    }),
  );

  CASES_CLIMB.map((thisCase) =>
    test(`refuses ${thisCase.description}`, () => {
      const error = getError(() =>
        asOsFileopsPathSegment({ value: thisCase.value, of: 'exid' }),
      );
      expect(error.message).toContain('is not a plain path segment');
    }),
  );
});
