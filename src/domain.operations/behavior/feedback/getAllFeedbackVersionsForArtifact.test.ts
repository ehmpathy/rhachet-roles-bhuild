import { given, then, when } from 'test-fns';

import { getAllFeedbackVersionsForArtifact } from './getAllFeedbackVersionsForArtifact';

describe('getAllFeedbackVersionsForArtifact', () => {
  given('[case1] empty filenames array', () => {
    when('[t0] versions are extracted', () => {
      then('returns empty array', () => {
        const result = getAllFeedbackVersionsForArtifact({
          filenames: [],
          artifactFileName: '1.vision.yield',
        });
        expect(result).toEqual([]);
      });
    });
  });

  given('[case2] filenames with one match', () => {
    when('[t0] versions are extracted', () => {
      then('returns array with one version', () => {
        const result = getAllFeedbackVersionsForArtifact({
          filenames: ['1.vision.yield.[feedback].v1.[given].by_human.md'],
          artifactFileName: '1.vision.yield',
        });
        expect(result).toEqual([1]);
      });
    });
  });

  given('[case3] filenames with multiple versions', () => {
    when('[t0] versions are extracted', () => {
      then('returns all versions', () => {
        const result = getAllFeedbackVersionsForArtifact({
          filenames: [
            '1.vision.yield.[feedback].v1.[given].by_human.md',
            '1.vision.yield.[feedback].v3.[given].by_human.md',
            '1.vision.yield.[feedback].v2.[given].by_human.md',
          ],
          artifactFileName: '1.vision.yield',
        });
        expect(result).toEqual([1, 3, 2]);
      });
    });
  });

  given('[case4] filenames with no matches', () => {
    when('[t0] versions are extracted', () => {
      then('returns empty array', () => {
        const result = getAllFeedbackVersionsForArtifact({
          filenames: [
            'readme.md',
            '1.vision.yield.md',
            'other.[feedback].v1.[given].by_human.md',
          ],
          artifactFileName: '1.vision.yield',
        });
        expect(result).toEqual([]);
      });
    });
  });

  given('[case5] filenames with mixed matches and non-matches', () => {
    when('[t0] versions are extracted', () => {
      then('returns only versions from matches', () => {
        const result = getAllFeedbackVersionsForArtifact({
          filenames: [
            '1.vision.yield.[feedback].v1.[given].by_human.md',
            'readme.md',
            '1.vision.yield.[feedback].v2.[given].by_human.md',
            '2.criteria.[feedback].v1.[given].by_human.md',
          ],
          artifactFileName: '1.vision.yield',
        });
        expect(result).toEqual([1, 2]);
      });
    });
  });
});
