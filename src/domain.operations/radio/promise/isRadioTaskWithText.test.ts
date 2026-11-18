import { given, then, when } from 'test-fns';

import { isRadioTaskWithText } from './isRadioTaskWithText';

const TEST_CASES = [
  {
    description: 'a title alone is text',
    given: { title: 'lesson reminder', description: null },
    expect: { output: true },
  },
  {
    description: 'a body alone is text',
    given: { title: null, description: 'remind each surfer a day ahead' },
    expect: { output: true },
  },
  {
    description: 'an empty title is still text: it would be sent',
    given: { title: '', description: null },
    expect: { output: true },
  },
  {
    description: 'no title and no body is no text',
    given: { title: null, description: null },
    expect: { output: false },
  },
];

describe('isRadioTaskWithText', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the task is asked whether it carries text', () => {
        then(`it reads ${thisCase.expect.output}`, () => {
          expect(isRadioTaskWithText(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
