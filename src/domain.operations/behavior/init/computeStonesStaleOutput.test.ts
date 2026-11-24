import { given, then, when } from 'test-fns';

import { computeStonesStaleOutput } from './computeStonesStaleOutput';

describe('computeStonesStaleOutput', () => {
  given('[case1] every kept stone is current', () => {
    when('[t0] the output is computed', () => {
      then('no notice is owed', () => {
        expect(
          computeStonesStaleOutput({
            stonesStale: [],
            behaviorDirRel: '.behavior/v2026_01_01.demo',
          }),
        ).toEqual(null);
      });
    });
  });

  given('[case2] two kept stones differ from their template', () => {
    when('[t0] the output is computed', () => {
      const output = computeStonesStaleOutput({
        stonesStale: ['1.vision.stone', '5.3.verification.stone'],
        behaviorDirRel: '.behavior/v2026_01_01.demo',
      });

      then('each stone is named', () => {
        expect(output).toContain('1.vision.stone');
        expect(output).toContain('5.3.verification.stone');
      });

      then('the header counts in the plural', () => {
        expect(output).toContain(
          '🟡 2 kept stones drifted from their templates, in their whole text',
        );
      });

      then('each stone gets its own resolved remove, then one re-init', () => {
        expect(output).toContain(
          'rhx rmsafe --path .behavior/v2026_01_01.demo/1.vision.stone',
        );
        expect(output).toContain(
          'rhx rmsafe --path .behavior/v2026_01_01.demo/5.3.verification.stone',
        );
        expect(output).toContain('re-run this same init.behavior');
      });

      then('the tree matches the snapshot', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case3] one kept stone differs from its template', () => {
    when('[t0] the output is computed', () => {
      const output = computeStonesStaleOutput({
        stonesStale: ['1.vision.stone'],
        behaviorDirRel: '.behavior/v2026_01_01.demo',
      });

      then('the header counts in the singular', () => {
        expect(output).toContain(
          '🟡 1 kept stone drifted from its template, in its whole text',
        );
      });
    });
  });
});
