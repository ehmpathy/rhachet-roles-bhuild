import type { IsoDateStamp } from 'iso-time';
import { given, then, when } from 'test-fns';

import { getTimestampFound } from '../../../../.test/utils/getTimestampFound';
import { RadioTask } from '../../../../domain.objects/RadioTask';
import { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../../domain.objects/RadioTaskStatus';
import { composeTaskIntoGhIssues } from './composeTaskIntoGhIssues';

describe('composeTaskIntoGhIssues', () => {
  given('[case1] task in QUEUED status', () => {
    const task = new RadioTask({
      exid: '142',
      title: 'fix flaky test',
      description: 'timeout in ci needs attention',
      status: RadioTaskStatus.QUEUED,
      repo: new RadioTaskRepo({ owner: 'ehmpathy', name: 'acme-app' }),
      pushedBy: 'casey',
      pushedAt: '2026-01-30' as IsoDateStamp,
      claimedBy: null,
      claimedAt: null,
      deliveredAt: null,
      branch: null,
    });

    when('[t0] composed into gh.issues format', () => {
      then('title has radio emoji prefix', () => {
        const result = composeTaskIntoGhIssues({ task });
        expect(result.title).toEqual('🎙️ task - fix flaky test');
      });

      then('body contains dispatch header', () => {
        const result = composeTaskIntoGhIssues({ task });
        expect(result.body).toContain('🦫🎙️   dispatch to foreman');
      });

      then('body contains enqueued section', () => {
        const result = composeTaskIntoGhIssues({ task });
        expect(result.body).toContain('💧 task enqueued');
        expect(result.body).toContain('├─ priority = ?');
      });

      then('body does not contain tree section', () => {
        const result = composeTaskIntoGhIssues({ task });
        expect(result.body).not.toContain('🌲');
      });

      then('body contains title and description sections', () => {
        const result = composeTaskIntoGhIssues({ task });
        expect(result.body).toContain('**title**');
        expect(result.body).toContain('fix flaky test');
        expect(result.body).toContain('**description**');
        expect(result.body).toContain('timeout in ci needs attention');
      });

      then('matches snapshot', () => {
        const result = composeTaskIntoGhIssues({ task });
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case2] task in CLAIMED status with branch', () => {
    const task = new RadioTask({
      exid: '142',
      title: 'fix flaky test',
      description: 'timeout in ci needs attention',
      status: RadioTaskStatus.CLAIMED,
      repo: new RadioTaskRepo({ owner: 'ehmpathy', name: 'acme-app' }),
      pushedBy: 'casey',
      pushedAt: '2026-01-30' as IsoDateStamp,
      claimedBy: 'foreman',
      claimedAt: '2026-01-30' as IsoDateStamp,
      deliveredAt: null,
      branch: 'foreman/fix-flaky-test',
    });

    when('[t0] composed into gh.issues format', () => {
      then('body contains tree planted section', () => {
        const result = composeTaskIntoGhIssues({ task });
        expect(result.body).toContain(
          '🌲 tree planted at foreman/fix-flaky-test',
        );
      });

      then('matches snapshot', () => {
        const result = composeTaskIntoGhIssues({ task });
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case3] task in DELIVERED status with branch', () => {
    const task = new RadioTask({
      exid: '142',
      title: 'fix flaky test',
      description: 'timeout in ci needs attention',
      status: RadioTaskStatus.DELIVERED,
      repo: new RadioTaskRepo({ owner: 'ehmpathy', name: 'acme-app' }),
      pushedBy: 'casey',
      pushedAt: '2026-01-30' as IsoDateStamp,
      claimedBy: 'foreman',
      claimedAt: '2026-01-30' as IsoDateStamp,
      deliveredAt: '2026-01-31' as IsoDateStamp,
      branch: 'foreman/fix-flaky-test',
    });

    when('[t0] composed into gh.issues format', () => {
      then('body contains tree delivered section', () => {
        const result = composeTaskIntoGhIssues({ task });
        expect(result.body).toContain(
          '🌲 tree delivered at foreman/fix-flaky-test',
        );
      });

      then(
        'title and body hold no time of day (rule.forbid.timestamps-in-tracked-files)',
        () => {
          const result = composeTaskIntoGhIssues({ task });
          expect(
            getTimestampFound({
              content: `${result.title}\n${result.body}`,
            }),
          ).toEqual(null);
        },
      );

      then('matches snapshot', () => {
        const result = composeTaskIntoGhIssues({ task });
        expect(result).toMatchSnapshot();
      });
    });
  });

  given(
    '[case4] a task in each status (rule.forbid.timestamps-in-tracked-files)',
    () => {
      const tasks = [
        RadioTaskStatus.QUEUED,
        RadioTaskStatus.CLAIMED,
        RadioTaskStatus.DELIVERED,
      ].map(
        (status) =>
          new RadioTask({
            exid: '144',
            title: 'book-a-lesson reminder',
            description: 'remind the surfer the day before the lesson',
            status,
            repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
            pushedBy: 'bert',
            pushedAt: '2026-01-30' as IsoDateStamp,
            claimedBy: status === RadioTaskStatus.QUEUED ? null : 'foreman',
            claimedAt:
              status === RadioTaskStatus.QUEUED
                ? null
                : ('2026-01-30' as IsoDateStamp),
            deliveredAt:
              status === RadioTaskStatus.DELIVERED
                ? ('2026-01-31' as IsoDateStamp)
                : null,
            branch:
              status === RadioTaskStatus.QUEUED
                ? null
                : 'foreman/lesson-reminder',
          }),
      );

      when('[t0] each is composed into gh.issues format', () => {
        then('no status branch writes a time of day in title or body', () => {
          tasks.forEach((task) => {
            const result = composeTaskIntoGhIssues({ task });
            expect(
              getTimestampFound({
                content: `${result.title}\n${result.body}`,
              }),
            ).toEqual(null);
          });
        });
      });
    },
  );
});
