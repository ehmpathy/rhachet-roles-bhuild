import { given, then, when } from 'test-fns';

import { asVisionRootPurposeReport } from './asVisionRootPurposeReport';
import { getOneVisionRootPurpose } from './getOneVisionRootPurpose';

const VISION =
  '.behavior/v2026_11_08.sandpine-lesson-reminders/1.vision.yield.md';

/**
 * .what = the depth lane's report for a root purpose body (or none)
 * .why  = each case runs the same parse + render the lane runs
 */
const asReportOf = (input: { body: string | null }) => {
  const purpose = getOneVisionRootPurpose({
    markdown: [
      '# vision',
      ...(input.body === null ? [] : ['## .the root purpose', input.body]),
      '## the outcome world',
    ].join('\n'),
  });
  return asVisionRootPurposeReport({ vision: VISION, purpose });
};

describe('asVisionRootPurposeReport', () => {
  given('[case1] a vision with no root purpose section', () => {
    when('[t0] the depth lane reports', () => {
      const report = asReportOf({ body: null });
      then('it is red: 1 blocker', () => {
        expect(report.blockers).toEqual(1);
        expect(report.stdout).toContain('section: absent');
        expect(report.stdout).toContain('fix: add `## .the root purpose`');
      });
      then('stdout holds both numeric lines', () => {
        expect(report.stdout).toContain('1 blocker');
        expect(report.stdout).toContain('0 nitpicks');
      });
      then('stdout matches the snapshot', () => {
        expect(report.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] a root purpose 2 layers deep', () => {
    when('[t0] the depth lane reports', () => {
      const report = asReportOf({
        body: ['- why: a', '  - why: b'].join('\n'),
      });
      then('it is red: 1 blocker, 2 of 3', () => {
        expect(report.blockers).toEqual(1);
        expect(report.stdout).toContain('layers: 2 of 3');
        expect(report.stdout).toContain('ask why of the deepest layer');
      });
      then('stdout matches the snapshot', () => {
        expect(report.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case3] a root purpose 3 layers deep', () => {
    when('[t0] the depth lane reports', () => {
      const report = asReportOf({
        body: ['- why: a', '  - why: b', '    - why: c'].join('\n'),
      });
      then('it is green: 0 blockers', () => {
        expect(report.blockers).toEqual(0);
        expect(report.stdout).toContain('layers: 3 of 3');
        expect(report.stdout).toContain('0 blockers');
        expect(report.stdout).toContain('0 nitpicks');
        expect(report.stdout).not.toContain('[blocker]');
      });
      then('stdout matches the snapshot', () => {
        expect(report.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case4] the scaffold left as is', () => {
    when('[t0] the depth lane reports', () => {
      const report = asReportOf({
        body: [
          '- why: <the surface motive>',
          '  - why: <the motive beneath it>',
          '    - why: <the root motive>',
        ].join('\n'),
      });
      then(
        'it is red with one scaffold blocker, not a second depth one',
        () => {
          expect(report.blockers).toEqual(1);
          expect(report.stdout).toContain('layers: 0 of 3');
          expect(report.stdout).toContain('no motive in 3 layers');
        },
      );
      then('stdout matches the snapshot', () => {
        expect(report.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case5] three whys at one indent', () => {
    when('[t0] the depth lane reports', () => {
      const report = asReportOf({
        body: ['- why: a', '- why: b', '- why: c'].join('\n'),
      });
      then('it is red, and the fix says to nest', () => {
        expect(report.blockers).toEqual(1);
        expect(report.stdout).toContain('layers: 1 of 3');
        expect(report.stdout).toContain('fix: nest each `- why:`');
      });
      then('stdout matches the snapshot', () => {
        expect(report.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case6] whys in another form', () => {
    when('[t0] the depth lane reports', () => {
      const report = asReportOf({
        body: ['1. why a', '2. why b', '3. why c'].join('\n'),
      });
      then('it is red, and the nitpick names the `- why:` form', () => {
        expect(report.blockers).toEqual(1);
        expect(report.nitpicks).toEqual(1);
        expect(report.stdout).toContain(
          'fix: write the first `- why:` bullet under the header',
        );
        expect(report.stdout).toContain(
          'fix: rewrite each as a `- why:` bullet',
        );
      });
      then('stdout matches the snapshot', () => {
        expect(report.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case7] one placeholder among two real layers', () => {
    when('[t0] the depth lane reports', () => {
      const report = asReportOf({
        body: ['- why: a', '  - why: b', '    - why: <the root motive>'].join(
          '\n',
        ),
      });
      then('it is red with both blockers', () => {
        expect(report.blockers).toEqual(2);
        expect(report.stdout).toContain('2 blockers');
        expect(report.stdout).toContain('no motive in 1 layer');
        expect(report.stdout).toContain('2 layers deep');
      });
      then('stdout matches the snapshot', () => {
        expect(report.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case8] three real layers beside whys in another form', () => {
    when('[t0] the depth lane reports', () => {
      const report = asReportOf({
        body: [
          '- why: a',
          '  - why: b',
          '    - why: c',
          '* why: d',
          '1. why e',
        ].join('\n'),
      });
      then('it is green, yet names the unread whys as a nitpick', () => {
        expect(report.blockers).toEqual(0);
        expect(report.nitpicks).toEqual(1);
        expect(report.stdout).toContain('0 blockers');
        expect(report.stdout).toContain('1 nitpick');
        expect(report.stdout).toContain(
          '[nitpick][better] the root purpose holds 2 whys in a form the lane does not read',
        );
      });
      then('stdout matches the snapshot', () => {
        expect(report.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case9] two real layers beside a why in another form', () => {
    when('[t0] the depth lane reports', () => {
      const report = asReportOf({
        body: ['- why: a', '  - why: b', '* why: c'].join('\n'),
      });
      then('it renders both sections: 1 blocker, 1 nitpick', () => {
        expect(report.blockers).toEqual(1);
        expect(report.nitpicks).toEqual(1);
        expect(report.stdout).toContain('   ├─ blockers');
        expect(report.stdout).toContain('   ├─ nitpicks');
        expect(report.stdout).toContain('1 blocker');
        expect(report.stdout).toContain('1 nitpick');
      });
      then('stdout matches the snapshot', () => {
        expect(report.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case10] a root purpose deeper than the floor', () => {
    when('[t0] the depth lane reports', () => {
      const report = asReportOf({
        body: ['- why: a', '  - why: b', '    - why: c', '      - why: d'].join(
          '\n',
        ),
      });
      then('it is green, and names the depth it found', () => {
        expect(report.blockers).toEqual(0);
        expect(report.nitpicks).toEqual(0);
        expect(report.stdout).toContain('layers: 4 of 3');
      });
      then('stdout matches the snapshot', () => {
        expect(report.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case11] a section of prose, with no layer at all', () => {
    when('[t0] the depth lane reports', () => {
      const report = asReportOf({
        body: 'surfers want reminders, because they forget.',
      });
      then(
        'the fix says to write the first `- why:`, not to dig deeper',
        () => {
          expect(report.blockers).toEqual(1);
          expect(report.stdout).toContain('layers: 0 of 3');
          expect(report.stdout).toContain(
            'fix: write the first `- why:` bullet under the header',
          );
          expect(report.stdout).not.toContain('ask why of the deepest layer');
        },
      );
      then('stdout matches the snapshot', () => {
        expect(report.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case12] whys in another form, and no real layer', () => {
    when('[t0] the depth lane reports', () => {
      const report = asReportOf({ body: '* why: a' });
      then(
        'the nitpick names the form, once; the blocker names the depth',
        () => {
          expect(report.blockers).toEqual(1);
          expect(report.nitpicks).toEqual(1);
          expect(report.stdout.match(/a form the lane does not read/g)).toEqual(
            ['a form the lane does not read'],
          );
        },
      );
    });
  });
});
