import { given, then, when } from 'test-fns';

import { computeGuardsStaleOutput } from './computeGuardsStaleOutput';

describe('computeGuardsStaleOutput', () => {
  given('[case1] every kept guard is current', () => {
    when('[t0] the output is computed', () => {
      then('no notice is owed', () => {
        expect(
          computeGuardsStaleOutput({
            guardsStale: [],
            behaviorDirRel: '.behavior/v2026_10_21.book-a-lesson',
          }),
        ).toEqual(null);
      });
    });
  });

  given('[case2] two kept guards lack template reviews', () => {
    when('[t0] the output is computed', () => {
      const output = computeGuardsStaleOutput({
        guardsStale: [
          {
            guard: '1.vision.guard',
            slugsAbsent: [
              'has-questioned-fulcrum-research',
              'yagni-and-simplicity',
            ],
          },
          {
            guard: '5.1.execution.from_vision.guard',
            slugsAbsent: ['dispatch-lives-with-its-route'],
          },
        ],
        behaviorDirRel: '.behavior/v2026_10_21.book-a-lesson',
      });

      then('each guard names the upgrade command for its own stone', () => {
        expect(output).toContain(
          'rhx route.guard.upgrade --stone 1.vision --route .behavior/v2026_10_21.book-a-lesson',
        );
        expect(output).toContain(
          'rhx route.guard.upgrade --stone 5.1.execution.from_vision --route .behavior/v2026_10_21.book-a-lesson',
        );
      });

      then('the header counts in the plural', () => {
        expect(output).toContain(
          '🟡 2 kept guards lack reviews their templates hold',
        );
      });

      then('the tree matches the snapshot', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case3] one kept guard lacks a template review', () => {
    when('[t0] the output is computed', () => {
      const output = computeGuardsStaleOutput({
        guardsStale: [
          { guard: '1.vision.guard', slugsAbsent: ['yagni-and-simplicity'] },
        ],
        behaviorDirRel: '.behavior/v2026_10_21.book-a-lesson',
      });

      then('the header counts in the singular', () => {
        expect(output).toContain(
          '🟡 1 kept guard lacks reviews its template holds',
        );
      });
    });
  });
});
