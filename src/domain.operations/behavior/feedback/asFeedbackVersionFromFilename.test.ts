import { given, then, when } from 'test-fns';

import { asFeedbackVersionFromFilename } from './asFeedbackVersionFromFilename';

describe('asFeedbackVersionFromFilename', () => {
  given('[case1] a valid feedback filename', () => {
    when('[t0] version is extracted', () => {
      then('returns the version number', () => {
        const result = asFeedbackVersionFromFilename({
          filename: '1.vision.yield.[feedback].v1.[given].by_human.md',
          artifactFileName: '1.vision.yield',
        });
        expect(result).toBe(1);
      });
    });
  });

  given('[case2] a feedback filename with higher version', () => {
    when('[t0] version is extracted', () => {
      then('returns the correct version number', () => {
        const result = asFeedbackVersionFromFilename({
          filename: '3.blueprint.yield.[feedback].v42.[given].by_human.md',
          artifactFileName: '3.blueprint.yield',
        });
        expect(result).toBe(42);
      });
    });
  });

  given('[case3] a non-feedback filename', () => {
    when('[t0] version extraction is attempted', () => {
      then('returns null', () => {
        const result = asFeedbackVersionFromFilename({
          filename: '1.vision.yield.md',
          artifactFileName: '1.vision.yield',
        });
        expect(result).toBe(null);
      });
    });
  });

  given('[case4] a feedback filename for a different artifact', () => {
    when('[t0] version extraction is attempted', () => {
      then('returns null', () => {
        const result = asFeedbackVersionFromFilename({
          filename: '2.criteria.yield.[feedback].v1.[given].by_human.md',
          artifactFileName: '1.vision.yield',
        });
        expect(result).toBe(null);
      });
    });
  });

  given('[case5] artifact name with special regex characters', () => {
    when('[t0] version is extracted', () => {
      then('correctly escapes and matches', () => {
        const result = asFeedbackVersionFromFilename({
          filename: 'file.with.dots.[feedback].v3.[given].by_human.md',
          artifactFileName: 'file.with.dots',
        });
        expect(result).toBe(3);
      });
    });
  });
});
